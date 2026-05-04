import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    full_name = Column(String)
    role = Column(String, default="patient")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    appointments = relationship("Appointment", back_populates="patient")

class Facility(Base):
    __tablename__ = "facilities"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    name = Column(String)
    location = Column(String)
    facility_type = Column(String) # Hospital, Clinic, BHS
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    appointments = relationship("Appointment", back_populates="facility")

class TriageSession(Base):
    __tablename__ = "triage_sessions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_token = Column(String, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    symptoms_raw = Column(Text)
    urgency_level = Column(String)
    urgency_score = Column(Integer)
    region = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    age = Column(Integer, nullable=True)
    sex = Column(String, nullable=True)
    language = Column(String, default="English")

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("users.id"))
    facility_id = Column(String, ForeignKey("facilities.id"))
    appointment_date = Column(DateTime)
    status = Column(String, default="pending") # pending, confirmed, cancelled, completed
    symptoms_summary = Column(Text)
    triage_score = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("User", back_populates="appointments")
    facility = relationship("Facility", back_populates="appointments")

class OutbreakAlert(Base):
    __tablename__ = "outbreak_alerts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symptom_cluster = Column(String)
    region = Column(String)
    spike_percentage = Column(Float)
    severity = Column(String)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
