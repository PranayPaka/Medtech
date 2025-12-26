"""
Prescription Model
"""

from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.sql import func
from database import Base
import uuid

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, nullable=False, index=True)
    patient_name = Column(String, nullable=False)
    doctor_id = Column(String, nullable=False, index=True)
    doctor_name = Column(String, nullable=False)
    diagnosis = Column(String, nullable=False)
    medications = Column(JSON, nullable=False)  # List of medication objects
    instructions = Column(String, nullable=False)
    verification_hash = Column(String, nullable=True, unique=True)
    follow_up_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

