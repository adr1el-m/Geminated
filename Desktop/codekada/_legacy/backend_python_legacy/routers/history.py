from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.neon import get_db, TriageSession
from services.groq_service import client, MODEL

router = APIRouter()

@router.get("/")
async def get_history(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    query = select(TriageSession).where(TriageSession.session_token == token).order_by(TriageSession.created_at.desc())
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    # Generate personal pattern summary if history exists
    summary = "No history available."
    if sessions:
        symptoms = [s.symptoms_raw for s in sessions[:5]]
        prompt = f"Given these recent symptom reports: {symptoms}. Write a 1-sentence health pattern summary for the user (e.g. 'You've been reporting cough frequently')."
        ai_response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=MODEL
        )
        summary = ai_response.choices[0].message.content
        
    return {
        "history": sessions,
        "summary": summary
    }
