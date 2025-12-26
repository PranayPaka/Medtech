
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []

class ChatResponse(BaseModel):
    response: str

@router.post("/query", response_model=ChatResponse)
async def query_chatbot(request: ChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Using the model confirmed earlier to work
        model = genai.GenerativeModel('gemini-flash-latest')
        
        chat = model.start_chat(history=[])
        
        system_instruction = (
            "You are a helpful medical assistant for the MedTech platform. "
            "You can answer basic questions about medicines, their uses, and general health advice. "
            "Always include a disclaimer that you are an AI and users should consult a professional. "
            "Be concise and professional."
        )
        
        full_prompt = f"{system_instruction}\n\nUser Question: {request.message}"
        response = chat.send_message(full_prompt)
        
        return ChatResponse(response=response.text)
    except Exception as e:
        print(f"Chatbot error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
