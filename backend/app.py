
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv
import os

load_dotenv()

from database import init_db
from routes import auth, triage, patients, prescriptions, drug_verify, predictions, chatbot



app = FastAPI(
    title="MedTech Backend API",
    description="Digital Healthcare Platform Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGIN", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()
    print("✅ Database initialized")

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": __import__("datetime").datetime.now().isoformat()}

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(triage.router, prefix="/api/triage", tags=["Triage"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(prescriptions.router, prefix="/api/prescriptions", tags=["Prescriptions"])
app.include_router(drug_verify.router, prefix="/api/drug-verify", tags=["Drug Verification"])
app.include_router(predictions.router, prefix="/api/predict", tags=["ML Predictions"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["AI Chatbot"])

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc)}
    )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3001))
    uvicorn.run(app, host="0.0.0.0", port=port)

