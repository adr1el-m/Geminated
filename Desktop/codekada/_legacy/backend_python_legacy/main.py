from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import triage, dashboard, alerts, history, auth, appointments
from database.neon import init_db, Facility, AsyncSessionLocal
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Haliya API", description="AI Health Triage & Intelligence Platform")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from sqlalchemy import select
from database.neon import init_db, Facility
from services.auth_utils import get_password_hash

@app.on_event("startup")
async def startup_event():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Add a default facility if none exists
        query = select(Facility).limit(1)
        res = await db.execute(query)
        if not res.scalar():
            default_fac = Facility(
                email="admin@stlukes.com",
                password_hash=get_password_hash("password123"),
                name="St. Luke's Medical Center",
                location="Quezon City",
                facility_type="Hospital",
                is_verified=True
            )
            db.add(default_fac)
            await db.commit()

app.include_router(triage.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])

@app.get("/")
async def root():
    return {"message": "Welcome to Haliya API"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
