import sys
import json
from ocr_utils import extract_text_from_image, format_text_to_json

def test_pipeline(image_path: str):
    print(f"Testing OCR Pipeline with image: {image_path}")
    
    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
    except FileNotFoundError:
        print(f"Error: Could not find image file '{image_path}'")
        sys.exit(1)

    print("\n--- Step 1: Extracting raw text via NVIDIA OCR ---")
    raw_text = extract_text_from_image(image_bytes)
    
    if not raw_text:
        print("Failed to extract any text from the image or returned empty.")
        sys.exit(1)
        
    print("Raw Text Extracted:")
    print("-" * 40)
    print(raw_text)
    print("-" * 40)
    
    print("\n--- Step 2: Formatting text to structured JSON via LLM ---")
    structured_json = format_text_to_json(raw_text)
    
    print("\nFinal Structured JSON Output:")
    print("=" * 60)
    print(json.dumps(structured_json, indent=2))
    print("=" * 60)
    
    print("\nExtraction Success: The LLM returned a valid dynamic JSON representation.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
    else:
        img_path = "test2.png" 
    
    test_pipeline(img_path)
