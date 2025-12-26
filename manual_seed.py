import sqlite3
import json
import uuid
from datetime import datetime, timedelta
import os

DB_PATH = 'backend/medtech.db'

def setup_and_seed():
    if not os.path.exists('backend'):
        os.makedirs('backend')

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Clear specific tables (preserving users for authentication)
        target_tables = ['prescriptions', 'triage_results', 'patients', 'drug_verifications']
        for table in target_tables:
            print(f"Cleaning up {table} table...")
            cursor.execute(f"DELETE FROM {table}")

        # Ensure core tables exist (including users)
        print("Ensuring core tables exist...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR PRIMARY KEY,
                email VARCHAR UNIQUE NOT NULL,
                password_hash VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                role VARCHAR NOT NULL,
                department VARCHAR,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Check if a default doctor exists, if not, create one
        cursor.execute("SELECT id FROM users WHERE email = 'doctor@medical.com'")
        doctor_row = cursor.fetchone()
        if not doctor_row:
            from passlib.hash import bcrypt
            doctor_id = "doctor-001"
            hashed_pwd = bcrypt.hash("password123")
            print("Creating default doctor account (doctor@medical.com / password123)...")
            cursor.execute("""
                INSERT INTO users (id, email, password_hash, name, role, department)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (doctor_id, "doctor@medical.com", hashed_pwd, "Dr. Smith", "doctor", "Cardiology"))
        else:
            doctor_id = doctor_row[0]
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS prescriptions (
                id VARCHAR PRIMARY KEY,
                patient_id VARCHAR NOT NULL,
                patient_name VARCHAR NOT NULL,
                doctor_id VARCHAR NOT NULL,
                doctor_name VARCHAR NOT NULL,
                diagnosis VARCHAR NOT NULL,
                medications JSON NOT NULL,
                instructions VARCHAR NOT NULL,
                verification_hash VARCHAR UNIQUE,
                follow_up_date DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS triage_results (
                id VARCHAR PRIMARY KEY,
                patient_id VARCHAR NOT NULL,
                patient_name VARCHAR NOT NULL,
                urgency_level INTEGER NOT NULL,
                category VARCHAR NOT NULL,
                explanation VARCHAR NOT NULL,
                confidence FLOAT NOT NULL,
                source VARCHAR NOT NULL,
                symptoms VARCHAR NOT NULL,
                vitals JSON,
                recommended_action VARCHAR,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                age INTEGER,
                gender VARCHAR,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 1. Mock Prescription
        patient_id = "sarah-jenkins-001"
        patient_name = "Sarah Jenkins"
        doctor_id = "doctor-001"
        doctor_name = "Dr. Smith"
        diagnosis = "Chronic Hypertension and Mild Anxiety"
        
        medications = [
            {"name": "Lisinopril", "dosage": "10mg", "frequency": "Once daily", "duration": "30 days", "notes": "Morning"},
            {"name": "Sertraline", "dosage": "50mg", "frequency": "Once daily", "duration": "60 days", "notes": "With food"}
        ]
        
        v_hash = "SJ-TEST-001"
        created_at = datetime.utcnow().isoformat()

        print(f"Adding mock prescription for {patient_name}...")
        cursor.execute("""
            INSERT INTO prescriptions (
                id, patient_id, patient_name, doctor_id, doctor_name, 
                diagnosis, medications, instructions, verification_hash, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), patient_id, patient_name, doctor_id, doctor_name, diagnosis, json.dumps(medications), "Follow up in 2 weeks.", v_hash, created_at))

        # 2. Mock Triage Entry
        print(f"Adding mock triage entry for {patient_name}...")
        vitals = {
            "temperature": 38.2,
            "heartRate": 95,
            "bloodPressure": "145/92",
            "oxygenSaturation": 96
        }
        cursor.execute("""
            INSERT INTO triage_results (
                id, patient_id, patient_name, urgency_level, category,
                explanation, confidence, source, symptoms, vitals, recommended_action, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()), patient_id, patient_name, 2, "High",
            "Elevated blood pressure and moderate fever detected. Patient reports persistent headache.", 
            0.88, "ai", "Persistent headache, chest tightness, and fever.", 
            json.dumps(vitals), "Urgent evaluation required. Monitor vitals every 15 mins.", created_at
        ))

        # 3. Patient record
        cursor.execute("INSERT INTO patients (id, name, age, gender, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)", 
                       (patient_id, patient_name, 45, "female", created_at, created_at))

        conn.commit()
        print("✅ Successfully wiped and seeded new mock data.")

    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    setup_and_seed()
