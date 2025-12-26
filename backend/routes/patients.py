
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from models.patient import Patient, Gender
from middleware import get_current_user

router = APIRouter()

class PatientCreate(BaseModel):
    name: str = Field(..., min_length=1)
    age: int = Field(..., ge=0, le=150)
    gender: Gender
    contact: Optional[str] = None
    emergencyContact: Optional[str] = None
    medicalHistory: Optional[str] = None

class PatientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    age: Optional[int] = Field(None, ge=0, le=150)
    gender: Optional[Gender] = None
    contact: Optional[str] = None
    emergencyContact: Optional[str] = None
    medicalHistory: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    contact: Optional[str] = None
    emergencyContact: Optional[str] = None
    medicalHistory: Optional[str] = None
    createdAt: str
    updatedAt: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.get("/")
async def get_all_patients(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    
    total = db.query(Patient).count()
    items = db.query(Patient).order_by(desc(Patient.created_at)).offset(skip).limit(limit).all()
    
    return {
        "items": [
            {
                "id": patient.id,
                "name": patient.name,
                "age": patient.age,
                "gender": patient.gender.value,
                "contact": patient.contact,
                "emergencyContact": patient.emergency_contact,
                "medicalHistory": patient.medical_history,
                "createdAt": patient.created_at.isoformat() if patient.created_at else None,
                "updatedAt": patient.updated_at.isoformat() if patient.updated_at else None
            }
            for patient in items
        ],
        "total": total,
        "page": page,
        "pageSize": limit,
        "totalPages": (total + limit - 1) // limit
    }

@router.get("/{patient_id}")
async def get_patient_by_id(
    patient_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender.value,
        "contact": patient.contact,
        "emergencyContact": patient.emergency_contact,
        "medicalHistory": patient.medical_history,
        "createdAt": patient.created_at.isoformat() if patient.created_at else None,
        "updatedAt": patient.updated_at.isoformat() if patient.updated_at else None
    }

@router.post("/", response_model=PatientResponse)
async def create_patient(
    patient_data: PatientCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db: Session = Depends(get_db)
):
    patient = Patient(
        name=patient_data.name,
        age=patient_data.age,
        gender=patient_data.gender,
        contact=patient_data.contact,
        emergency_contact=patient_data.emergencyContact,
        medical_history=patient_data.medicalHistory
    )
    
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    return {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender.value,
        "contact": patient.contact,
        "emergencyContact": patient.emergency_contact,
        "medicalHistory": patient.medical_history,
        "createdAt": patient.created_at.isoformat() if patient.created_at else None,
        "updatedAt": patient.updated_at.isoformat() if patient.updated_at else None
    }

@router.put("/{patient_id}")
async def update_patient(
    patient_id: str,
    patient_data: PatientUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_data.dict(exclude_unset=True)
    if "emergencyContact" in update_data:
        update_data["emergency_contact"] = update_data.pop("emergencyContact")
    if "medicalHistory" in update_data:
        update_data["medical_history"] = update_data.pop("medicalHistory")
    
    for key, value in update_data.items():
        setattr(patient, key, value)
    
    db.commit()
    db.refresh(patient)
    
    return {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender.value,
        "contact": patient.contact,
        "emergencyContact": patient.emergency_contact,
        "medicalHistory": patient.medical_history,
        "createdAt": patient.created_at.isoformat() if patient.created_at else None,
        "updatedAt": patient.updated_at.isoformat() if patient.updated_at else None
    }

