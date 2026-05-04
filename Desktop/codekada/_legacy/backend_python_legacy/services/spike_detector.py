from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database.neon import TriageSession, OutbreakAlert
from datetime import datetime, timedelta
from services.groq_service import client, MODEL
import json

async def check_for_spikes(db: AsyncSession):
    """
    Check if report_count for any region in last 24hrs > 2x the 7-day average.
    """
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)
    
    # Get 24h counts per region
    query_24h = select(TriageSession.region, func.count(TriageSession.id).label("count")).where(TriageSession.created_at >= last_24h).group_by(TriageSession.region)
    result_24h = await db.execute(query_24h)
    counts_24h = {row.region: row.count for row in result_24h.all()}
    
    # Get 7d average counts per region (excluding last 24h for better comparison)
    query_7d = select(TriageSession.region, (func.count(TriageSession.id) / 6).label("avg")).where(TriageSession.created_at >= last_7d).where(TriageSession.created_at < last_24h).group_by(TriageSession.region)
    result_7d = await db.execute(query_7d)
    avgs_7d = {row.region: row.avg for row in result_7d.all()}
    
    for region, count in counts_24h.items():
        avg = avgs_7d.get(region, 1) # Avoid div by zero
        if count > avg * 2 and count > 5: # At least 5 reports to avoid noise
            spike_pct = ((count - avg) / avg) * 100
            
            # Generate AI alert message
            prompt = f"A {spike_pct:.1f}% spike in health reports was detected in {region}. Write a concise 1-sentence public health warning."
            ai_response = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=MODEL
            )
            message = ai_response.choices[0].message.content
            
            # Create alert
            alert = OutbreakAlert(
                symptom_cluster="General Symptoms", # Simplified
                region=region,
                spike_percentage=spike_pct,
                severity="warning" if spike_pct > 100 else "alert",
                message=message
            )
            db.add(alert)
    
    await db.commit()

async def get_active_alerts(db: AsyncSession):
    since_date = datetime.utcnow() - timedelta(hours=48)
    query = select(OutbreakAlert).where(OutbreakAlert.created_at >= since_date).order_by(OutbreakAlert.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()
