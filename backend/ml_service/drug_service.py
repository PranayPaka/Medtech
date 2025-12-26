"""
Drug Recommendation ML Service
Loads and uses the trained drug recommendation model
"""

import joblib
import os
import numpy as np
from typing import Dict, Any, Optional

# Get the project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(PROJECT_ROOT, "ml_models", "registry", "drug_model.pkl")
ENCODERS_PATH = os.path.join(PROJECT_ROOT, "ml_models", "registry", "drug_encoders.pkl")

# Load model and encoders on module import
_model = None
_encoders = None

def _load_model():
    """Lazy load the model"""
    global _model, _encoders
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Drug model not found at {MODEL_PATH}")
        _model = joblib.load(MODEL_PATH)
        _encoders = joblib.load(ENCODERS_PATH) if os.path.exists(ENCODERS_PATH) else None
    return _model, _encoders

def predict_drug_recommendation(
    condition: str,
    age: int,
    allergy: Optional[str] = None
) -> Dict[str, Any]:
    """
    Predict recommended drug category based on condition, age, and allergies
    
    Args:
        condition: Medical condition (e.g., 'headache', 'bacterial_infection')
        age: Patient age
        allergy: Known allergy (e.g., 'penicillin', 'aspirin', 'none')
    
    Returns:
        Dictionary with drug_category, warning, confidence
    """
    allergy = allergy or 'none'
    
    try:
        model, encoders = _load_model()
        if encoders is None:
            raise FileNotFoundError("Encoders not found")
    except FileNotFoundError:
        # Fallback to rule-based
        return _rule_based_drug_recommendation(condition, age, allergy)
    
    # Encode condition
    condition_encoder = encoders.get('condition_encoder')
    allergy_encoder = encoders.get('allergy_encoder')
    target_encoder = encoders.get('target_encoder')
    
    if not all([condition_encoder, allergy_encoder, target_encoder]):
        return _rule_based_drug_recommendation(condition, age, allergy)
    
    try:
        # Handle unseen conditions
        if condition not in condition_encoder.classes_:
            condition_encoded = 0  # Default to first class
        else:
            condition_encoded = condition_encoder.transform([condition])[0]
        
        # Handle unseen allergies
        if allergy not in allergy_encoder.classes_:
            allergy_encoded = 0  # Default (usually 'none')
        else:
            allergy_encoded = allergy_encoder.transform([allergy])[0]
        
        # Prepare feature vector: [age, condition_encoded, allergy_encoded]
        feature_vector = np.array([[age, condition_encoded, allergy_encoded]])
        
        # Make prediction
        prediction_encoded = model.predict(feature_vector)[0]
        probabilities = model.predict_proba(feature_vector)[0]
        confidence = float(max(probabilities))
        
        # Decode prediction
        drug_category = target_encoder.inverse_transform([prediction_encoded])[0]
        
    except Exception as e:
        print(f"Error in drug prediction: {e}")
        return _rule_based_drug_recommendation(condition, age, allergy)
    
    # Generate warning message
    warning = None
    if allergy != 'none':
        warning = f"⚠️ IMPORTANT: Patient has {allergy} allergy. Verify drug compatibility before prescription."
    if age < 5:
        warning = (warning + " Pediatric dosage required.") if warning else "Pediatric dosage required."
    elif age > 75:
        warning = (warning + " Elderly patient - consider dosage adjustments.") if warning else "Elderly patient - consider dosage adjustments."
    
    if drug_category == 'None':
        warning = (warning + " No medication recommended at this time.") if warning else "No medication recommended at this time."
    
    return {
        'drug_category': drug_category,
        'warning': warning,
        'confidence': confidence,
        'source': 'ml'
    }

def _rule_based_drug_recommendation(
    condition: str,
    age: int,
    allergy: str = 'none'
) -> Dict[str, Any]:
    """Fallback rule-based drug recommendation"""
    # Simple mapping
    condition_lower = condition.lower()
    
    drug_category = 'None'
    warning = None
    
    # Basic condition-to-drug mapping
    if 'infection' in condition_lower or 'bacterial' in condition_lower:
        drug_category = 'Antibiotic'
        if allergy == 'penicillin':
            warning = "⚠️ Patient has penicillin allergy - use alternative antibiotic."
    elif 'headache' in condition_lower or 'migraine' in condition_lower:
        drug_category = 'Analgesic'
        if allergy == 'aspirin':
            warning = "⚠️ Patient has aspirin allergy - use alternative analgesic."
    elif 'fever' in condition_lower:
        drug_category = 'Antipyretic'
    elif 'cough' in condition_lower:
        drug_category = 'Antitussive'
    elif 'cold' in condition_lower:
        drug_category = 'Decongestant'
    elif 'allergy' in condition_lower:
        drug_category = 'Antihistamine'
    
    if age < 5 or age > 75:
        warning = (warning + " Age-specific dosage considerations required.") if warning else "Age-specific dosage considerations required."
    
    return {
        'drug_category': drug_category,
        'warning': warning,
        'confidence': 0.6,
        'source': 'rule-based'
    }

