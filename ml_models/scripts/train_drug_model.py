"""
Drug Recommendation Model Training Script
Trains a DecisionTree/RandomForest model to recommend drug categories based on condition, age, and allergies
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# Set random seed for reproducibility
np.random.seed(42)

# Common medical conditions and their typical drug categories
CONDITION_TO_DRUG_CATEGORY = {
    # Infections
    'bacterial_infection': 'Antibiotic',
    'urinary_tract_infection': 'Antibiotic',
    'respiratory_infection': 'Antibiotic',
    'skin_infection': 'Antibiotic',
    
    # Pain & Inflammation
    'headache': 'Analgesic',
    'migraine': 'Analgesic',
    'muscle_pain': 'Analgesic',
    'joint_pain': 'NSAID',
    'arthritis': 'NSAID',
    'back_pain': 'Analgesic',
    
    # Respiratory
    'asthma': 'Bronchodilator',
    'cough': 'Antitussive',
    'cold': 'Decongestant',
    'allergy': 'Antihistamine',
    'sinusitis': 'Decongestant',
    
    # Digestive
    'acid_reflux': 'Antacid',
    'diarrhea': 'Antidiarrheal',
    'constipation': 'Laxative',
    'nausea': 'Antiemetic',
    
    # Cardiovascular
    'hypertension': 'Antihypertensive',
    'high_blood_pressure': 'Antihypertensive',
    
    # Mental Health
    'anxiety': 'Anxiolytic',
    'depression': 'Antidepressant',
    'insomnia': 'Sedative',
    
    # Other
    'fever': 'Antipyretic',
    'diabetes': 'Antidiabetic',
    'infection': 'Antibiotic',
}

# Drug categories
DRUG_CATEGORIES = [
    'Antibiotic', 'Analgesic', 'NSAID', 'Antihistamine',
    'Decongestant', 'Antacid', 'Antidiarrheal', 'Laxative',
    'Antiemetic', 'Antipyretic', 'Bronchodilator', 'Antitussive',
    'Antihypertensive', 'Anxiolytic', 'Antidepressant', 'Sedative',
    'Antidiabetic', 'None'
]

# Common allergies that affect drug selection
ALLERGIES = ['penicillin', 'sulfa', 'aspirin', 'codeine', 'latex', 'none']

def generate_synthetic_drug_data(n_samples=2500):
    """
    Generate realistic synthetic drug recommendation data
    """
    data = []
    
    conditions = list(CONDITION_TO_DRUG_CATEGORY.keys())
    
    for _ in range(n_samples):
        age = np.random.randint(1, 100)
        condition = np.random.choice(conditions)
        expected_category = CONDITION_TO_DRUG_CATEGORY[condition]
        
        # Select allergy (some affect drug choice)
        allergy = np.random.choice(ALLERGIES, p=[0.1, 0.05, 0.08, 0.05, 0.02, 0.7])
        
        # Adjust drug category based on allergy
        recommended_category = expected_category
        
        # Allergy-based adjustments
        if allergy == 'penicillin' and expected_category == 'Antibiotic':
            # Avoid penicillin-based antibiotics
            recommended_category = np.random.choice(['Antibiotic', 'None'], p=[0.3, 0.7])
        elif allergy == 'aspirin' and expected_category in ['Analgesic', 'NSAID']:
            # Avoid aspirin/NSAIDs
            recommended_category = 'Analgesic'  # Use alternative
        elif allergy == 'sulfa' and expected_category == 'Antibiotic':
            recommended_category = np.random.choice(['Antibiotic', 'None'], p=[0.4, 0.6])
        
        # Age-based adjustments
        if age < 12 and expected_category in ['Antibiotic', 'Analgesic']:
            # Pediatric considerations
            recommended_category = expected_category  # Keep but may need dosage adjustment
        
        # Add some noise/variation
        if np.random.random() < 0.1:  # 10% chance of no medication recommended
            recommended_category = 'None'
        
        # Generate warning message
        warning = None
        if allergy != 'none' and recommended_category != 'None':
            warning = f"Patient has {allergy} allergy - verify compatibility"
        elif age < 5 or age > 75:
            warning = "Special dosage considerations for age group"
        
        data.append({
            'condition': condition,
            'age': age,
            'allergy': allergy,
            'drug_category': recommended_category,
            'has_warning': 1 if warning else 0
        })
    
    return pd.DataFrame(data)

def encode_features(df, label_encoders=None, fit=True):
    """Encode categorical features"""
    if label_encoders is None:
        label_encoders = {
            'condition': LabelEncoder(),
            'allergy': LabelEncoder(),
        }
    
    df_encoded = df.copy()
    
    if fit:
        df_encoded['condition_encoded'] = label_encoders['condition'].fit_transform(df['condition'])
        df_encoded['allergy_encoded'] = label_encoders['allergy'].fit_transform(df['allergy'])
    else:
        # For inference, handle unseen labels
        df_encoded['condition_encoded'] = df['condition'].apply(
            lambda x: label_encoders['condition'].transform([x])[0] 
            if x in label_encoders['condition'].classes_ else -1
        )
        df_encoded['allergy_encoded'] = df['allergy'].apply(
            lambda x: label_encoders['allergy'].transform([x])[0] 
            if x in label_encoders['allergy'].classes_ else 0
        )
    
    return df_encoded, label_encoders

def train_drug_model():
    """Train the drug recommendation model"""
    print("=" * 60)
    print("Training Drug Recommendation Model")
    print("=" * 60)
    
    # Try to load from downloaded dataset, otherwise generate synthetic
    dataset_path = os.path.join(os.path.dirname(__file__), 'datasets', 'drug_recommendations.csv')
    
    if os.path.exists(dataset_path):
        print("\n1. Loading dataset from file...")
        try:
            df = pd.read_csv(dataset_path)
            print(f"   Loaded {len(df)} samples from {dataset_path}")
        except Exception as e:
            print(f"   Error loading dataset: {e}")
            print("   Falling back to generating synthetic data...")
            df = generate_synthetic_drug_data(n_samples=3500)
            print(f"   Generated {len(df)} samples")
    else:
        print("\n1. Dataset file not found, generating synthetic data...")
        df = generate_synthetic_drug_data(n_samples=3500)
        print(f"   Generated {len(df)} samples")
    
    # Encode features
    print("\n2. Encoding features...")
    df_encoded, label_encoders = encode_features(df, fit=True)
    
    # Prepare features
    X = df_encoded[['age', 'condition_encoded', 'allergy_encoded']].values
    y = df_encoded['drug_category'].values
    
    # Ensure target values are strings (handle any NaN values)
    y = pd.Series(y).fillna('None').astype(str).values
    
    # Encode target
    target_encoder = LabelEncoder()
    y_encoded = target_encoder.fit_transform(y)
    
    # Split data
    print("\n3. Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"   Training samples: {len(X_train)}")
    print(f"   Test samples: {len(X_test)}")
    
    # Train model
    print("\n4. Training RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
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
    print(classification_report(y_test, y_pred, target_names=target_encoder.classes_))
    
    # Feature importance
    print("\n7. Feature Importance:")
    feature_names = ['age', 'condition', 'allergy']
    importances = model.feature_importances_
    for feature, importance in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True):
        print(f"   {feature}: {importance:.4f}")
    
    # Save model and encoders
    print("\n8. Saving model and encoders...")
    os.makedirs('ml_models/registry', exist_ok=True)
    model_path = 'ml_models/registry/drug_model.pkl'
    joblib.dump(model, model_path)
    print(f"   Model saved to {model_path}")
    
    # Save encoders
    encoders = {
        'condition_encoder': label_encoders['condition'],
        'allergy_encoder': label_encoders['allergy'],
        'target_encoder': target_encoder
    }
    joblib.dump(encoders, 'ml_models/registry/drug_encoders.pkl')
    print(f"   Encoders saved to ml_models/registry/drug_encoders.pkl")
    
    # Save condition mapping for reference
    condition_mapping = CONDITION_TO_DRUG_CATEGORY
    joblib.dump(condition_mapping, 'ml_models/registry/drug_condition_mapping.pkl')
    print(f"   Condition mapping saved to ml_models/registry/drug_condition_mapping.pkl")
    
    print("\n" + "=" * 60)
    print("Training complete!")
    print("=" * 60)
    
    return model, accuracy, encoders

if __name__ == '__main__':
    model, accuracy, encoders = train_drug_model()
    print(f"\nFinal Model Accuracy: {accuracy:.4f}")

