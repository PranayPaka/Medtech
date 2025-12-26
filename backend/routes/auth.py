"""
Authentication Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os

from database import get_db
from models.user import User, UserRole
from models.patient_user import PatientUser
from middleware import get_current_user

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET", "default-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRES_IN_DAYS", "7"))

def create_access_token(data: dict):
    """Create JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

class DoctorRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole
    department: str = None

class PatientRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str = None
    dateOfBirth: str = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    userType: str = "doctor"  # "doctor" or "patient"

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    department: str = None
    createdAt: str
    
    class Config:
        from_attributes = True

@router.post("/register/doctor")
async def register_doctor(request: DoctorRegisterRequest, db: Session = Depends(get_db)):
    """Register new doctor/staff user"""
    # Check if user exists in either table
    existing_user = db.query(User).filter(User.email == request.email).first()
    existing_patient = db.query(PatientUser).filter(PatientUser.email == request.email).first()
    if existing_user or existing_patient:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = pwd_context.hash(request.password)
    
    # Create user
    user = User(
        email=request.email,
        password_hash=hashed_password,
        name=request.name,
        role=request.role,
        department=request.department
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create token with userType
    token = create_access_token(data={"userId": user.id, "role": user.role.value, "userType": "doctor"})
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value,
            "userType": "doctor",
            "department": user.department,
            "createdAt": user.created_at.isoformat() if user.created_at else None
        }
    }

@router.post("/register/patient")
async def register_patient(request: PatientRegisterRequest, db: Session = Depends(get_db)):
    """Register new patient user"""
    # Check if user exists in either table
    existing_user = db.query(User).filter(User.email == request.email).first()
    existing_patient = db.query(PatientUser).filter(PatientUser.email == request.email).first()
    if existing_user or existing_patient:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = pwd_context.hash(request.password)
    
    # Create patient user
    patient_user = PatientUser(
        email=request.email,
        password_hash=hashed_password,
        name=request.name,
        phone=request.phone,
        date_of_birth=request.dateOfBirth
    )
    db.add(patient_user)
    db.commit()
    db.refresh(patient_user)
    
    # Create token with userType
    token = create_access_token(data={"userId": patient_user.id, "role": "patient", "userType": "patient"})
    
    return {
        "token": token,
        "user": {
            "id": patient_user.id,
            "email": patient_user.email,
            "name": patient_user.name,
            "role": "patient",
            "userType": "patient",
            "phone": patient_user.phone,
            "dateOfBirth": patient_user.date_of_birth,
            "createdAt": patient_user.created_at.isoformat() if patient_user.created_at else None
        }
    }

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login user (doctor or patient)"""
    user_type = request.userType.lower()
    
    if user_type == "patient":
        # Find patient user
        patient_user = db.query(PatientUser).filter(PatientUser.email == request.email).first()
        if not patient_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Verify password
        if not pwd_context.verify(request.password, patient_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Create token
        token = create_access_token(data={"userId": patient_user.id, "role": "patient", "userType": "patient"})
        
        return {
            "token": token,
            "user": {
                "id": patient_user.id,
                "email": patient_user.email,
                "name": patient_user.name,
                "role": "patient",
                "userType": "patient",
                "phone": patient_user.phone,
                "dateOfBirth": patient_user.date_of_birth,
                "createdAt": patient_user.created_at.isoformat() if patient_user.created_at else None
            }
        }
    else:
        # Find doctor/staff user
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Verify password
        if not pwd_context.verify(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Create token
        token = create_access_token(data={"userId": user.id, "role": user.role.value, "userType": "doctor"})
        
        return {
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role.value,
                "userType": "doctor",
                "department": user.department,
                "createdAt": user.created_at.isoformat() if user.created_at else None
            }
        }

@router.get("/me")
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information (doctor or patient)"""
    from models.patient_user import PatientUser
    
    if isinstance(current_user, PatientUser):
        return {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "role": "patient",
            "userType": "patient",
            "phone": current_user.phone,
            "dateOfBirth": current_user.date_of_birth,
            "createdAt": current_user.created_at.isoformat() if current_user.created_at else None
        }
    else:
        return {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "role": current_user.role.value,
            "userType": "doctor",
            "department": current_user.department,
            "createdAt": current_user.created_at.isoformat() if current_user.created_at else None
        }

@router.post("/logout")
async def logout(current_user = Depends(get_current_user)):
    """Logout (token removal handled client-side)"""
    return {"message": "Logged out successfully"}

