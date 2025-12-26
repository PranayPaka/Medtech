
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from models.triage_result import TriageResult, UrgencyCategory, TriageSource
from models.patient import Patient, Gender
from models.prescription import Prescription
from middleware import get_current_user
from ml_service.triage_service import predict_triage

router = APIRouter()

ETHICAL_DISCLAIMER = (
    "⚠️ MEDICAL DISCLAIMER: This is a decision support system. "
    "ML outputs are suggestions only. Final authority rests with the licensed medical professional."
)

class TriageInput(BaseModel):
    patientId: Optional[str] = None
    patientName: str = Field(..., min_length=1)
    age: int = Field(..., ge=0, le=150)
    gender: Gender
    symptoms: str = Field(..., min_length=3)
    duration: str = Field(..., min_length=1)
    vitals: Optional[Dict] = None
    force_ai: Optional[bool] = False

class TriageResponse(BaseModel):
    id: str
    patientId: str
    patientName: str
    urgencyLevel: int
    category: str
    explanation: str
    confidence: float
    source: str
    symptoms: str
    recommendedAction: Optional[str] = None
    createdAt: str
    
    class Config:
        from_attributes = True

@router.post("", response_model=TriageResponse)
async def submit_triage(
    input_data: TriageInput,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db: Session = Depends(get_db)
):
    patient_id = input_data.patientId
    if not patient_id:
        patient = Patient(
            name=input_data.patientName,
            age=input_data.age,
            gender=input_data.gender
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        patient_id = patient.id
    
        patient_id = patient.id
    
    vitals = input_data.vitals or {}
    bp_string = vitals.get("bloodPressure")
    heart_rate = vitals.get("heartRate")
    temperature = vitals.get("temperature")
    oxygen_sat = vitals.get("oxygenSaturation")
    
    oxygen_sat = vitals.get("oxygenSaturation")
    
    ml_result = predict_triage(
        age=input_data.age,
        gender=input_data.gender,
        symptoms=input_data.symptoms,
        duration=input_data.duration,
        temperature=temperature,
        heart_rate=heart_rate,
        blood_pressure=bp_string,
        oxygen_saturation=oxygen_sat,
        force_ai=input_data.force_ai
    )
    
        force_ai=input_data.force_ai
    )
    
    category_map = {
        1: UrgencyCategory.Emergency,
        2: UrgencyCategory.High,
        3: UrgencyCategory.Medium,
        4: UrgencyCategory.Low,
        5: UrgencyCategory.Normal
    }
    category = category_map.get(ml_result['urgency_level'], UrgencyCategory.Normal)
    
    category = category_map.get(ml_result['urgency_level'], UrgencyCategory.Normal)
    
    triage_result = TriageResult(
        patient_id=patient_id,
        patient_name=input_data.patientName,
        urgency_level=ml_result['urgency_level'],
        category=category,
        explanation=ml_result['explanation'] + " " + ETHICAL_DISCLAIMER,
        confidence=ml_result['confidence'],
        source=TriageSource.ai if ml_result['source'] == 'ai' else (TriageSource.ml if ml_result['source'] == 'ml' else TriageSource.rule_based),
        symptoms=input_data.symptoms,
        vitals=input_data.vitals,
        recommended_action=f"Recommended action: {ml_result.get('recommendedAction', 'Follow clinical protocols.')}"
    )
    
    db.add(triage_result)
    db.commit()
    db.refresh(triage_result)

    db.refresh(triage_result)
    
    prescriptions = db.query(Prescription).filter(Prescription.patient_id == patient_id).all()
    if prescriptions:
        recent_p = prescriptions[0]
        med_names = [m.get('name') for m in recent_p.medications]
        context_msg = f" [Note: Patient has an active prescription for {', '.join(med_names)}]"
        triage_result.recommended_action = (triage_result.recommended_action or "") + context_msg
        db.commit()
    
    return {
        "id": triage_result.id,
        "patientId": triage_result.patient_id,
        "patientName": triage_result.patient_name,
        "urgencyLevel": triage_result.urgency_level,
        "category": triage_result.category.value,
        "explanation": triage_result.explanation,
        "confidence": triage_result.confidence,
        "source": triage_result.source.value,
        "symptoms": triage_result.symptoms,
        "recommendedAction": triage_result.recommended_action,
        "createdAt": triage_result.created_at.isoformat() if triage_result.created_at else None
    }

@router.get("")
async def get_all_triage(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all triage results (paginated)"""
    skip = (page - 1) * limit
    
    total = db.query(TriageResult).count()
    items = db.query(TriageResult).order_by(
        TriageResult.urgency_level, desc(TriageResult.created_at)
    ).offset(skip).limit(limit).all()
    
    return {
        "items": [
            {
                "id": item.id,
                "patientId": item.patient_id,
                "patientName": item.patient_name,
                "urgencyLevel": item.urgency_level,
                "category": item.category.value,
                "explanation": item.explanation,
                "confidence": item.confidence,
                "source": item.source.value,
                "symptoms": item.symptoms,
                "recommendedAction": item.recommended_action,
                "createdAt": item.created_at.isoformat() if item.created_at else None
            }
            for item in items
        ],
        "total": total,
        "page": page,
        "pageSize": limit,
        "totalPages": (total + limit - 1) // limit
    }

@router.get("/{triage_id}")
async def get_triage_by_id(
    triage_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get triage result by ID"""
    triage = db.query(TriageResult).filter(TriageResult.id == triage_id).first()
    if not triage:
        raise HTTPException(status_code=404, detail="Triage result not found")
    
    return {
        "id": triage.id,
        "patientId": triage.patient_id,
        "patientName": triage.patient_name,
        "urgencyLevel": triage.urgency_level,
        "category": triage.category.value,
        "explanation": triage.explanation,
        "confidence": triage.confidence,
        "source": triage.source.value,
        "symptoms": triage.symptoms,
        "recommendedAction": triage.recommended_action,
        "createdAt": triage.created_at.isoformat() if triage.created_at else None
    }

@router.get("/patient/{patient_id}")
async def get_triage_by_patient(
    patient_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all triage results for a patient"""
    from models.patient_user import PatientUser
    
    # Patients can only view their own triage results
    if isinstance(current_user, PatientUser):
        # For patients, we need to find their patient record by email or name
        # For now, allow if they're accessing their own data
        # In a real system, you'd link PatientUser to Patient
        pass
    
    results = db.query(TriageResult).filter(
        TriageResult.patient_id == patient_id
    ).order_by(desc(TriageResult.created_at)).all()
    
    return [
        {
            "id": item.id,
            "patientId": item.patient_id,
            "patientName": item.patient_name,
            "urgencyLevel": item.urgency_level,
            "category": item.category.value,
            "explanation": item.explanation,
            "confidence": item.confidence,
            "source": item.source.value,
            "symptoms": item.symptoms,
            "recommendedAction": item.recommended_action,
            "createdAt": item.created_at.isoformat() if item.created_at else None
        }
        for item in results
    ]

