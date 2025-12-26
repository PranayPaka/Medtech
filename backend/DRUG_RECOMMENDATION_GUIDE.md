# Drug Recommendation API Guide

## Overview

The drug recommendation endpoint provides ML-powered decision support for drug category selection based on patient condition, age, and allergies.

⚠️ **IMPORTANT**: This is a decision support tool. All recommendations must be verified by a licensed medical professional.

## Endpoint

```
POST /api/predict/drug
```

## Request Body

```json
{
  "condition": "bacterial_infection",
  "age": 45,
  "allergy": "penicillin"
}
```

### Parameters

- `condition` (required, string): Medical condition (e.g., "bacterial_infection", "headache", "fever")
- `age` (required, int): Patient age (0-150)
- `allergy` (optional, string): Known allergy (e.g., "penicillin", "aspirin", "sulfa", "none")

### Supported Conditions

- Infections: `bacterial_infection`, `urinary_tract_infection`, `respiratory_infection`, `skin_infection`, `infection`
- Pain: `headache`, `migraine`, `muscle_pain`, `joint_pain`, `arthritis`, `back_pain`
- Respiratory: `asthma`, `cough`, `cold`, `allergy`, `sinusitis`
- Digestive: `acid_reflux`, `diarrhea`, `constipation`, `nausea`
- Cardiovascular: `hypertension`, `high_blood_pressure`
- Mental Health: `anxiety`, `depression`, `insomnia`
- Other: `fever`, `diabetes`

### Supported Allergies

- `penicillin`
- `sulfa`
- `aspirin`
- `codeine`
- `latex`
- `none` (or omit for no allergies)

## Response

```json
{
  "drug_category": "Antibiotic",
  "warning": "⚠️ IMPORTANT: Patient has penicillin allergy. Verify drug compatibility before prescription.",
  "confidence": 0.85,
  "source": "ml",
  "disclaimer": "⚠️ MEDICAL DISCLAIMER: This is a decision support system. All ML outputs are suggestions only. Final authority rests with the licensed medical professional. Always verify recommendations with clinical judgment and patient history."
}
```

### Response Fields

- `drug_category` (string): Recommended drug category (e.g., "Antibiotic", "Analgesic", "NSAID", "None")
- `warning` (string|null): Warning message about allergies, age considerations, etc.
- `confidence` (float): Model confidence (0.0-1.0)
- `source` (string): "ml" or "rule-based"
- `disclaimer` (string): Ethical disclaimer (always included)

## Example Usage

### Example 1: Headache in adult

```bash
curl -X POST http://localhost:3001/api/predict/drug \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "condition": "headache",
    "age": 35,
    "allergy": "none"
  }'
```

Response:
```json
{
  "drug_category": "Analgesic",
  "warning": null,
  "confidence": 0.89,
  "source": "ml",
  "disclaimer": "..."
}
```

### Example 2: Bacterial infection with penicillin allergy

```bash
curl -X POST http://localhost:3001/api/predict/drug \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "condition": "bacterial_infection",
    "age": 28,
    "allergy": "penicillin"
  }'
```

Response:
```json
{
  "drug_category": "Antibiotic",
  "warning": "⚠️ IMPORTANT: Patient has penicillin allergy. Verify drug compatibility before prescription.",
  "confidence": 0.72,
  "source": "ml",
  "disclaimer": "..."
}
```

### Example 3: Pediatric patient

```bash
curl -X POST http://localhost:3001/api/predict/drug \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "condition": "fever",
    "age": 3,
    "allergy": "none"
  }'
```

Response:
```json
{
  "drug_category": "Antipyretic",
  "warning": "Pediatric dosage required.",
  "confidence": 0.91,
  "source": "ml",
  "disclaimer": "..."
}
```

## Integration Notes

- Always check the `warning` field for allergy or age-related considerations
- The `drug_category` is a suggestion - final prescription decision is with the doctor
- Use `confidence` to gauge model certainty (lower confidence may require more careful review)
- If `source` is "rule-based", the ML model failed to load (fallback mode)

## Drug Categories

Possible categories returned:
- `Antibiotic`, `Analgesic`, `NSAID`, `Antihistamine`, `Decongestant`
- `Antacid`, `Antidiarrheal`, `Laxative`, `Antiemetic`, `Antipyretic`
- `Bronchodilator`, `Antitussive`, `Antihypertensive`, `Anxiolytic`
- `Antidepressant`, `Sedative`, `Antidiabetic`, `None`

## Error Handling

If an error occurs, the endpoint returns a 500 status with error details. The service includes fallback logic, so it will attempt rule-based recommendation if ML fails.

