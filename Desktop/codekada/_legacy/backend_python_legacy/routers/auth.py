from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from database.neon import get_db, User, Facility
from services.auth_utils import get_password_hash, verify_password, create_access_token
from typing import Optional

router = APIRouter()

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class FacilityRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    location: str
    facility_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

@router.post("/register/patient", response_model=TokenResponse)
async def register_patient(data: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    query = select(User).where(User.email == data.email)
    result = await db.execute(query)
    if result.scalar():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        full_name=data.full_name,
        role="patient"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email, "role": "patient", "id": new_user.id})
    return {"access_token": access_token, "token_type": "bearer", "role": "patient", "name": new_user.full_name}

@router.post("/register/facility", response_model=TokenResponse)
async def register_facility(data: FacilityRegister, db: AsyncSession = Depends(get_db)):
    # Check if facility exists
    query = select(Facility).where(Facility.email == data.email)
    result = await db.execute(query)
    if result.scalar():
        raise HTTPException(status_code=400, detail="Email already registered for a facility")
    
    new_facility = Facility(
        email=data.email,
        password_hash=get_password_hash(data.password),
        name=data.name,
        location=data.location,
        facility_type=data.facility_type
    )
    db.add(new_facility)
    await db.commit()
    await db.refresh(new_facility)
    
    access_token = create_access_token(data={"sub": new_facility.email, "role": "facility", "id": new_facility.id})
    return {"access_token": access_token, "token_type": "bearer", "role": "facility", "name": new_facility.name}

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Check User first
    user_query = select(User).where(User.email == data.email)
    user_result = await db.execute(user_query)
    user = user_result.scalar()
    
    if user and verify_password(data.password, user.password_hash):
        access_token = create_access_token(data={"sub": user.email, "role": "patient", "id": user.id})
        return {"access_token": access_token, "token_type": "bearer", "role": "patient", "name": user.full_name}
    
    # Check Facility
    facility_query = select(Facility).where(Facility.email == data.email)
    facility_result = await db.execute(facility_query)
    facility = facility_result.scalar()
    
    if facility and verify_password(data.password, facility.password_hash):
        access_token = create_access_token(data={"sub": facility.email, "role": "facility", "id": facility.id})
        return {"access_token": access_token, "token_type": "bearer", "role": "facility", "name": facility.name}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")
