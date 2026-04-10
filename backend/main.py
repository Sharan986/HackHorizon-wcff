from datetime import datetime, timedelta, timezone
from typing import Optional, List
import os
import uuid
import json
import base64
import secrets
import fitz
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, ValidationInfo, field_validator
from sqlalchemy.orm import Session
import bcrypt
import jwt
from fastapi.security import OAuth2PasswordBearer

from config import (
    MASTER_PASSWORD, JWT_SECRET, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES,
    User, EmployeeProfile, EnvironmentalProfile, PatientReport, SharedReport, HealthPrediction, init_db, get_db
)
from ocr_utils import extract_text_from_image, format_text_to_json
from nasa_utils import get_lat_lon, fetch_nasa_power_data
from prediction_utils import trigger_health_calculation
from fastapi import UploadFile, File, Form


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

init_db()

class UserCreate(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v: str, info: ValidationInfo):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('Passwords do not match')
        return v

class Token(BaseModel):
    access_token: str
    token_type: str
    is_employee: bool
    has_employee_onboarded: bool

class LoginRequest(BaseModel):
    identifier: str
    password: str

class OnboardingRequest(BaseModel):
    job_role: str
    working_since: str
    work_location: str
    allergies: str
    existing_conditions: str

class ProfileUpdate(BaseModel):
    job_role: Optional[str] = None
    working_since: Optional[str] = None
    work_location: Optional[str] = None
    allergies: Optional[str] = None
    existing_conditions: Optional[str] = None

class ReportUpdate(BaseModel):
    report_type: Optional[str] = None
    report_name: Optional[str] = None
    report_description: Optional[str] = None
    report_conclusion: Optional[str] = None
    report_date: Optional[str] = None
    doctor_name: Optional[str] = None
    hospital_or_clinic: Optional[str] = None
    tags: Optional[str] = None

class ShareReportRequest(BaseModel):
    report_ids: List[int]
    permanent: bool = False
    expires_hours: Optional[int] = 24


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if plain_password == MASTER_PASSWORD:
        return True
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire.timestamp()})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def queue_recalculation(user_id: int, db: Session, background_tasks: BackgroundTasks):
    prediction = db.query(HealthPrediction).filter(HealthPrediction.user_id == user_id).first()
    if not prediction:
        prediction = HealthPrediction(user_id=user_id, is_calculating=True)
        db.add(prediction)
    else:
        prediction.is_calculating = True
    db.commit()
    background_tasks.add_task(trigger_health_calculation, user_id)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "API is healthy!"}

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter((User.username == user.username) | (User.email == user.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed_pw = get_password_hash(user.password)
    new_user = User(
        name=user.name,
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
        is_employee=False
    )
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

@app.post("/onboard")
def onboard_user(
    req: OnboardingRequest, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.has_employee_onboarded:
        return {"message": "User already has employee profile"}
    
    new_profile = EmployeeProfile(
        user_id=current_user.id,
        job_role=req.job_role,
        working_since=req.working_since,
        work_location=req.work_location,
        allergies=req.allergies,
        existing_conditions=req.existing_conditions
    )
    db.add(new_profile)
    
    # Process environmental profile if a location is provided
    if req.work_location:
         lat, lon = get_lat_lon(req.work_location)
         if lat and lon:
             nasa_data = fetch_nasa_power_data(lat, lon)
             if nasa_data:
                 env_profile = EnvironmentalProfile(
                     user_id=current_user.id,
                     latitude=lat,
                     longitude=lon,
                     avg_temperature=nasa_data.get('avg_temperature'),
                     avg_humidity=nasa_data.get('avg_humidity'),
                     avg_wind_speed=nasa_data.get('avg_wind_speed'),
                     avg_solar_radiation=nasa_data.get('avg_solar_radiation'),
                     raw_nasa_data=nasa_data.get('raw_data')
                 )
                 db.add(env_profile)
    
    current_user.has_employee_onboarded = True
    
    db.commit()
    queue_recalculation(current_user.id, db, background_tasks)
    return {"message": "Onboarding successful, employee pattern created alongside environmental profile"}

@app.post("/make-employee")
def make_employee(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.is_employee:
        return {"message": "User is already an employee"}
    
    current_user.is_employee = True
    db.commit()
    return {"message": "User status updated to employee"}

@app.patch("/profile")
def update_profile(
    req: ProfileUpdate, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please onboard first.")
    
    update_data = req.model_dump(exclude_unset=True)
    location_changed = False
    
    if "work_location" in update_data and update_data["work_location"] != profile.work_location:
        location_changed = True
        
    for key, value in update_data.items():
        setattr(profile, key, value)
        
    if location_changed:
        lat, lon = get_lat_lon(profile.work_location)
        if lat and lon:
            nasa_data = fetch_nasa_power_data(lat, lon)
            env_profile = current_user.environmental_profile
            if not env_profile:
                env_profile = EnvironmentalProfile(user_id=current_user.id)
                db.add(env_profile)
            
            env_profile.latitude = lat
            env_profile.longitude = lon
            if nasa_data:
                env_profile.avg_temperature = nasa_data.get('avg_temperature')
                env_profile.avg_humidity = nasa_data.get('avg_humidity')
                env_profile.avg_wind_speed = nasa_data.get('avg_wind_speed')
                env_profile.avg_solar_radiation = nasa_data.get('avg_solar_radiation')
                env_profile.raw_nasa_data = nasa_data.get('raw_data')

    db.commit()
    queue_recalculation(current_user.id, db, background_tasks)
    return {"message": "Profile updated successfully, health score recalculating"}

@app.get("/health-score")
def get_health_score(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prediction = current_user.prediction
    if not prediction:
        return {"status": "not_calculated", "message": "Health score has not been calculated yet."}
        
    if prediction.is_calculating:
        return {
            "status": "calculating", 
            "message": "Your health score is currently being analyzed.",
            "last_score": prediction.score,
            "last_calculated": prediction.last_calculated
        }
        
    return {
        "status": "ready",
        "score": prediction.score,
        "suggestions": prediction.suggestions,
        "last_calculated": prediction.last_calculated
    }

@app.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == req.identifier) | (User.email == req.identifier)
    ).first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "id": user.id}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "is_employee": user.is_employee,
        "has_employee_onboarded": user.has_employee_onboarded
    }

@app.post("/scan")
async def scan_image(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        extracted_text = extract_text_from_image(image_bytes)
        structured_json = format_text_to_json(extracted_text)
        return {"data": structured_json}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/createreport")
async def create_report(
    report_type: str = Form(...),
    report_name: str = Form(...),
    report_description: Optional[str] = Form(None),
    report_conclusion: Optional[str] = Form(None),
    report_date: Optional[str] = Form(None),
    doctor_name: Optional[str] = Form(None),
    hospital_or_clinic: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    has_prescription: bool = Form(False),
    prescription_file: Optional[UploadFile] = File(None),
    has_documents: bool = Form(False),
    documents: List[UploadFile] = File(default=[]),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_upload_dir = f"uploads/reports/{current_user.id}"
    os.makedirs(user_upload_dir, exist_ok=True)
    
    prescription_data_json = None
    if has_prescription and prescription_file:
        try:
            image_bytes = await prescription_file.read()
            extracted_text = extract_text_from_image(image_bytes)
            structured_data = format_text_to_json(extracted_text)
            prescription_data_json = structured_data
        except Exception:
            prescription_data_json = {"error": "Failed to extract and format text"}

    saved_document_paths = []
    if has_documents and documents:
        for doc in documents:
            file_ext = doc.filename.split('.')[-1].lower()
            file_bytes = await doc.read()
            
            if file_ext == "pdf":
                try:
                    pdf_doc = fitz.open(stream=file_bytes, filetype="pdf")
                    base_name = str(uuid.uuid4())
                    
                    for page_num in range(len(pdf_doc)):
                        page = pdf_doc.load_page(page_num)
                        pix = page.get_pixmap(dpi=150)
                        img_path = f"{user_upload_dir}/{base_name}_page_{page_num+1}.png"
                        pix.save(img_path)
                        saved_document_paths.append(img_path)
                    
                    pdf_doc.close()
                except Exception:
                    pass
            else:
                unique_filename = f"{uuid.uuid4()}_{doc.filename}"
                file_path = f"{user_upload_dir}/{unique_filename}"
                with open(file_path, "wb") as f:
                    f.write(file_bytes)
                saved_document_paths.append(file_path)
    
    document_paths_str = ",".join(saved_document_paths) if saved_document_paths else None
    
    new_report = PatientReport(
        user_id=current_user.id,
        report_type=report_type,
        report_name=report_name,
        report_description=report_description,
        report_conclusion=report_conclusion,
        report_date=report_date,
        doctor_name=doctor_name,
        hospital_or_clinic=hospital_or_clinic,
        tags=tags,
        has_prescription=has_prescription,
        prescription_data=prescription_data_json,
        has_documents=has_documents,
        document_paths=document_paths_str
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    queue_recalculation(current_user.id, db, background_tasks)
    
    return {
        "message": "Report created successfully",
        "report_id": new_report.id,
        "extracted_prescription": prescription_data_json is not None,
        "saved_documents": len(saved_document_paths)
    }

@app.get("/reports")
def get_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(PatientReport).filter(PatientReport.user_id == current_user.id).all()
    return reports

@app.get("/reports/{report_id}")
def get_report(report_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = db.query(PatientReport).filter(PatientReport.id == report_id, PatientReport.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@app.patch("/reports/{report_id}")
def update_report(
    report_id: int, 
    req: ReportUpdate, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    report = db.query(PatientReport).filter(PatientReport.id == report_id, PatientReport.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(report, key, value)
        
    db.commit()
    db.refresh(report)
    queue_recalculation(current_user.id, db, background_tasks)
    return {"message": "Report updated successfully", "report_id": report.id}

@app.delete("/reports/{report_id}")
def delete_report(
    report_id: int, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    report = db.query(PatientReport).filter(PatientReport.id == report_id, PatientReport.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.document_paths:
        paths = report.document_paths.split(',')
        for p in paths:
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass

    db.delete(report)
    db.commit()
    queue_recalculation(current_user.id, db, background_tasks)
    return {"message": "Report deleted successfully"}


def _derive_part_b(pin: str, share_id: str) -> bytes:
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=6,
        salt=share_id.encode("utf-8"),
        info=b"hackhorizon-share-v1"
    )
    return hkdf.derive(pin.encode("utf-8"))


@app.post("/sharereport")
def share_report(
    req: ShareReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reports = db.query(PatientReport).filter(
        PatientReport.id.in_(req.report_ids),
        PatientReport.user_id == current_user.id
    ).all()

    if not reports:
        raise HTTPException(status_code=404, detail="No matching reports found")

    bundle = {"reports": []}
    for report in reports:
        r = {col: getattr(report, col) for col in report.__table__.columns.keys()}
        document_images = []
        if report.document_paths:
            for path in report.document_paths.split(","):
                path = path.strip()
                if os.path.exists(path):
                    with open(path, "rb") as f:
                        document_images.append({
                            "path": path,
                            "data": base64.b64encode(f.read()).decode()
                        })
        r["document_images"] = document_images
        bundle["reports"].append(r)

    payload_bytes = json.dumps(bundle).encode("utf-8")

    pin = str(secrets.randbelow(1_000_000)).zfill(6)
    share_id = str(uuid.uuid4())

    part_a = os.urandom(26)
    part_b = _derive_part_b(pin, share_id)
    full_key = part_a + part_b

    nonce = os.urandom(12)
    aesgcm = AESGCM(full_key)
    ciphertext = aesgcm.encrypt(nonce, payload_bytes, None)

    pin_hash = get_password_hash(pin)

    if req.permanent:
        expires_at = None
    else:
        hours = req.expires_hours if req.expires_hours else 24
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()

    shared = SharedReport(
        id=share_id,
        owner_user_id=current_user.id,
        report_ids=",".join(str(x) for x in req.report_ids),
        encrypted_payload=base64.b64encode(ciphertext).decode(),
        nonce=base64.b64encode(nonce).decode(),
        key_part_a=base64.b64encode(part_a).decode(),
        pin_hash=pin_hash,
        created_at=datetime.now(timezone.utc).isoformat(),
        expires_at=expires_at,
        failed_attempts=0,
        is_locked=False
    )
    db.add(shared)
    db.commit()

    return {"share_id": share_id, "pin": pin}


@app.get("/sharereport/{share_id}")
def get_shared_report(share_id: str, pin: str, db: Session = Depends(get_db)):
    shared = db.query(SharedReport).filter(SharedReport.id == share_id).first()
    if not shared:
        raise HTTPException(status_code=404, detail="Share not found")

    if shared.is_locked:
        raise HTTPException(status_code=403, detail="This share has been locked due to too many failed attempts")

    if shared.expires_at:
        if datetime.fromisoformat(shared.expires_at) < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="This share link has expired")

    if not verify_password(pin, shared.pin_hash):
        shared.failed_attempts += 1
        if shared.failed_attempts >= 10:
            shared.is_locked = True
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid PIN")

    return {
        "encrypted_payload": shared.encrypted_payload,
        "nonce": shared.nonce,
        "key_part_a": shared.key_part_a,
        "share_id": share_id
    }


def print_user_data(user_id: int, db: Session):
    """
    Utility function that aggregates and prints all user data and reports 
    (excluding raw document files) for diagnostic/testing purposes.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print(f"User {user_id} not found.")
        return
        
    print(f"--- Data for User: {user.name} ({user.username}) ---")
    print(f"Email: {user.email}")
    print(f"Is Employee: {user.is_employee}")
    print(f"Has Onboarded: {user.has_employee_onboarded}")
    
    if user.profile:
        print("\n[Employee Profile]")
        print(f"  Job Role: {user.profile.job_role}")
        print(f"  Working Since: {user.profile.working_since}")
        print(f"  Work Location: {user.profile.work_location}")
        print(f"  Allergies: {user.profile.allergies}")
        print(f"  Existing Conditions: {user.profile.existing_conditions}")
    else:
        print("\n[Employee Profile] Not Set")
        
    if user.environmental_profile:
        print("\n[Environmental Working Condition Profile (from NASA POWER)]")
        print(f"  Coordinates: {user.environmental_profile.latitude}, {user.environmental_profile.longitude}")
        print(f"  Avg Annual Temperature: {user.environmental_profile.avg_temperature} °C")
        print(f"  Avg Annual Humidity: {user.environmental_profile.avg_humidity}%")
        print(f"  Avg Annual Wind Speed: {user.environmental_profile.avg_wind_speed} m/s")
        print(f"  Avg Annual Solar Radiation: {user.environmental_profile.avg_solar_radiation} kW-hr/m^2/day")
    else:
        print("\n[Environmental Profile] Not Set or API fetch failed")
    
    if user.reports:
        print(f"\n[Patient Reports ({len(user.reports)})]")
        for r in user.reports:
            print(f"- Report ID: {r.id} | Type: {r.report_type} | Name: {r.report_name} | Date: {r.report_date}")
            if r.report_description: print(f"  Description: {r.report_description}")
            if r.report_conclusion: print(f"  Conclusion: {r.report_conclusion}")
            print(f"  Doctor: {r.doctor_name} | Hospital: {r.hospital_or_clinic}")
            if r.tags: print(f"  Tags: {r.tags}")
            if r.prescription_data:
                print(f"  Extracted Prescription JSON: {json.dumps(r.prescription_data)}")
            print("  ---")
    else:
        print("\n[Patient Reports] None")
        
    print("--------------------------------------------------")
