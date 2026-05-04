from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from database.neon import get_db, TriageSession
from datetime import datetime, timedelta
from typing import List, Dict

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    today = datetime.utcnow().date()
    
    # Total reports today
    total_today_query = select(func.count(TriageSession.id)).where(func.date(TriageSession.created_at) == today)
    total_today = await db.scalar(total_today_query)
    
    # Average urgency score
    avg_score_query = select(func.avg(TriageSession.urgency_score))
    avg_score = await db.scalar(avg_score_query) or 0
    
    # Most affected region
    region_query = select(TriageSession.region, func.count(TriageSession.id)).group_by(TriageSession.region).order_by(desc(func.count(TriageSession.id))).limit(1)
    region_result = await db.execute(region_query)
    most_affected = region_result.first()
    
    return {
        "total_reports_today": total_today,
        "avg_urgency_score": round(float(avg_score), 1),
        "most_affected_region": most_affected[0] if most_affected else "None",
        "top_symptoms": [] # Placeholder for future NLP extraction
    }

@router.get("/by-region")
async def get_by_region(db: AsyncSession = Depends(get_db)):
    query = select(
        TriageSession.region, 
        func.count(TriageSession.id).label("report_count"),
        func.avg(TriageSession.urgency_score).label("avg_urgency")
    ).group_by(TriageSession.region)
    
    result = await db.execute(query)
    return [
        {"region": row.region, "report_count": row.report_count, "avg_urgency": round(float(row.avg_urgency), 1)}
        for row in result.all()
    ]

@router.get("/trend")
async def get_trend(days: int = 7, db: AsyncSession = Depends(get_db)):
    since_date = datetime.utcnow() - timedelta(days=days)
    query = select(
        func.date(TriageSession.created_at).label("date"),
        func.count(TriageSession.id).label("count"),
        func.avg(TriageSession.urgency_score).label("avg_urgency")
    ).where(TriageSession.created_at >= since_date).group_by(func.date(TriageSession.created_at)).order_by("date")
    
    result = await db.execute(query)
    return [
        {"date": row.date.isoformat(), "count": row.count, "avg_urgency": round(float(row.avg_urgency), 1)}
        for row in result.all()
    ]
