from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.neon import get_db, Appointment, Facility, User
from services.auth_utils import get_current_user_payload
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class AppointmentCreate(BaseModel):
    facility_id: str
    appointment_date: datetime
    symptoms_summary: str
    triage_score: int

class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    facility_id: str
    appointment_date: datetime
    status: str
    symptoms_summary: str
    triage_score: int
    patient_name: Optional[str] = None
    facility_name: Optional[str] = None

    class Config:
        from_attributes = True

@router.post("/", response_model=AppointmentResponse)
async def create_appointment(data: AppointmentCreate, payload: dict = Depends(get_current_user_payload), db: AsyncSession = Depends(get_db)):
    if payload.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Only patients can book appointments")
    
    new_appointment = Appointment(
        patient_id=payload.get("id"),
        facility_id=data.facility_id,
        appointment_date=data.appointment_date,
        symptoms_summary=data.symptoms_summary,
        triage_score=data.triage_score
    )
    db.add(new_appointment)
    await db.commit()
    await db.refresh(new_appointment)
    return new_appointment

@router.get("/my-appointments", response_model=List[AppointmentResponse])
async def get_my_appointments(payload: dict = Depends(get_current_user_payload), db: AsyncSession = Depends(get_db)):
    if payload.get("role") == "patient":
        query = select(Appointment).where(Appointment.patient_id == payload.get("id")).order_by(Appointment.appointment_date.desc())
    else:
        query = select(Appointment).where(Appointment.facility_id == payload.get("id")).order_by(Appointment.appointment_date.desc())
    
    result = await db.execute(query)
    appointments = result.scalars().all()
    
    # Enrich with names
    enriched = []
    for appt in appointments:
        # This is a bit inefficient (N+1), but okay for now. Better to use joinedload.
        patient_query = select(User).where(User.id == appt.patient_id)
        p_res = await db.execute(patient_query)
        p = p_res.scalar()
        
        facility_query = select(Facility).where(Facility.id == appt.facility_id)
        f_res = await db.execute(facility_query)
        f = f_res.scalar()
        
        enriched.append(AppointmentResponse(
            id=appt.id,
            patient_id=appt.patient_id,
            facility_id=appt.facility_id,
            appointment_date=appt.appointment_date,
            status=appt.status,
            symptoms_summary=appt.symptoms_summary,
            triage_score=appt.triage_score,
            patient_name=p.full_name if p else "Unknown",
            facility_name=f.name if f else "Unknown"
        ))
    
    return enriched

@router.patch("/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, status: str, payload: dict = Depends(get_current_user_payload), db: AsyncSession = Depends(get_db)):
    if payload.get("role") != "facility":
        raise HTTPException(status_code=403, detail="Only facilities can update appointment status")
    
    query = select(Appointment).where(Appointment.id == appointment_id, Appointment.facility_id == payload.get("id"))
    result = await db.execute(query)
    appt = result.scalar()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appt.status = status
    await db.commit()
    return {"message": f"Appointment {status}"}

@router.get("/facilities", response_model=List[dict])
async def list_facilities(db: AsyncSession = Depends(get_db)):
    query = select(Facility).where(Facility.is_verified == True)
    result = await db.execute(query)
    # Return basic info
    return [{"id": f.id, "name": f.name, "location": f.location, "type": f.facility_type} for f in result.scalars().all()]
