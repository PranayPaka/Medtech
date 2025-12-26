"""
Authentication Middleware
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.patient_user import PatientUser
from typing import Union
import os

security = HTTPBearer()

SECRET_KEY = os.getenv("JWT_SECRET", "default-secret-change-in-production")
ALGORITHM = "HS256"

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Union[User, PatientUser]:
    """Get current authenticated user (doctor or patient)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("userId")
        user_type: str = payload.get("userType", "doctor")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Try to find user based on type
    if user_type == "patient":
        user = db.query(PatientUser).filter(PatientUser.id == user_id).first()
    else:
        user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise credentials_exception
    
    return user

def require_role(*allowed_roles: str):
    """Dependency to require specific user roles (doctor/staff/admin only)"""
    def role_checker(current_user = Depends(get_current_user)):
        from models.patient_user import PatientUser
        
        # Patients can't access doctor routes
        if isinstance(current_user, PatientUser):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This feature is only available for healthcare providers. Please log in as a doctor or staff member."
            )
        
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {', '.join(allowed_roles)}. Your role: {current_user.role.value}"
            )
        return current_user
    return role_checker

def require_patient():
    """Dependency to require patient user"""
    def patient_checker(current_user = Depends(get_current_user)):
        from models.patient_user import PatientUser
        
        if not isinstance(current_user, PatientUser):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This feature is only available for patients."
            )
        return current_user
    return patient_checker

