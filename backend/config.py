import os
import secrets
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, JSON, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

load_dotenv()

MASTER_PASSWORD = os.getenv("MASTER_PASSWORD", "SuperSecretMaster123")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
NVIDIA_OCR_API_KEY = os.getenv("NVIDIA_OCR_API_KEY", "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")

SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_employee = Column(Boolean, default=False)
    has_employee_onboarded = Column(Boolean, default=False)
    private_key = Column(String, default=lambda: secrets.token_hex(32))

    profile = relationship("EmployeeProfile", back_populates="user", uselist=False)
    reports = relationship("PatientReport", back_populates="user")
    shared_reports = relationship("SharedReport", back_populates="owner")

class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    job_role = Column(String, nullable=True)
    working_since = Column(String, nullable=True)
    work_location = Column(String, nullable=True)
    allergies = Column(String, nullable=True)
    existing_conditions = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")

class PatientReport(Base):
    __tablename__ = "patient_reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    report_type = Column(String)
    report_name = Column(String)
    report_description = Column(String, nullable=True)
    report_conclusion = Column(String, nullable=True)

    report_date = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    hospital_or_clinic = Column(String, nullable=True)
    tags = Column(String, nullable=True)

    has_prescription = Column(Boolean, default=False)
    prescription_data = Column(JSON, nullable=True)

    has_documents = Column(Boolean, default=False)
    document_paths = Column(String, nullable=True)

    user = relationship("User", back_populates="reports")

class SharedReport(Base):
    __tablename__ = "shared_reports"
    id = Column(String, primary_key=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"))
    report_ids = Column(String)
    encrypted_payload = Column(Text)
    nonce = Column(String)
    key_part_a = Column(String)
    pin_hash = Column(String)
    created_at = Column(String)
    expires_at = Column(String, nullable=True)
    failed_attempts = Column(Integer, default=0)
    is_locked = Column(Boolean, default=False)

    owner = relationship("User", back_populates="shared_reports")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
