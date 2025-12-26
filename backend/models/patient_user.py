"""
Patient User Model for Authentication
Separate from Patient model which is just medical data
"""

from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from database import Base
import uuid

class PatientUser(Base):
    __tablename__ = "patient_users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

