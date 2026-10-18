"""
CoverWise - API Request & Response Schemas
=========================================
Pydantic models ensuring data validation for financial calculations.
Rejects negative numbers and missing mandatory fields.
"""

from typing import Dict, Any, Optional, List
import re
import datetime
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

VALID_TIME_SLOTS: List[str] = [
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM",
    "05:00 PM - 06:00 PM",
]


def mask_name(name: str) -> str:
    """Mask personal name for privacy-safe display."""
    parts = name.strip().split()
    if not parts:
        return "***"
    masked = []
    for p in parts:
        if len(p) <= 2:
            masked.append(p[0] + "*")
        else:
            masked.append(p[0] + "*" * (len(p) - 1))
    return " ".join(masked)


def mask_email(email: str) -> str:
    """Mask email address for privacy-safe display."""
    if "@" not in email:
        return "***"
    local, domain = email.split("@", 1)
    masked_local = (local[0] + "***") if len(local) > 0 else "***"
    if "." in domain:
        parts = domain.split(".", 1)
        masked_domain = (parts[0][0] + "***." + parts[1]) if len(parts[0]) > 0 else "***." + parts[1]
    else:
        masked_domain = "***"
    return f"{masked_local}@{masked_domain}"


class CalculationRequest(BaseModel):
    """
    Financial assessment payload for calculating insurance cover requirements.
    All monetary and duration fields must be non-negative.
    """
    age: Optional[int] = Field(
        default=35,
        ge=18,
        le=75,
        description="Current age in years (18-75).",
        examples=[35],
    )
    annual_income_contribution: float = Field(
        ...,
        ge=0.0,
        description="Annual income contributed towards household living and family support.",
        examples=[600000.0],
    )
    monthly_household_expenses: Optional[float] = Field(
        default=None,
        ge=0.0,
        description="Monthly household expenses (optional).",
        examples=[35000.0],
    )
    dependents_count: int = Field(
        default=2,
        ge=0,
        le=10,
        description="Number of financially dependent family members (0-10).",
        examples=[2],
    )
    replacement_years: float = Field(
        ...,
        ge=0.0,
        description="Number of years household income replacement is required (e.g. until dependents are independent).",
        examples=[15.0],
    )
    remaining_earning_years: float = Field(
        ...,
        ge=0.0,
        description="Years remaining until planned retirement (used for the HLV earning-capacity benchmark).",
        examples=[25.0],
    )
    outstanding_liabilities: float = Field(
        default=0.0,
        ge=0.0,
        description="Total outstanding debt balance (e.g., home loan, personal loans).",
        examples=[1500000.0],
    )
    future_financial_goals: float = Field(
        default=0.0,
        ge=0.0,
        description="Target savings for future milestones (children's higher education, marriage, spouse fund).",
        examples=[2000000.0],
    )
    available_assets: float = Field(
        default=0.0,
        ge=0.0,
        description="Available liquid or semi-liquid savings (savings accounts, mutual funds, fixed deposits).",
        examples=[500000.0],
    )
    existing_life_insurance: float = Field(
        default=0.0,
        ge=0.0,
        description="Current sum assured across all active life insurance policies already owned.",
        examples=[1000000.0],
    )
    discount_rate: Optional[float] = Field(
        default=0.05,
        ge=0.0,
        le=0.50,
        description="Annual real discount rate assumption for present value calculation (default: 0.05 or 5.0%).",
        examples=[0.05],
    )
    annual_premium_budget: Optional[float] = Field(
        default=50000.0,
        ge=0.0,
        description="Estimated annual premium budget the customer can comfortably allocate.",
        examples=[50000.0],
    )
    risk_preference: Optional[str] = Field(
        default="moderate",
        description="Risk preference: 'conservative', 'moderate', or 'aggressive'.",
        examples=["moderate"],
    )
    calculation_method: Optional[str] = Field(
        default="net_needs",
        description="Primary calculation method: 'net_needs' or 'hlv'.",
        examples=["net_needs"],
    )


class NetNeedsResult(BaseModel):
    outstanding_liabilities: float
    future_financial_goals: float
    annual_income_contribution: float
    monthly_household_expenses: Optional[float] = None
    dependents_count: int = 2
    replacement_years: float
    pv_income_replacement: float
    total_obligations: float
    available_assets: float
    existing_life_insurance: float
    total_resources: float
    raw_net_cover: float
    recommended_cover: float
    is_clamped_to_zero: bool
    calculation_method: str = "net_needs"


class HLVResult(BaseModel):
    hlv_estimate: float
    remaining_earning_years: float
    benchmark_description: str
    annual_income_used: float = 0.0
    discount_rate_used: float = 0.05
    net_gap_hlv: float = 0.0


class IllustrativePremiumEstimate(BaseModel):
    """
    Transparent illustrative premium estimates across 4 product categories.
    Explicitly tags all figures as benchmark estimates, never actual insurer quotations.
    """
    term_annual_premium: float
    whole_life_annual_premium: float
    endowment_annual_premium: float
    ulip_annual_premium: float
    annual_budget: float
    term_affordability_status: str
    disclaimer: str = (
        "Illustrative actuarial benchmark estimate only. Not an actual insurer quotation. "
        "Actual premiums require insurer underwriting, medical evaluation, and product approval."
    )


class CalculationResponse(BaseModel):
    """
    Standardized calculation response containing Net Needs, HLV benchmark, and assumptions.
    """
    net_needs: NetNeedsResult
    human_life_value: HLVResult
    selected_method: str = "net_needs"
    final_recommended_cover: float
    coverage_gap: float
    illustrative_premiums: Optional[IllustrativePremiumEstimate] = None
    assumptions: Dict[str, Any]


class AppointmentCreateRequest(BaseModel):
    """
    Inbound request payload to schedule an educational advisory consultation demo.
    All personal data validated with strict format checks.
    """
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Full legal or preferred name (2-100 characters).",
        examples=["Demo User"],
    )
    email: str = Field(
        ...,
        description="Valid email address for appointment confirmation.",
        examples=["demo.user@example.com"],
    )
    phone: str = Field(
        ...,
        description="Phone number with 10-15 digits.",
        examples=["9876543210"],
    )
    preferred_date: str = Field(
        ...,
        description="Preferred consultation date in YYYY-MM-DD format (must not be in the past).",
        examples=["2026-10-25"],
    )
    preferred_time_slot: str = Field(
        ...,
        description="Standard time window chosen from VALID_TIME_SLOTS.",
        examples=["10:00 AM - 11:00 AM"],
    )
    consultation_type: str = Field(
        default="General Advisory Consultation",
        max_length=100,
        description="Advisory topic or selected policy review category.",
        examples=["Term Life & Protection Gap Review"],
    )
    notes: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional questions or context for the consultation session.",
        examples=["Discussing mortgage protection and term options."],
    )
    recommended_cover: float = Field(
        default=0.0,
        ge=0.0,
        description="Snapshot of the calculated Net Needs cover at time of booking.",
        examples=[7500000.0],
    )

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters long.")
        if len(v) > 100:
            raise ValueError("Full name cannot exceed 100 characters.")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email address format.")
        return v.lower()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        digits = re.sub(r"\D", "", v)
        if not (10 <= len(digits) <= 15):
            raise ValueError("Phone number must contain between 10 and 15 digits.")
        return v

    @field_validator("preferred_date")
    @classmethod
    def validate_preferred_date(cls, v: str) -> str:
        v = v.strip()
        try:
            parsed = datetime.date.fromisoformat(v)
        except Exception:
            raise ValueError("Invalid date format. Expected YYYY-MM-DD.")
        today = datetime.date.today()
        if parsed < today:
            raise ValueError("Appointment date cannot be in the past.")
        return v

    @field_validator("preferred_time_slot")
    @classmethod
    def validate_time_slot(cls, v: str) -> str:
        v = v.strip()
        if v not in VALID_TIME_SLOTS:
            raise ValueError(
                f"Invalid time slot '{v}'. Must be one of: {', '.join(VALID_TIME_SLOTS)}"
            )
        return v


class AppointmentResponse(BaseModel):
    """
    Returned upon successful persistence of an appointment request.
    Status is strictly REQUESTED (never confirmed).
    """
    id: int
    reference_id: str = Field(
        description="Unique formatted booking reference ID (e.g. #CW-APPT-1001)."
    )
    full_name: str
    email: str
    phone: str
    preferred_date: str
    preferred_time_slot: str
    consultation_type: str
    notes: Optional[str] = None
    recommended_cover: float
    status: str = "REQUESTED"
    created_at: str
    disclaimer: str = (
        "Demo advisory consultation request. Status is REQUESTED. "
        "This prototype does not guarantee a real advisor appointment."
    )


class SafeAppointmentSummary(BaseModel):
    """
    Privacy-safe appointment model for development/demo verification.
    Masks personal names and email addresses; omits phone numbers and private notes.
    """
    id: int
    reference_id: str = Field(
        description="Unique formatted booking reference ID (e.g. #CW-APPT-1001)."
    )
    masked_name: str
    masked_email: str
    preferred_date: str
    preferred_time_slot: str
    consultation_type: str
    recommended_cover: float
    status: str
    created_at: str
