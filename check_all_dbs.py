import sqlite3
import os

def find_db_files(root_dir):
    db_files = []
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if 'venv' in dirs:
            dirs.remove('venv')
        for file in files:
            if file.endswith('.db'):
                db_files.append(os.path.join(root, file))
    return db_files

def dump_all_prescriptions():
    db_files = find_db_files('.')
    print(f"Found DB files: {db_files}")
    
    for db_path in db_files:
        print(f"\n--- Checking {db_path} ---")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='prescriptions'")
            if cursor.fetchone():
                cursor.execute("SELECT patient_name FROM prescriptions")
                rows = cursor.fetchall()
                if rows:
                    print(f"Contents of {db_path} prescriptions table:")
                    for row in rows:
                        print(f"  - {row[0]}")
                else:
                    print(f"Table 'prescriptions' exists but is EMPTY in {db_path}")
            else:
                print(f"Table 'prescriptions' DOES NOT EXIST in {db_path}")
            conn.close()
        except Exception as e:
            print(f"Error checking {db_path}: {e}")

if __name__ == "__main__":
    dump_all_prescriptions()
