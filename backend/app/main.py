"""
CoverWise - Backend API Entry Point
Intelligent Life Insurance Needs Finder & Digital Advisory Platform
"""

import datetime
import sqlite3
from typing import List
from fastapi import FastAPI, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    CalculationRequest,
    CalculationResponse,
    AppointmentCreateRequest,
    AppointmentResponse,
    SafeAppointmentSummary,
    mask_name,
    mask_email,
)
from app.calculators import run_full_assessment
from app.database import (
    init_db,
    insert_appointment,
    get_appointment_by_id,
    list_appointments,
    check_slot_available,
    format_reference_id,
)

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


# Initialize the FastAPI application
app = FastAPI(
    title="CoverWise API",
    description="Backend service for CoverWise - Intelligent Life Insurance Needs Finder",
    version="0.1.0",
    lifespan=lifespan,
)

# Initialize SQLite database schema
init_db()

# Configure CORS (Cross-Origin Resource Sharing)
# This allows our React frontend running on localhost:5173 to communicate with this backend.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Welcome endpoint providing basic API info."""
    return {
        "app": "CoverWise API",
        "tagline": "Know Your Cover. Protect Your Future.",
        "status": "online",
        "docs_url": "/docs",
    }


@app.get("/health")
@app.get("/api/health")
def health_check():
    """Health check endpoint to verify the server is running properly."""
    return {
        "status": "ok",
        "app": "CoverWise",
        "tagline": "Know Your Cover. Protect Your Future.",
        "version": "0.1.0",
    }


@app.post(
    "/api/calculate",
    response_model=CalculationResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate Life Insurance Needs (Net Needs & Human Life Value)",
    description=(
        "Calculates required life cover using the Net Needs Method (clamped to zero if negative) "
        "and evaluates Human Life Value (HLV) as an earning-capacity benchmark."
    ),
)
def calculate_needs(payload: CalculationRequest) -> CalculationResponse:
    """
    Execute Net Needs calculation and HLV benchmark with validated parameters.
    """
    result = run_full_assessment(
        annual_income_contribution=payload.annual_income_contribution,
        replacement_years=payload.replacement_years,
        remaining_earning_years=payload.remaining_earning_years,
        outstanding_liabilities=payload.outstanding_liabilities,
        future_financial_goals=payload.future_financial_goals,
        available_assets=payload.available_assets,
        existing_life_insurance=payload.existing_life_insurance,
        discount_rate=payload.discount_rate if payload.discount_rate is not None else 0.05,
        age=payload.age if payload.age is not None else 35,
        dependents_count=payload.dependents_count,
        monthly_household_expenses=payload.monthly_household_expenses,
        annual_premium_budget=payload.annual_premium_budget if payload.annual_premium_budget is not None else 50000.0,
        calculation_method=payload.calculation_method or "net_needs",
        risk_preference=payload.risk_preference or "moderate",
    )
    return CalculationResponse(**result)


@app.post(
    "/api/appointments",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Request an Educational Advisory Consultation Appointment (Demo)",
    description=(
        "Persists an appointment request into SQLite. Status is strictly 'REQUESTED'. "
        "Rejects conflicting bookings on the same date and slot with HTTP 409 Conflict. "
        "Never logs personal data to console or files."
    ),
)
def book_appointment(payload: AppointmentCreateRequest) -> AppointmentResponse:
    """
    Create a new appointment request in SQLite with status REQUESTED.
    Personal data is validated and stored securely without logging PII.
    Rejects conflicting double bookings on the same date and slot.
    """
    if not check_slot_available(payload.preferred_date, payload.preferred_time_slot):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"The appointment slot '{payload.preferred_time_slot}' on {payload.preferred_date} "
                "is already booked. Please choose an alternate date or time slot."
            ),
        )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    record = {
        "full_name": payload.full_name,
        "email": payload.email,
        "phone": payload.phone,
        "preferred_date": payload.preferred_date,
        "preferred_time_slot": payload.preferred_time_slot,
        "consultation_type": payload.consultation_type,
        "notes": payload.notes,
        "recommended_cover": payload.recommended_cover,
        "status": "REQUESTED",
        "created_at": now_iso,
    }
    try:
        new_id = insert_appointment(record)
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"The appointment slot '{payload.preferred_time_slot}' on {payload.preferred_date} "
                "is already booked. Please choose an alternate date or time slot."
            ),
        )
    ref_id = format_reference_id(new_id)

    return AppointmentResponse(
        id=new_id,
        reference_id=ref_id,
        full_name=record["full_name"],
        email=record["email"],
        phone=record["phone"],
        preferred_date=record["preferred_date"],
        preferred_time_slot=record["preferred_time_slot"],
        consultation_type=record["consultation_type"],
        notes=record["notes"],
        recommended_cover=record["recommended_cover"],
        status="REQUESTED",
        created_at=now_iso,
    )


@app.get(
    "/api/appointments",
    response_model=List[SafeAppointmentSummary],
    status_code=status.HTTP_200_OK,
    summary="List Appointment Requests (Safe Masked View for Dev/Demo Verification)",
    description=(
        "Returns appointment requests with personal data masked (names, emails masked; "
        "phone numbers and private notes omitted) to protect privacy."
    ),
)
def get_safe_appointments(limit: int = 50) -> List[SafeAppointmentSummary]:
    """Retrieve appointments with masked PII for safe dev/demo verification."""
    records = list_appointments(limit=limit)
    return [
        SafeAppointmentSummary(
            id=r["id"],
            reference_id=format_reference_id(r["id"]),
            masked_name=mask_name(r["full_name"]),
            masked_email=mask_email(r["email"]),
            preferred_date=r["preferred_date"],
            preferred_time_slot=r["preferred_time_slot"],
            consultation_type=r["consultation_type"],
            recommended_cover=r["recommended_cover"],
            status=r["status"],
            created_at=r["created_at"],
        )
        for r in records
    ]


@app.get(
    "/api/appointments/{appointment_id}",
    response_model=SafeAppointmentSummary,
    status_code=status.HTTP_200_OK,
    summary="Get Single Appointment Request (Safe Masked View)",
)
def get_safe_appointment_detail(appointment_id: int) -> SafeAppointmentSummary:
    """Retrieve single appointment by ID with masked PII for safe dev/demo verification."""
    record = get_appointment_by_id(appointment_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment #{appointment_id} not found.",
        )
    return SafeAppointmentSummary(
        id=record["id"],
        reference_id=format_reference_id(record["id"]),
        masked_name=mask_name(record["full_name"]),
        masked_email=mask_email(record["email"]),
        preferred_date=record["preferred_date"],
        preferred_time_slot=record["preferred_time_slot"],
        consultation_type=record["consultation_type"],
        recommended_cover=record["recommended_cover"],
        status=record["status"],
        created_at=record["created_at"],
    )
