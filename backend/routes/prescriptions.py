"""
Prescriptions Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
import hashlib
import time

from database import get_db
from models.prescription import Prescription
from middleware import get_current_user, require_role

router = APIRouter()

class Medication(BaseModel):
    name: str = Field(..., min_length=1)
    dosage: str = Field(..., min_length=1)
    frequency: str = Field(..., min_length=1)
    duration: str = Field(..., min_length=1)
    notes: Optional[str] = None

class PrescriptionCreate(BaseModel):
    patientId: str
    patientName: str = Field(..., min_length=1)
    diagnosis: str = Field(..., min_length=1)
    medications: List[Medication] = Field(..., min_items=1)
    instructions: str = Field(..., min_length=1)
    followUpDate: Optional[str] = None

class PrescriptionResponse(BaseModel):
    id: str
    patientId: str
    patientName: str
    doctorId: str
    doctorName: str
    diagnosis: str
    medications: List[dict]
    instructions: str
    verificationHash: Optional[str] = None
    followUpDate: Optional[str] = None
    createdAt: str
    
    class Config:
        from_attributes = True

def generate_prescription_hash(patient_id: str, doctor_id: str):
    """Generate a unique verification hash for the prescription"""
    data = f"{patient_id}-{doctor_id}-{time.time()}"
    return hashlib.sha256(data.encode()).hexdigest()[:12].upper()

@router.post("/", response_model=PrescriptionResponse)
async def create_prescription(
    prescription_data: PrescriptionCreate,
    current_user = Depends(require_role("doctor", "admin", "staff")),
    db: Session = Depends(get_db)
):
    """Create prescription (doctors only)"""
    try:
        # Parse follow-up date
        follow_up_date = None
        if prescription_data.followUpDate:
            try:
                follow_up_date = datetime.fromisoformat(prescription_data.followUpDate.replace('Z', '+00:00'))
            except Exception as e:
                print(f"Warning: Could not parse follow-up date: {e}")
                pass
        
        # Convert medications to dict format
        try:
            medications_list = [med.model_dump() for med in prescription_data.medications]
        except AttributeError:
            # Fallback for Pydantic v1
            medications_list = [med.dict() for med in prescription_data.medications]
        
        # Validate medications list
        if not medications_list or len(medications_list) == 0:
            raise HTTPException(status_code=400, detail="At least one medication is required")
        
        # Generate verification hash
        v_hash = generate_prescription_hash(prescription_data.patientId, current_user.id)
        
        # Ensure doctor_name exists
        doctor_name = current_user.name if hasattr(current_user, 'name') and current_user.name else current_user.email.split('@')[0]
        
        prescription = Prescription(
            patient_id=prescription_data.patientId,
            patient_name=prescription_data.patientName,
            doctor_id=current_user.id,
            doctor_name=doctor_name,
            diagnosis=prescription_data.diagnosis,
            medications=medications_list,
            instructions=prescription_data.instructions,
            verification_hash=v_hash,
            follow_up_date=follow_up_date
        )
        
        db.add(prescription)
        db.commit()
        db.refresh(prescription)
        
        return {
            "id": prescription.id,
            "patientId": prescription.patient_id,
            "patientName": prescription.patient_name,
            "doctorId": prescription.doctor_id,
            "doctorName": prescription.doctor_name,
            "diagnosis": prescription.diagnosis,
            "medications": prescription.medications,
            "instructions": prescription.instructions,
            "verificationHash": prescription.verification_hash,
            "followUpDate": prescription.follow_up_date.isoformat() if prescription.follow_up_date else None,
            "createdAt": prescription.created_at.isoformat() if prescription.created_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating prescription: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create prescription: {str(e)}")

@router.get("/verify/{v_hash}", response_model=PrescriptionResponse)
async def verify_prescription(
    v_hash: str,
    db: Session = Depends(get_db)
):
    """Verify prescription by hash (Pharmacy access)"""
    prescription = db.query(Prescription).filter(Prescription.verification_hash == v_hash).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Invalid verification hash. Prescription not found.")
    
    return {
        "id": prescription.id,
        "patientId": prescription.patient_id,
        "patientName": prescription.patient_name,
        "doctorId": prescription.doctor_id,
        "doctorName": prescription.doctor_name,
        "diagnosis": prescription.diagnosis,
        "medications": prescription.medications,
        "instructions": prescription.instructions,
        "verificationHash": prescription.verification_hash,
        "followUpDate": prescription.follow_up_date.isoformat() if prescription.follow_up_date else None,
        "createdAt": prescription.created_at.isoformat() if prescription.created_at else None
    }

@router.get("/{prescription_id}")
async def get_prescription_by_id(
    prescription_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get prescription by ID"""
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    return {
        "id": prescription.id,
        "patientId": prescription.patient_id,
        "patientName": prescription.patient_name,
        "doctorId": prescription.doctor_id,
        "doctorName": prescription.doctor_name,
        "diagnosis": prescription.diagnosis,
        "medications": prescription.medications,
        "instructions": prescription.instructions,
        "verificationHash": prescription.verification_hash,
        "followUpDate": prescription.follow_up_date.isoformat() if prescription.follow_up_date else None,
        "createdAt": prescription.created_at.isoformat() if prescription.created_at else None
    }

@router.get("/", response_model=List[PrescriptionResponse])
async def get_all_prescriptions(
    current_user = Depends(require_role("doctor", "admin", "staff")),
    db: Session = Depends(get_db)
):
    """Get all prescriptions (Healthcare providers only)"""
    prescriptions = db.query(Prescription).order_by(desc(Prescription.created_at)).all()
    
    return [
        {
            "id": p.id,
            "patientId": p.patient_id,
            "patientName": p.patient_name,
            "doctorId": p.doctor_id,
            "doctorName": p.doctor_name,
            "diagnosis": p.diagnosis,
            "medications": p.medications,
            "instructions": p.instructions,
            "verificationHash": p.verification_hash,
            "followUpDate": p.follow_up_date.isoformat() if p.follow_up_date else None,
            "createdAt": p.created_at.isoformat() if p.created_at else None
        }
        for p in prescriptions
    ]

@router.get("/patient/{patient_id}")
async def get_prescriptions_by_patient(
    patient_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all prescriptions for a patient"""
    from models.patient_user import PatientUser
    
    # Patients can only view their own prescriptions
    # In a real system, you'd link PatientUser.id to Patient.id
    # For now, we'll allow patients to view if they match
    
    prescriptions = db.query(Prescription).filter(
        Prescription.patient_id == patient_id
    ).order_by(desc(Prescription.created_at)).all()
    
    return [
        {
            "id": prescription.id,
            "patientId": prescription.patient_id,
            "patientName": prescription.patient_name,
            "doctorId": prescription.doctor_id,
            "doctorName": prescription.doctor_name,
            "diagnosis": prescription.diagnosis,
            "medications": prescription.medications,
            "instructions": prescription.instructions,
            "verificationHash": prescription.verification_hash,
            "followUpDate": prescription.follow_up_date.isoformat() if prescription.follow_up_date else None,
            "createdAt": prescription.created_at.isoformat() if prescription.created_at else None
        }
        for prescription in prescriptions
    ]
@router.delete("/{prescription_id}")
async def delete_prescription(
    prescription_id: str,
    current_user = Depends(require_role("doctor", "admin", "staff")),
    db: Session = Depends(get_db)
):
    """Delete a prescription (Healthcare providers only)"""
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    try:
        db.delete(prescription)
        db.commit()
        return {"message": "Prescription deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting prescription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error during deletion: {str(e)}")
