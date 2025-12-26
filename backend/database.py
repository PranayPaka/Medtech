
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./medtech.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    from models import User, Patient, PatientUser, TriageResult, Prescription, DrugVerification
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created/verified")
    except Exception as e:
        # Tables may already exist, which is fine
        if "already exists" in str(e).lower():
            print("✅ Database tables already exist")
        else:
            print(f"⚠️  Database initialization note: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

