from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database.neon import get_db
from services.spike_detector import get_active_alerts, check_for_spikes

router = APIRouter()

@router.get("/active")
async def active_alerts(db: AsyncSession = Depends(get_db)):
    return await get_active_alerts(db)

@router.post("/check")
async def trigger_spike_check(db: AsyncSession = Depends(get_db)):
    await check_for_spikes(db)
    return {"status": "Check completed"}
