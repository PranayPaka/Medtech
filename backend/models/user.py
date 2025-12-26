"""
User Model
"""

from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.sql import func
import enum
from database import Base
import uuid

class UserRole(str, enum.Enum):
    doctor = "doctor"
    staff = "staff"
    admin = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.staff)
    department = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

