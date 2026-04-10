import base64
import requests
from config import NVIDIA_OCR_API_KEY

INVOKE_URL = "https://ai.api.nvidia.com/v1/cv/nvidia/nemoretriever-ocr"

def extract_text_from_image(image_bytes: bytes) -> str:
    image_b64 = base64.b64encode(image_bytes).decode()
    
    headers = {
        "Authorization": f"Bearer {NVIDIA_OCR_API_KEY}",
        "Accept": "application/json"
    }
    
    payload = {
        "input": [
            {
                "type": "image_url",
                "url": f"data:image/png;base64,{image_b64}"
            }
        ]
    }
    
    response = requests.post(INVOKE_URL, headers=headers, json=payload)
    response.raise_for_status()
    
    data = response.json()
    
    texts = []
    try:
        if "data" in data and len(data["data"]) > 0:
            for item in data["data"][0].get("text_detections", []):
                text = item.get("text_prediction", {}).get("text", "")
                if text:
                    texts.append(text)
    except (KeyError, IndexError):
        return ""
        
    return "\n".join(texts)

SYSTEM_PROMPT = """You are a medical document parser. You receive raw OCR text from prescriptions and medical reports. Return a single valid JSON object. 

Try to structure the JSON logically. If present, extract information into general categories like:
- "doctor": object containing name, qualifications, clinic_or_hospital, etc.
- "patient": object containing name, age, sex
- "date": string
- "diagnosis": string
- "medications": array of objects (name, dosage, frequency, duration, instructions)
- "tests_or_investigations": array of strings
- "advice": array of strings

RULES:
1. Output MUST be valid JSON.
2. Do NOT wrap in markdown code blocks.
3. Only extract what is present in the text. You can omit keys if the data is not there."""

def _strip_markdown(content: str) -> str:
    import re
    content = content.strip()
    content = re.sub(r'^```(?:json)?\s*', '', content)
    content = re.sub(r'\s*```$', '', content)
    content = content.strip()
    first_brace = content.find('{')
    last_brace = content.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        content = content[first_brace:last_brace + 1]
    return content


def format_text_to_json(raw_text: str, max_retries: int = 2) -> dict:
    import json, requests, time, re

    url = "https://integrate.api.nvidia.com/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {NVIDIA_OCR_API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    user_prompt = f"""
You MUST return ONLY valid JSON.
No explanation, no extra text, no markdown.

Format:
{{
  "doctor": "",
  "patient_name": "",
  "age": "",
  "date": "",
  "medicines": [],
  "notes": ""
}}

TEXT:
{raw_text[:800]}
"""

    payload = {
        "model": "google/gemma-2-2b-it",
        "messages": [
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 512,
    }

    last_error = None

    for attempt in range(max_retries + 1):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()

            data = response.json()
            content = data["choices"][0]["message"]["content"]

            print("RAW MODEL OUTPUT:\n", content)

            # ✅ check empty
            if not content or not content.strip():
                raise ValueError("Empty response from model")

            # ✅ remove markdown
            content = content.replace("```json", "").replace("```", "").strip()

            # ✅ extract ALL json blocks (non-greedy)
            matches = re.findall(r'\{.*?\}', content, re.DOTALL)

            if not matches:
                raise ValueError("No valid JSON found")

            # ✅ take first valid JSON
            clean_json = matches[0]

            parsed = json.loads(clean_json)

            # ✅ normalize + deduplicate medicines
            if "medicines" in parsed:
                seen = set()
                clean = []

                for m in parsed["medicines"]:
                    if isinstance(m, dict):
                        name = m.get("name", "").strip().lower()
                        key = name
                        value = m
                    else:
                        name = str(m).strip().lower()
                        key = name
                        value = {"name": m}

                    if key and key not in seen:
                        seen.add(key)
                        clean.append(value)

                parsed["medicines"] = clean

            return parsed

        except Exception as e:
            last_error = e
            time.sleep(2 * (attempt + 1))  # retry backoff

    return {
        "_raw_text": raw_text,
        "_extraction_error": str(last_error)
    }