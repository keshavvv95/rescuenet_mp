from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import engine, Base
from app.routers import (
    auth, reports, officer, volunteer, feed, adoptions, cruelty_sos, analytics_donations, notifications
)

# Auto-create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RescueNet API",
    description="Full-stack AI-Assisted Stray Animal Welfare Management Platform API Specification",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Enable CORS for frontend dev origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static upload directories exist
os.makedirs("static/uploads/temp", exist_ok=True)
os.makedirs("static/uploads/reports", exist_ok=True)

# Mount static directory for image serving
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include Routers for all RescueNet Modules
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(officer.router)
app.include_router(volunteer.router)
app.include_router(feed.router)
app.include_router(adoptions.router)
app.include_router(cruelty_sos.router)
app.include_router(analytics_donations.router)
app.include_router(notifications.router)

@app.get("/", tags=["Health Check"])
def read_root():
    return {
        "title": "RescueNet Platform API",
        "status": "healthy",
        "documentation": "/docs",
        "openapi_spec": "/openapi.json"
    }
