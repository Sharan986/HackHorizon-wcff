# HackHorizon Backend API Documentation

Welcome to the backend API reference. This platform uses standard REST conventions, returns JSON-encoded responses, and leverages standard HTTP response codes.

## Base URL
Ensure you attach this Base URL prior to endpoints when querying: `http://localhost:8000` (or your active production host).

## Authentication Handling
Endpoints marked with **[🔒 Authenticated]** require a Bearer token in the `Authorization` header.
```http
Authorization: Bearer <your_access_token>
```

---

# 1. User & Authentication

### `POST /register`
Registers a new platform user.
- **Payload** (JSON): Use `password` and `confirm_password`.
  ```json
  {
    "name": "John Doe",
    "username": "johndoe1",
    "email": "john@example.com",
    "password": "securepassword123",
    "confirm_password": "securepassword123"
  }
  ```
- **Returns**: `{"message": "User registered successfully"}` (201 Created)

### `POST /login`
Exchanges user credentials for a valid JWT Bearer token.
- **Payload** (JSON):
  ```json
  {
    "identifier": "johndoe1", // can be username OR email
    "password": "securepassword123"
  }
  ```
- **Returns**: Information block containing token and user status flags.
  ```json
  {
    "access_token": "eyJhbGciOiJIUz...",
    "token_type": "bearer",
    "is_employee": false,
    "has_employee_onboarded": false
  }
  ```

---

# 2. Worker Onboarding & Profiles

### `POST /make-employee` [🔒 Authenticated]
Flip a general user into a registered employee.
- **Returns**: `{"message": "User status updated to employee"}`

### `POST /onboard` [🔒 Authenticated]
Complete the employee profile details and immediately fetch their geographical **NASA Environmental Profile** in the background, also triggering an asynchronous AI Health Score compilation.
- **Payload** (JSON):
  ```json
  {
    "job_role": "Mining Engineer",
    "working_since": "2021-05-01",
    "work_location": "Dhanbad, Jharkhand", // Free-text string, auto-geocoded!
    "allergies": "Dust, Pollen",
    "existing_conditions": "Mild asthma"
  }
  ```
- **Returns**: `{"message": "Onboarding successful..."}`

### `PATCH /profile` [🔒 Authenticated]
Edit existing user profile attributes. If `work_location` is modified, the system automatically runs the geocoding/NASA workflow internally and drops the old risk-score recalculating it for the new location.
- **Payload** (JSON): Update only what is needed.
  ```json
  {
    "allergies": "Dust, Pollen, Peanuts",
    "work_location": "Bokaro Steel City"
  }
  ```
- **Returns**: `{"message": "Profile updated successfully, health score recalculating"}`

---

# 3. OCR & Scanning Intelligence

### `POST /scan` 
Raw OCR endpoint. Uploads an image, passes to NVIDIA NeMo Retriever API, and automatically structures results via Gemma-LLM into JSON.
- **Format**: `multipart/form-data`
- **Fields**: 
  - `file`: (File, required) The image you want scanned.
- **Returns**:
  ```json
  {
     "data": { "patient_name": "...", "diagnosis": "...", "medications": [...] }
  }
  ```

---

# 4. Patient Medical Reports CRUD

### `POST /createreport` [🔒 Authenticated]
Constructs a patient medical report contextually linked to the employee alongside auto-extracting prescription papers via NVIDIA OCR API immediately inside the form stream. Triggers an AI health recalculation upon save.
- **Format**: `multipart/form-data`
- **Parameters**: 
  - `report_type` (String, required)
  - `report_name` (String, required)
  - `report_description` (String, optional)
  - `report_conclusion` (String, optional)
  - `report_date` (String, optional)
  - `doctor_name` (String, optional)
  - `hospital_or_clinic` (String, optional)
  - `tags` (String, optional)
  - `has_prescription` (Boolean) - Trigger OCR scanning?
  - `prescription_file` (File, optional) - Target for text extraction process
  - `has_documents` (Boolean) - Are you uploading standard attachment files?
  - `documents` (Files, optional array) - PDFs, PNGs. Will automatically break PDF to individual PNG pages!
- **Returns**: 
  ```json
  {
    "message": "Report created successfully",
    "report_id": 1,
    "extracted_prescription": true,
    "saved_documents": 2
  }
  ```

### `GET /reports` [🔒 Authenticated]
Returns an array list of all `PatientReport`s associated with the current user.

### `GET /reports/{report_id}` [🔒 Authenticated]
Retrieve deep data about a specific report ID strictly matching the viewing user.

### `PATCH /reports/{report_id}` [🔒 Authenticated]
Partially update an existing report object strictly.
- **Payload** (JSON): Include any combination of `report_type`, `report_name`, `tags`, etc.
- **Returns**: `{"message": "Report updated successfully", "report_id": 1}`
- *(Note: Trigger AI recalculation instantly)*

### `DELETE /reports/{report_id}` [🔒 Authenticated]
Completely erase a report and automatically scrubs stored raw PDF/PNGs on the server disk to protect privacy.
- **Returns**: `{"message": "Report deleted successfully"}`
- *(Note: Trigger AI recalculation instantly)*

---

# 5. Diagnostic Health AI (Gemma 9B)

### `GET /health-score` [🔒 Authenticated]
Fetches your customized, cross-examined AI Health Risk representation. It is handled synchronously utilizing NASA Climate values + OCR Medical Diagnosis context.
- **Returns Scenarios**:
  - *If it has never been calculated:*
    `{"status": "not_calculated", "message": "Health score has not been calculated yet."}`
  - *If a Background pipeline is actively evaluating it using NVIDIA inferencing (Progress state):*
    `{"status": "calculating", "message": "Your health score is currently being analyzed.", "last_score": 67, ...}`
  - *If evaluation is complete and available:*
    ```json
    {
      "status": "ready",
      "score": 85, // Scale 0-100. Higher means More Danger!
      "suggestions": [
        "Increase hydration immediately.",
        "Consult a pulmonologist regarding the asthma and high dust anomalies."
      ],
      "last_calculated": "2026-04-11T12:00:00.000Z"
    }
    ```

---

# 6. Secure Split-Key Report Sharing

These endpoints utilize an AES-256-GCM architecture intended for Client-Side decryption.

### `POST /sharereport` [🔒 Authenticated]
Generates a private view-only share token encompassing an array of medical reports.
- **Payload** (JSON):
  ```json
  {
    "report_ids": [1, 5, 8],
    "permanent": false, // boolean flag (true = no expire)
    "expires_hours": 24 // Defaults to 24
  }
  ```
- **Returns**:
  ```json
  {
    "share_id": "df65...uuid",
    "pin": "492019" // 6 Digit User Key 
  }
  ```

### `GET /sharereport/{share_id}?pin=XXXXXX`
*(Public endpoint, no Bearer auth needed!)*
Validates the pin and retrieves the locked AES payload for the user's browser native integration script (`WebCrypto`) to securely compile logic over.
- **Returns**: Base64 values for the Frontend decoding algorithm.
  ```json
  {
    "encrypted_payload": "base64==",
    "nonce": "base64==",
    "key_part_a": "base64==",
    "share_id": "df65..."
  }
  ```
- *(Note: Will automatically secure-lock and invalidate permanently on 10 continuous wrong PIN attempts to stop brute force.)*
