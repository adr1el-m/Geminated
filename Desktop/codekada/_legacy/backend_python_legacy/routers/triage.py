from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional
from services.groq_service import classify_triage
from services.geolocation import get_region_from_ip
from database.neon import get_db, TriageSession
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

router = APIRouter()

class TriageRequest(BaseModel):
    symptoms: str
    age: Optional[int] = None
    sex: Optional[str] = None
    duration: Optional[str] = None
    conditions: Optional[List[str]] = []
    language: Optional[str] = "English"
    session_token: Optional[str] = None

class TriageResponse(BaseModel):
    id: str
    urgency_level: str
    urgency_color: str
    urgency_score: int
    explanation: str
    recommended_actions: List[str]
    warning_signs: List[str]
    session_id: str

@router.post("/triage", response_model=TriageResponse)
async def get_triage(request_data: TriageRequest, request: Request, db: AsyncSession = Depends(get_db)):
    try:
        # Get triage classification from AI
        result = await classify_triage(
            symptoms=request_data.symptoms,
            age=request_data.age,
            sex=request_data.sex,
            duration=request_data.duration,
            conditions=request_data.conditions,
            language=request_data.language
        )
        
        # Get geolocation from IP
        client_ip = request.client.host
        region = get_region_from_ip(client_ip)
        
        # Log session to database
        new_session = TriageSession(
            session_token=request_data.session_token or str(uuid.uuid4()),
            symptoms_raw=request_data.symptoms,
            urgency_level=result["urgency_level"],
            urgency_score=result["urgency_score"],
            region=region,
            age=request_data.age,
            sex=request_data.sex,
            language=request_data.language
        )
        
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        
        return {**result, "id": new_session.id, "session_id": new_session.session_token}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
