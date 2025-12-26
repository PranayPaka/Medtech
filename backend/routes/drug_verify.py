"""
Drug Verification Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
import base64

from database import get_db
from models.drug_verification import DrugVerification, VerificationStatus, VerificationSource
from middleware import get_current_user
from ml_service.gemini_service import analyze_drug_image

router = APIRouter()

class DrugVerificationInput(BaseModel):
    drugName: Optional[str] = None
    batchNumber: Optional[str] = None
    manufacturer: Optional[str] = None
    qrCode: Optional[str] = None

class DrugVerificationResponse(BaseModel):
    id: str
    drugName: str
    batchNumber: Optional[str] = None
    isAuthentic: bool
    confidence: float
    verificationStatus: str
    warningMessage: Optional[str] = None
    source: str
    verifiedAt: str
    details: Optional[dict] = None
    
    class Config:
        from_attributes = True

def rule_based_verification(
    drug_name: str,
    batch_number: Optional[str] = None
) -> dict:
    """Rule-based drug verification (fallback when ML unavailable)"""
    drug_name = drug_name or "Unknown Drug"
    
    if not batch_number:
        return {
            "isAuthentic": False,
            "confidence": 0.3,
            "status": VerificationStatus.unknown,
            "warning": "No batch number provided. Unable to fully verify authenticity."
        }
    
    # Simple validation rules
    if len(batch_number) < 6:
        return {
            "isAuthentic": False,
            "confidence": 0.5,
            "status": VerificationStatus.suspicious,
            "warning": "Batch number format is unusual. Manual verification recommended."
        }
    
    # Check format (basic validation)
    if any(c.isalnum() for c in batch_number[:2]) and any(c.isdigit() for c in batch_number[2:]):
        return {
            "isAuthentic": True,
            "confidence": 0.75,
            "status": VerificationStatus.authentic,
            "warning": None
        }
    
    return {
        "isAuthentic": False,
        "confidence": 0.5,
        "status": VerificationStatus.suspicious,
        "warning": "Batch number does not match expected format."
    }

@router.post("/", response_model=DrugVerificationResponse)
async def verify_drug(
    file: Optional[UploadFile] = File(None),
    drugName: Optional[str] = Form(None),
    batchNumber: Optional[str] = Form(None),
    manufacturer: Optional[str] = Form(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify drug authenticity
    Supports both file upload and manual entry
    """
    # Handle file upload (if provided)
    image_base64 = None
    if file:
        try:
            image_data = await file.read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading image: {str(e)}")
    
    drug_name = drugName or "Unknown Drug"
    
    # Try Gemini API if image is provided
    verification_result = None
    verification_source = VerificationSource.rule_based
    
    if image_base64:
        gemini_result = analyze_drug_image(image_base64, drug_name, batchNumber)
        
        if not gemini_result.get("use_fallback") and not gemini_result.get("error"):
            # Use Gemini result
            verification_result = {
                "isAuthentic": gemini_result["status"] == "authentic",
                "confidence": gemini_result["confidence"],
                "status": VerificationStatus.authentic if gemini_result["status"] == "authentic" 
                         else VerificationStatus.suspicious if gemini_result["status"] == "suspicious"
                         else VerificationStatus.counterfeit if gemini_result["status"] == "counterfeit"
                         else VerificationStatus.unknown,
                "warning": gemini_result.get("warning") or gemini_result.get("observations")
            }
            verification_source = VerificationSource.ml
            print(f"✅ Used Gemini API for drug verification")
        else:
            print(f"⚠️  Gemini API unavailable, using fallback: {gemini_result.get('error', 'Unknown error')}")
    
    # Fallback to rule-based if no Gemini result
    if not verification_result:
        verification_result = rule_based_verification(drug_name, batchNumber)
    
    # Create verification record
    verification = DrugVerification(
        drug_name=drug_name,
        batch_number=batchNumber,
        is_authentic=verification_result["isAuthentic"],
        confidence=verification_result["confidence"],
        verification_status=verification_result["status"],
        warning_message=verification_result.get("warning"),
        source=verification_source,
        details={
            "manufacturer": manufacturer
        } if manufacturer else None,
        verified_by=current_user.id
    )
    
    db.add(verification)
    db.commit()
    db.refresh(verification)
    
    return {
        "id": verification.id,
        "drugName": verification.drug_name,
        "batchNumber": verification.batch_number,
        "isAuthentic": verification.is_authentic,
        "confidence": verification.confidence,
        "verificationStatus": verification.verification_status.value,
        "warningMessage": verification.warning_message,
        "source": verification.source.value,
        "verifiedAt": verification.created_at.isoformat() if verification.created_at else None,
        "details": verification.details
    }

@router.get("/history")
async def get_verification_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get drug verification history (paginated)"""
    skip = (page - 1) * limit
    
    total = db.query(DrugVerification).count()
    items = db.query(DrugVerification).order_by(
        desc(DrugVerification.created_at)
    ).offset(skip).limit(limit).all()
    
    return {
        "items": [
            {
                "id": item.id,
                "drugName": item.drug_name,
                "batchNumber": item.batch_number,
                "isAuthentic": item.is_authentic,
                "confidence": item.confidence,
                "verificationStatus": item.verification_status.value,
                "warningMessage": item.warning_message,
                "source": item.source.value,
                "verifiedAt": item.created_at.isoformat() if item.created_at else None,
                "details": item.details
            }
            for item in items
        ],
        "total": total,
        "page": page,
        "pageSize": limit,
        "totalPages": (total + limit - 1) // limit
    }

