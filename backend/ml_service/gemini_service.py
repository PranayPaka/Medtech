"""
Gemini API Service for Drug Verification
Uses Google Gemini Vision API to analyze drug images
"""

import os
import base64
from typing import Dict, Any, Optional
import google.generativeai as genai

# Get API key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def initialize_gemini():
    """Initialize Gemini API client"""
    if not GEMINI_API_KEY:
        return None
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Use gemini-flash-latest for vision
        return genai.GenerativeModel('gemini-flash-latest')
    except Exception as e:
        print(f"Error initializing Gemini: {e}")
        return None

def analyze_drug_image(image_base64: str, drug_name: Optional[str] = None, batch_number: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyze drug image using Gemini Vision API
    
    Args:
        image_base64: Base64 encoded image
        drug_name: Optional drug name for context
        batch_number: Optional batch number for context
    
    Returns:
        Dictionary with verification results
    """
    if not GEMINI_API_KEY:
        return {
            "error": "Gemini API key not configured",
            "use_fallback": True
        }
    
    try:
        model = initialize_gemini()
        if not model:
            return {
                "error": "Failed to initialize Gemini model",
                "use_fallback": True
            }
        
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        
        # Create prompt for drug verification
        prompt = f"""Analyze this medication image and verify its authenticity. 
        
        Please check for:
        1. Legitimate pharmaceutical packaging design
        2. Proper labeling and text quality
        3. Holograms, seals, or security features
        4. Manufacturing information
        5. Expiry date visibility
        6. Any signs of tampering or counterfeiting
        
        {"Drug name: " + drug_name if drug_name else ""}
        {"Batch number: " + batch_number if batch_number else ""}
        
        Provide your assessment in this format:
        - Status: authentic/suspicious/counterfeit/unknown
        - Confidence: 0.0 to 1.0
        - Key observations: (list any notable findings)
        - Warning: (any concerns or recommendations)
        """
        
        # Use Gemini Vision API
        from PIL import Image
        import io
        
        image = Image.open(io.BytesIO(image_data))
        
        # Generate content with image and prompt
        response = model.generate_content([prompt, image])
        
        # Parse response
        response_text = response.text
        
        # Extract status and confidence from response
        status = "unknown"
        confidence = 0.5
        observations = []
        warning = None
        
        response_lower = response_text.lower()
        
        # Determine status
        if "authentic" in response_lower or "genuine" in response_lower or "legitimate" in response_lower:
            status = "authentic"
            confidence = 0.8
        elif "counterfeit" in response_lower or "fake" in response_lower:
            status = "counterfeit"
            confidence = 0.7
        elif "suspicious" in response_lower or "concern" in response_lower:
            status = "suspicious"
            confidence = 0.6
        else:
            status = "unknown"
            confidence = 0.5
        
        # Extract confidence if mentioned
        import re
        confidence_match = re.search(r'confidence[:\s]+([0-9.]+)', response_lower)
        if confidence_match:
            try:
                confidence = float(confidence_match.group(1))
                if confidence > 1.0:
                    confidence = confidence / 100.0
            except:
                pass
        
        # Extract warning
        if "warning" in response_lower or "concern" in response_lower:
            warning_lines = [line for line in response_text.split('\n') if 'warning' in line.lower() or 'concern' in line.lower()]
            if warning_lines:
                warning = warning_lines[0].split(':')[-1].strip()
        
        return {
            "status": status,
            "confidence": confidence,
            "observations": observations,
            "warning": warning,
            "raw_response": response_text,
            "source": "gemini"
        }
        
    except Exception as e:
        print(f"Error analyzing drug image with Gemini: {e}")
        return {
            "error": str(e),
            "use_fallback": True
        }

