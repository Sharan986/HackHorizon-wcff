import os
import json
import requests
from config import SessionLocal, User, HealthPrediction
from datetime import datetime, timezone

NVIDIA_API_KEY = os.getenv("NVIDIA_OCR_API_KEY", "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")
GEMMA_9B_MODEL = "google/gemma-2-9b-it"

def aggregate_user_context(user: User) -> str:
    context = f"User: {user.name} (Identifier: {user.username})\n"
    if user.profile:
        context += f"Job Role: {user.profile.job_role}\n"
        context += f"Working Since: {user.profile.working_since}\n"
        context += f"Work Location: {user.profile.work_location}\n"
        context += f"Allergies: {user.profile.allergies}\n"
        context += f"Existing Conditions: {user.profile.existing_conditions}\n"
    
    if user.environmental_profile:
        context += f"Environment (Avg Temp): {user.environmental_profile.avg_temperature} C\n"
        context += f"Environment (Avg Humidity): {user.environmental_profile.avg_humidity}%\n"
        context += f"Environment (Wind Speed): {user.environmental_profile.avg_wind_speed} m/s\n"
        
    if user.reports:
        context += f"Medical Reports ({len(user.reports)} total):\n"
        for idx, r in enumerate(user.reports):
            context += f"--- Report {idx+1} ({r.report_type}) ---\n"
            context += f"Name: {r.report_name}, Date: {r.report_date}\n"
            context += f"Description: {r.report_description}\n"
            context += f"Conclusion: {r.report_conclusion}\n"
            context += f"Doctor/Hospital: {r.doctor_name} at {r.hospital_or_clinic}\n"
            if r.prescription_data:
                context += f"Prescription: {json.dumps(r.prescription_data)}\n"
    return context

def trigger_health_calculation(user_id: int):
    """
    Background task to calculate the health risk score.
    Must open its own DB session!
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
            
        prediction = db.query(HealthPrediction).filter(HealthPrediction.user_id == user.id).first()
        
        if not prediction:
            prediction = HealthPrediction(user_id=user.id, is_calculating=True)
            db.add(prediction)
            db.commit()
            db.refresh(prediction)
        
        # Assemble context
        current_context = aggregate_user_context(user)
        
        # Prepare Prompt
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert AI Health Analyst. You will receive a patient's medical history, "
                    "workplace environmental data, and personal health profile. "
                    "You must evaluate their Health Risk Score from 0 to 100, where 100 means CRITICAL DANGER "
                    "and 0 means PERFECT HEALTH. "
                    "Provide up to 2 concise strings of suggestions to improve health. If the risk is high (>60), "
                    "explicitly recommend consulting a specific type of doctor. "
                    "Respond ONLY with a valid JSON object matching this schema: "
                    '{"score": 85, "suggestions": ["Improve hydration", "Consult a cardiologist immediately"]}'
                )
            }
        ]
        
        user_prompt = f"### CURRENT PATIENT PROFILE ###\n{current_context}\n\n"
        if prediction.previous_context and prediction.score is not None:
            user_prompt += f"### PREVIOUS PATIENT PROFILE (For Reference) ###\n{prediction.previous_context}\n"
            user_prompt += f"Previous Score was: {prediction.score}\n"
            user_prompt += "Consider if their condition has worsened or improved based on the new data updating your score appropriately.\n"
            
        user_prompt += "\nOutput ONLY the JSON object. Do not include markdown blocks or any other text."
        
        messages.append({"role": "user", "content": user_prompt})
        
        api_url = "https://integrate.api.nvidia.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {NVIDIA_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": GEMMA_9B_MODEL,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 1024,
            "response_format": {"type": "json_object"}
        }
        
        try:
            response = requests.post(api_url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Clean up potential markdown formatting
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            elif content.startswith("```"):
                content = content.replace("```", "").strip()
                
            parsed_json = json.loads(content)
            
            # Update DB
            prediction.score = parsed_json.get("score", 0)
            prediction.suggestions = parsed_json.get("suggestions", [])
            prediction.previous_context = current_context
            prediction.last_calculated = datetime.now(timezone.utc).isoformat()
            prediction.is_calculating = False
            
            db.commit()
            
        except Exception as e:
            print(f"Error calling LLM for health prediction: {e}")
            prediction.is_calculating = False
            db.commit()

    finally:
        db.close()
