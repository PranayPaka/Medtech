"""
Triage Result Model
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Enum
from sqlalchemy.sql import func
import enum
from database import Base
import uuid

class UrgencyCategory(str, enum.Enum):
    Emergency = "Emergency"
    High = "High"
    Medium = "Medium"
    Low = "Low"
    Normal = "Normal"

class TriageSource(str, enum.Enum):
    ai = "ai"
    ml = "ml"
    rule_based = "rule-based"

class TriageResult(Base):
    __tablename__ = "triage_results"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, nullable=False, index=True)
    patient_name = Column(String, nullable=False)
    urgency_level = Column(Integer, nullable=False)  # 1-5
    category = Column(Enum(UrgencyCategory), nullable=False)
    explanation = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    source = Column(Enum(TriageSource), nullable=False)
    symptoms = Column(String, nullable=False)
    vitals = Column(JSON, nullable=True)  # Store vitals as JSON
    recommended_action = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

