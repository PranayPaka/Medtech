"""
ML Prediction Routes
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from ml_service.triage_service import predict_triage
from ml_service.drug_service import predict_drug_recommendation

router = APIRouter()

# Ethical disclaimer constant
ETHICAL_DISCLAIMER = (
    "⚠️ MEDICAL DISCLAIMER: This is a decision support system. "
    "All ML outputs are suggestions only. Final authority rests with the licensed medical professional. "
    "Always verify recommendations with clinical judgment and patient history."
)

class TriagePredictionRequest(BaseModel):
    age: int = Field(..., ge=0, le=150, description="Patient age")
    temperature: Optional[float] = Field(None, ge=35.0, le=42.0, description="Body temperature in Celsius")
    heart_rate: Optional[int] = Field(None, ge=30, le=200, description="Heart rate in bpm")
    blood_pressure: Optional[str] = Field(None, description="Blood pressure as 'systolic/diastolic'")
    oxygen_saturation: Optional[int] = Field(None, ge=0, le=100, description="Oxygen saturation percentage")

class DrugPredictionRequest(BaseModel):
    condition: str = Field(..., min_length=1, description="Medical condition")
    age: int = Field(..., ge=0, le=150, description="Patient age")
    allergy: Optional[str] = Field(None, description="Known allergy (e.g., 'penicillin', 'aspirin', 'none')")

@router.post("/triage")
async def predict_triage_endpoint(request: TriagePredictionRequest):
    """
    Predict patient triage urgency level
    
    ⚠️ This is a decision support tool. Always verify with clinical judgment.
    """
    try:
        result = predict_triage(
            age=request.age,
            temperature=request.temperature,
            heart_rate=request.heart_rate,
            blood_pressure=request.blood_pressure,
            oxygen_saturation=request.oxygen_saturation
        )
        
        return {
            **result,
            "disclaimer": ETHICAL_DISCLAIMER
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/drug")
async def predict_drug_endpoint(request: DrugPredictionRequest):
    """
    Recommend drug category based on condition, age, and allergies
    
    ⚠️ This is a decision support tool. Always verify with clinical judgment and patient history.
    """
    try:
        result = predict_drug_recommendation(
            condition=request.condition,
            age=request.age,
            allergy=request.allergy or 'none'
        )
        
        return {
            **result,
            "disclaimer": ETHICAL_DISCLAIMER
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

