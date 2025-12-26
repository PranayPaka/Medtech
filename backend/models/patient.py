"""
Patient Model
"""

from sqlalchemy import Column, String, Integer, DateTime, Enum
from sqlalchemy.sql import func
import enum
from database import Base
import uuid

class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    contact = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    medical_history = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

