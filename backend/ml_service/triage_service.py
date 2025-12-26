"""
Triage ML Service
Loads and uses the trained triage model
"""

import joblib
import os
import numpy as np
from typing import Dict, Any, Optional, List
import google.generativeai as genai
import json
import re

# Get the project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(PROJECT_ROOT, "ml_models", "registry", "triage_model.pkl")
FEATURES_PATH = os.path.join(PROJECT_ROOT, "ml_models", "registry", "triage_features.pkl")

# Load model and feature info on module import (lazy load)
_model = None
_feature_info = None

def _load_model():
    """Lazy load the model and feature info"""
    global _model, _feature_info
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Triage model not found at {MODEL_PATH}")
        _model = joblib.load(MODEL_PATH)
        _feature_info = joblib.load(FEATURES_PATH) if os.path.exists(FEATURES_PATH) else None
    return _model, _feature_info

def parse_blood_pressure(bp_string):
    """Parse blood pressure string (e.g., '120/80') into systolic and diastolic"""
    if not bp_string or bp_string == '':
        return None, None
    try:
        parts = str(bp_string).split('/')
        if len(parts) == 2:
            return int(parts[0].strip()), int(parts[1].strip())
    except:
        pass
    return None, None

def predict_triage_ai(
    age: int,
    temperature: float = None,
    heart_rate: int = None,
    blood_pressure: str = None,
    oxygen_saturation: int = None,
    symptoms: str = None,
    gender: str = None,
    duration: str = None
) -> Optional[Dict[str, Any]]:
    """Use Gemini AI to predict patient triage urgency level"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("DEBUG: GEMINI_API_KEY not found in environment (os.getenv)")
        return None
        
    print(f"DEBUG: Attempting AI triage for age {age}")
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
        
        prompt = f"""Assess the medical urgency for this patient triage:
        Age: {age}
        Gender: {gender if gender else 'Not provided'}
        Vitals:
        - Temperature: {temperature if temperature else 'Not provided'} °C
        - Heart Rate: {heart_rate if heart_rate else 'Not provided'} bpm
        - Blood Pressure: {blood_pressure if blood_pressure else 'Not provided'}
        - Oxygen Saturation: {oxygen_saturation if oxygen_saturation else 'Not provided'}%
        
        Symptoms: {symptoms if symptoms else 'Not provided'}
        Duration: {duration if duration else 'Not provided'}
        
        CRITICAL INSTRUCTIONS:
        1. If symptoms indicate potential organ failure (e.g., liver failure, kidney failure, heart failure), it MUST be classified as level 1 (Emergency) or level 2 (High).
        2. Do not downplay symptoms because vitals are missing; assume the worst-case for severe reported symptoms.
        3. Err on the side of caution. High-risk symptoms like chest pain, stroke signs, or intense abdominal pain are always 1 or 2.
        
        Provide your assessment as a JSON object with these fields:
        1. urgency_level: (number 1-5 where 1=Emergency, 2=High, 3=Medium, 4=Low, 5=Normal)
        2. category: (string "Emergency", "High", "Medium", "Low", "Normal")
        3. explanation: (detailed reason for this level)
        4. recommendedAction: (immediate clinical next steps)
        5. confidence: (number 0.0 to 1.0)
        """
        
        response = model.generate_content(prompt)
        text = response.text
        
        # Extract JSON from response
        try:
            # Look for JSON block
            json_match = re.search(r'(\{.*\})', text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(1))
                return {
                    'urgency_level': int(result.get('urgency_level', 5)),
                    'category': result.get('category', 'Normal'),
                    'confidence': float(result.get('confidence', 0.85)),
                    'explanation': result.get('explanation', 'AI evaluation complete.'),
                    'recommendedAction': result.get('recommendedAction', 'Follow clinical protocols.'),
                    'source': 'ai'
                }
        except:
            # Fallback if JSON parsing fails but text is there
            if "emergency" in text.lower() or "critical" in text.lower():
                lvl, cat = 1, "Emergency"
            elif "urgent" in text.lower() or "serious" in text.lower():
                lvl, cat = 2, "High"
            elif "timely" in text.lower() or "moderate" in text.lower():
                lvl, cat = 3, "Medium"
            elif "minor" in text.lower() or "low" in text.lower():
                lvl, cat = 4, "Low"
            else:
                lvl, cat = 5, "Normal"
                
            return {
                'urgency_level': lvl,
                'category': cat,
                'confidence': 0.8,
                'explanation': text[:500] if text else "AI analysis provided.",
                'source': 'ai'
            }
            
    except Exception as e:
        print(f"⚠️ Gemini AI Triage error: {e}")
        return None
    
    return None

def predict_triage(
    age: int,
    temperature: float = None,
    heart_rate: int = None,
    blood_pressure: str = None,
    oxygen_saturation: int = None,
    symptoms: str = None,
    gender: str = None,
    duration: str = None,
    force_ai: bool = False
) -> Dict[str, Any]:
    """
    Predict patient triage urgency level (Gemini AI -> ML -> Rule-based)
    """
    # 1. Attempt AI Triage first (Automatic or Forced)
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and (force_ai or api_key): # Use api_key variable instead of undefined global
        ai_result = predict_triage_ai(age, temperature, heart_rate, blood_pressure, oxygen_saturation, symptoms, gender, duration)
        if ai_result:
            print(f"DEBUG: AI triage successful, source: {ai_result.get('source')}")
            return ai_result
        else:
            print("DEBUG: AI triage failed or returned None")

    # 2. ML Prediction (use as fallback if AI fails or key missing)
    # Note: ML model only uses vitals and age, so we still perform its check
    vitals_provided = sum([
        temperature is not None,
        heart_rate is not None,
        blood_pressure is not None and blood_pressure != '',
        oxygen_saturation is not None
    ])
    
    # Only skip ML if virtually NO data is provided
    if vitals_provided < 1 and not symptoms:
        print(f"DEBUG: No data provided, using rule-based fallback")
        return _rule_based_triage(age, temperature, heart_rate, blood_pressure, oxygen_saturation, symptoms)
    
    try:
        model, feature_info = _load_model()
    except (FileNotFoundError, ModuleNotFoundError, ImportError, ValueError) as e:
        # Fallback to rule-based if model can't be loaded
        print(f"DEBUG: ML model unavailable, using rule-based triage. Error: {str(e)}")
        return _rule_based_triage(age, temperature, heart_rate, blood_pressure, oxygen_saturation, symptoms)
    
    print("DEBUG: ML model loaded successfully, proceeding with ML prediction")
    
    # Parse blood pressure
    systolic_bp, diastolic_bp = parse_blood_pressure(blood_pressure) if blood_pressure else (None, None)
    
    # Prepare features in correct order: age, temperature, heart_rate, systolic_bp, diastolic_bp, oxygen_saturation
    features = {
        'age': age,
        'temperature': temperature,
        'heart_rate': heart_rate,
        'systolic_bp': systolic_bp,
        'diastolic_bp': diastolic_bp,
        'oxygen_saturation': oxygen_saturation
    }
    
    # Get feature order from feature_info or use default
    if feature_info and 'feature_order' in feature_info:
        feature_order = feature_info['feature_order']
    else:
        feature_order = ['age', 'temperature', 'heart_rate', 'systolic_bp', 'diastolic_bp', 'oxygen_saturation']
    
    # Create feature vector with imputation for missing values
    feature_vector = []
    median_values = {
        'age': 45,
        'temperature': 37.0,
        'heart_rate': 75,
        'systolic_bp': 120,
        'diastolic_bp': 80,
        'oxygen_saturation': 98
    }
    
    for feature_name in feature_order:
        value = features.get(feature_name)
        if value is None:
            value = median_values.get(feature_name, 0)
        feature_vector.append(float(value))
    
    # Make prediction
    feature_array = np.array([feature_vector])
    prediction = model.predict(feature_array)[0]
    probabilities = model.predict_proba(feature_array)[0]
    confidence = float(max(probabilities))
    
    # Map prediction back to urgency level (0-4 -> 1-5)
    urgency_level = int(prediction + 1)
    
    # Map to category
    category_map = {
        1: 'Emergency',
        2: 'High',
        3: 'Medium',
        4: 'Low',
        5: 'Normal'
    }
    category = category_map.get(urgency_level, 'Normal')
    
    # Generate explanation
    explanation = _generate_explanation(urgency_level, category, features)
    
    return {
        'urgency_level': urgency_level,
        'category': category,
        'confidence': confidence,
        'explanation': explanation,
        'source': 'ml'
    }

def _generate_explanation(urgency_level: int, category: str, features: Dict) -> str:
    """Generate human-readable explanation"""
    explanations = {
        1: f"Critical vitals detected requiring immediate medical attention. ",
        2: f"Serious condition identified requiring urgent care. ",
        3: f"Condition requires timely evaluation. ",
        4: f"Minor condition that can be addressed in routine care. ",
        5: f"Normal vitals, routine evaluation recommended. "
    }
    
    base_explanation = explanations.get(urgency_level, "Evaluation recommended.")
    
    # Add specific details
    details = []
    if features.get('oxygen_saturation') and features['oxygen_saturation'] < 94:
        details.append("Low oxygen saturation")
    if features.get('temperature') and features['temperature'] > 38.5:
        details.append("Elevated temperature")
    if features.get('heart_rate') and (features['heart_rate'] > 100 or features['heart_rate'] < 60):
        details.append("Abnormal heart rate")
    
    if details:
        base_explanation += " Notable factors: " + ", ".join(details) + "."
    
    return base_explanation

def _rule_based_triage(
    age: int,
    temperature: float = None,
    heart_rate: int = None,
    blood_pressure: str = None,
    oxygen_saturation: int = None,
    symptoms: str = None
) -> Dict[str, Any]:
    """Fallback rule-based triage that analyzes symptoms and vitals"""
    urgency_level = 5  # Normal by default
    category = 'Normal'
    explanation = ""
    factors = []
    
    # Analyze symptoms if provided
    if symptoms:
        symptoms_lower = symptoms.lower()
        
        # Emergency keywords
        emergency_keywords = ['chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding', 
                             'stroke', 'heart attack', 'seizure', 'cardiac arrest', 'not breathing',
                             'liver failure', 'kidney failure', 'organ failure', 'shock', 'coma']
        # High priority keywords
        high_keywords = ['high fever', 'severe pain', 'vomiting blood', 'head injury', 'fracture', 
                        'allergic reaction', 'severe', 'intense pain', 'cannot breathe', 'jaundice',
                        'confusion', 'disorientation']
        # Medium priority keywords
        medium_keywords = ['moderate pain', 'persistent fever', 'infection', 'dizziness', 
                          'nausea', 'vomiting', 'persistent']
        # Low priority keywords
        low_keywords = ['mild pain', 'cold', 'cough', 'headache', 'mild', 'minor']
        
        if any(kw in symptoms_lower for kw in emergency_keywords):
            urgency_level = 1
            category = 'Emergency'
            explanation = "Critical symptoms detected requiring immediate attention."
            factors.append("emergency symptoms")
        elif any(kw in symptoms_lower for kw in high_keywords):
            urgency_level = 2
            category = 'High'
            explanation = "Serious symptoms requiring urgent care."
            factors.append("serious symptoms")
        elif any(kw in symptoms_lower for kw in medium_keywords):
            urgency_level = 3
            category = 'Medium'
            explanation = "Symptoms require timely evaluation."
            factors.append("moderate symptoms")
        elif any(kw in symptoms_lower for kw in low_keywords):
            urgency_level = 4
            category = 'Low'
            explanation = "Minor symptoms detected."
            factors.append("minor symptoms")
    
    # Check vitals (these override symptom-based assessment if more critical)
    if oxygen_saturation and oxygen_saturation < 94:
        urgency_level = 1
        category = 'Emergency'
        explanation = "Critical: Low oxygen saturation detected."
        factors.append("low oxygen saturation")
    elif temperature and temperature > 39:
        if urgency_level > 2:
            urgency_level = 2
            category = 'High'
        explanation = "High temperature requiring urgent attention." if not explanation else explanation
        factors.append("high temperature")
    elif heart_rate and (heart_rate > 120 or heart_rate < 50):
        if urgency_level > 2:
            urgency_level = 2
            category = 'High'
        explanation = "Abnormal heart rate detected." if not explanation else explanation
        factors.append("abnormal heart rate")
    
    # Age adjustment (increases priority for vulnerable populations)
    if age < 5 or age > 70:
        if urgency_level > 1:
            urgency_level = max(1, urgency_level - 1)
            if category == 'Normal':
                category = 'Low'
            elif category == 'Low':
                category = 'Medium'
        explanation = explanation + " Age increases priority." if explanation else "Age factor increases priority for evaluation."
        factors.append("vulnerable age group")
    
    # Default explanation if nothing matched
    if not explanation:
        explanation = "Standard evaluation recommended."
    
    # Add factor details to explanation
    if factors:
        explanation += " Notable factors: " + ", ".join(factors) + "."
    
    return {
        'urgency_level': urgency_level,
        'category': category,
        'confidence': 0.75,
        'explanation': explanation,
        'source': 'rule-based'
    }

