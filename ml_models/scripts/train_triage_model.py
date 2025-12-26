"""
Triage Model Training Script
Trains a RandomForestClassifier to predict patient urgency level based on vitals
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import os

# Set random seed for reproducibility
np.random.seed(42)

def generate_synthetic_triage_data(n_samples=2000):
    """
    Generate realistic synthetic triage data based on medical guidelines
    This simulates real patient vitals and urgency levels
    """
    data = []
    
    for _ in range(n_samples):
        age = np.random.randint(1, 100)
        
        # Generate vitals with some correlation to urgency
        # Low urgency: normal vitals
        # High urgency: abnormal vitals
        urgency_base = np.random.choice([1, 2, 3, 4, 5], p=[0.1, 0.15, 0.25, 0.3, 0.2])
        
        if urgency_base == 1:  # Emergency
            temp = np.random.normal(38.5, 1.5)
            hr = np.random.randint(100, 150)
            sys_bp = np.random.choice([np.random.randint(70, 90), np.random.randint(160, 200)], p=[0.4, 0.6])
            dia_bp = np.random.randint(40, 110)
            o2 = np.random.randint(85, 94)
        elif urgency_base == 2:  # High
            temp = np.random.normal(37.5, 1.2)
            hr = np.random.randint(90, 130)
            sys_bp = np.random.choice([np.random.randint(90, 100), np.random.randint(140, 160)], p=[0.3, 0.7])
            dia_bp = np.random.randint(50, 100)
            o2 = np.random.randint(90, 96)
        elif urgency_base == 3:  # Medium
            temp = np.random.normal(37.0, 0.8)
            hr = np.random.randint(70, 100)
            sys_bp = np.random.randint(100, 140)
            dia_bp = np.random.randint(60, 90)
            o2 = np.random.randint(94, 98)
        elif urgency_base == 4:  # Low
            temp = np.random.normal(36.8, 0.5)
            hr = np.random.randint(60, 85)
            sys_bp = np.random.randint(110, 130)
            dia_bp = np.random.randint(65, 85)
            o2 = np.random.randint(96, 100)
        else:  # Normal
            temp = np.random.normal(36.6, 0.3)
            hr = np.random.randint(60, 80)
            sys_bp = np.random.randint(110, 120)
            dia_bp = np.random.randint(70, 80)
            o2 = np.random.randint(98, 100)
        
        # Ensure values are within reasonable bounds
        temp = max(35.0, min(41.0, temp))
        hr = max(40, min(180, hr))
        sys_bp = max(70, min(220, sys_bp))
        dia_bp = max(40, min(130, dia_bp))
        o2 = max(80, min(100, o2))
        
        data.append({
            'age': age,
            'temperature': round(temp, 1),
            'heart_rate': hr,
            'systolic_bp': sys_bp,
            'diastolic_bp': dia_bp,
            'oxygen_saturation': o2,
            'urgency_level': urgency_base
        })
    
    return pd.DataFrame(data)

def parse_blood_pressure(bp_string):
    """Parse blood pressure string (e.g., '120/80') into systolic and diastolic"""
    if pd.isna(bp_string) or bp_string == '':
        return None, None
    try:
        parts = str(bp_string).split('/')
        if len(parts) == 2:
            return int(parts[0].strip()), int(parts[1].strip())
    except:
        pass
    return None, None

def prepare_features(df):
    """Prepare features for training"""
    # If BP is already split, use it; otherwise parse from string
    if 'systolic_bp' not in df.columns and 'blood_pressure' in df.columns:
        bp_data = df['blood_pressure'].apply(parse_blood_pressure)
        df['systolic_bp'] = bp_data.apply(lambda x: x[0] if x[0] else np.nan)
        df['diastolic_bp'] = bp_data.apply(lambda x: x[1] if x[1] else np.nan)
    
    # Select features
    feature_cols = ['age', 'temperature', 'heart_rate', 'systolic_bp', 'diastolic_bp', 'oxygen_saturation']
    
    # Handle missing values with median imputation
    X = df[feature_cols].copy()
    X = X.fillna(X.median())
    
    return X

def train_triage_model():
    """Train the triage urgency prediction model"""
    print("=" * 60)
    print("Training Triage Model")
    print("=" * 60)
    
    # Try to load from downloaded dataset, otherwise generate synthetic
    dataset_path = os.path.join(os.path.dirname(__file__), 'datasets', 'vital_signs_triage.csv')
    
    if os.path.exists(dataset_path):
        print("\n1. Loading dataset from file...")
        try:
            df = pd.read_csv(dataset_path)
            print(f"   Loaded {len(df)} samples from {dataset_path}")
        except Exception as e:
            print(f"   Error loading dataset: {e}")
            print("   Falling back to generating synthetic data...")
            df = generate_synthetic_triage_data(n_samples=3000)
            print(f"   Generated {len(df)} samples")
    else:
        print("\n1. Dataset file not found, generating synthetic data...")
        df = generate_synthetic_triage_data(n_samples=3000)
        print(f"   Generated {len(df)} samples")
    
    # Prepare features and target
    print("\n2. Preparing features...")
    X = prepare_features(df)
    y = df['urgency_level'].values
    
    # Map urgency levels: 1=Emergency, 2=High, 3=Medium, 4=Low, 5=Normal
    # Convert to classification: 1-5 become 0-4 for sklearn
    y_class = y - 1  # Map 1-5 to 0-4
    
    # Split data
    print("\n3. Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_class, test_size=0.2, random_state=42, stratify=y_class
    )
    print(f"   Training samples: {len(X_train)}")
    print(f"   Test samples: {len(X_test)}")
    
    # Train model
    print("\n4. Training RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    print("\n5. Evaluating model...")
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"   Accuracy: {accuracy:.4f}")
    
    print("\n6. Classification Report:")
    print(classification_report(y_test, y_pred, 
                                target_names=['Emergency(1)', 'High(2)', 'Medium(3)', 'Low(4)', 'Normal(5)']))
    
    # Feature importance
    print("\n7. Feature Importance:")
    feature_names = X.columns.tolist()
    importances = model.feature_importances_
    for feature, importance in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True):
        print(f"   {feature}: {importance:.4f}")
    
    # Save model
    print("\n8. Saving model...")
    os.makedirs('ml_models/registry', exist_ok=True)
    model_path = 'ml_models/registry/triage_model.pkl'
    joblib.dump(model, model_path)
    print(f"   Model saved to {model_path}")
    
    # Save feature names for inference
    feature_info = {
        'feature_names': feature_names,
        'feature_order': feature_names
    }
    joblib.dump(feature_info, 'ml_models/registry/triage_features.pkl')
    print(f"   Feature info saved to ml_models/registry/triage_features.pkl")
    
    print("\n" + "=" * 60)
    print("Training complete!")
    print("=" * 60)
    
    return model, accuracy

if __name__ == '__main__':
    model, accuracy = train_triage_model()
    print(f"\nFinal Model Accuracy: {accuracy:.4f}")

