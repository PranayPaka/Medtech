"""
Drug Verification Model
"""

from sqlalchemy import Column, String, Boolean, Float, DateTime, JSON, Enum
from sqlalchemy.sql import func
import enum
from database import Base
import uuid

class VerificationStatus(str, enum.Enum):
    authentic = "authentic"
    suspicious = "suspicious"
    counterfeit = "counterfeit"
    unknown = "unknown"

class VerificationSource(str, enum.Enum):
    ml = "ml"
    rule_based = "rule-based"

class DrugVerification(Base):
    __tablename__ = "drug_verifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    drug_name = Column(String, nullable=False)
    batch_number = Column(String, nullable=True)
    is_authentic = Column(Boolean, nullable=False)
    confidence = Column(Float, nullable=False)
    verification_status = Column(Enum(VerificationStatus), nullable=False)
    warning_message = Column(String, nullable=True)
    source = Column(Enum(VerificationSource), nullable=False)
    details = Column(JSON, nullable=True)  # Manufacturer, expiry, etc.
    verified_by = Column(String, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

