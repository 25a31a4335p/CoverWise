# CoverWise

> **Tagline:** *Know Your Cover. Protect Your Future.*<br>
> **Project:** Intelligent Life Insurance Needs Finder & Digital Advisory Platform

CoverWise is a hackathon MVP designed to simplify life insurance calculation, policy category comparison, and educational digital advisory. It implements the **Net Needs Approach** and **Human Life Value (HLV)** framework, helping everyday users discover their true financial protection gap through an intuitive, transparent interface, and request an educational consultation session persisted in SQLite.

---

## Architecture Overview

```
CoverWise/
├── backend/               # Python + FastAPI calculation, advisory & API service
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py        # FastAPI app, CORS, /health, POST /api/calculate, /api/appointments
│   │   ├── calculators.py # Pure Python calculation engine (Net Needs & HLV)
│   │   ├── database.py    # Lightweight thread-safe SQLite persistence (sqlite3)
│   │   └── schemas.py     # Pydantic input/output validation models & PII masking
│   ├── tests/             # Backend test suite (42 tests)
│   │   ├── __init__.py
│   │   ├── test_calculators.py   # Unit tests for pure calculation math & HLV reconciliation (14 tests)
│   │   ├── test_api.py           # Integration tests for calculation endpoints (7 tests)
│   │   └── test_appointments.py  # SQLite persistence, booking validation & concurrency tests (21 tests)
│   ├── coverwise.db       # Local SQLite database (auto-initialized on startup)
│   ├── requirements.txt   # Backend dependencies (fastapi, uvicorn, pydantic, pytest, httpx)
│   └── venv/              # Python virtual environment (local to machine)
│
├── frontend/              # React 19 + TypeScript + Vite user interface
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts  # Typed API client calling FastAPI endpoints
│   │   ├── components/
│   │   │   ├── AssessmentForm.tsx          # 5 scenario presets & financial intake form
│   │   │   ├── ResultsView.tsx             # Dashboard orchestrating metrics, charts & sliders
│   │   │   ├── FinancialBreakdownChart.tsx # Recharts macro balance & granular component breakdown
│   │   │   ├── InteractiveSliders.tsx      # Scenario modeling sliders calling FastAPI
│   │   │   ├── CoverageTenureControls.tsx  # Scenario comparison against calculated gap
│   │   │   ├── PolicyRecommendations.tsx   # Rule-based policy product category matching
│   │   │   └── AdvisoryConsultation.tsx    # Educational advisory report & appointment booking
│   │   ├── types/
│   │   │   └── index.ts   # TypeScript interfaces matching backend models & appointments
│   │   ├── utils/
│   │   │   ├── validation.ts          # Input validation & currency formatters
│   │   │   ├── validation.test.ts     # Frontend unit tests for form validation (18 tests)
│   │   │   ├── recommendations.ts     # Deterministic policy recommendation rules
│   │   │   ├── recommendations.test.ts# Policy recommendations test suite (11 tests)
│   │   │   ├── advisory.ts            # Rule-based advisory diagnostic & booking validator
│   │   │   └── advisory.test.ts       # Advisory & booking test suite (19 tests)
│   │   ├── App.tsx        # App root orchestrating intake and dashboard
│   │   ├── index.css      # Editorial Fintech design system (Deep Plum, Warm Champagne, Dusty Rose)
│   │   └── main.tsx       # React root mount
│   ├── package.json
│   └── vite.config.ts
│
└── README.md              # Project documentation and beginner run guide
```

---

## Phase 5: Educational Advisory Consultation & Appointment Booking

Phase 5 extends the platform with an educational digital consultation and appointment booking module:

### 1. Deterministic Rule-Based Advisory Consultation
Synthesizes existing calculation results without duplicating financial math:
* **Diagnosis & Urgency Indicator:** Categorizes financial protection status into *Critical* (uncovered debts/income gap), *Moderate*, or *Healthy* (obligations fully covered by assets).
* **Identified Risk Flags:** Plain-language alerts on unhedged debt obligations, milestone vulnerabilities, and inflation erosion risks.
* **Prioritized Action Checklist:** Chronological guidance prioritizing pure term life for positive gaps, liability ring-fencing, milestone shielding, and periodic annual audits.
* **Two-Column Advisor Preparation & Question Guide:**
  * **Document Checklist:** Salary slips/tax returns, debt amortization schedules, existing policy bonds, liquid asset statements, and medical history.
  * **Key Questions for Advisors:** Specific questions covering term vs. bundled products, tenure alignment, riders (Critical Illness / Disability), inflation options, and Married Women's Property Act (MWPA) nomination.
* **Educational Disclaimer:** Explicitly notes that findings are deterministic educational guidance, not AI-driven or personalized professional advice.

### 2. Appointment Booking Persisted in SQLite
* **Backend Database:** Powered by Python's built-in `sqlite3` in `backend/coverwise.db` with WAL mode and foreign keys enabled.
* **Input Validation:** Strict validation rejecting past dates (`< today`), invalid emails, non-standard time windows, phones with fewer than 10 digits, and negative cover amounts.
* **Status Enforcement:** Status is strictly enforced as **`REQUESTED`** (never `CONFIRMED`), reflecting that this prototype cannot guarantee a real advisor session.
* **Cover Snapshot:** Automatically snapshots the calculated Net Needs cover (`recommended_cover`) at time of booking.
* **Client-Side UX:** Real-time accessible error validation, duplicate submission prevention (`isSubmitting`), and instant confirmation card with reference ID (`#CW-APPT-{id}`).

### 3. Personal Data Protection & Privacy
* **Zero Logging:** Backend never logs names, email addresses, phone numbers, or private notes.
* **Safe Masked Queries:** The dev/demo verification endpoint (`GET /api/appointments`) returns masked names (`D*** U***`), masked emails (`d***@e***.com`), and strictly omits phone numbers and notes.
* **Test Isolation:** Automated backend tests use an autouse fixture setting `COVERWISE_DB_PATH` to an isolated temporary file, preventing test runs from modifying or relying on local demo data.

---

## API Contracts

### 1. `POST /api/calculate`
Calculates required life cover using the Net Needs Method and Human Life Value (HLV) benchmark.

**Request:**
```json
{
  "annual_income_contribution": 600000.0,
  "replacement_years": 15.0,
  "remaining_earning_years": 25.0,
  "outstanding_liabilities": 1500000.0,
  "future_financial_goals": 2000000.0,
  "available_assets": 500000.0,
  "existing_life_insurance": 1000000.0,
  "discount_rate": 0.05
}
```

### 2. `POST /api/appointments`
Persists a new educational advisory consultation request into SQLite with status `REQUESTED`.

**Request:**
```json
{
  "full_name": "Demo User",
  "email": "demo.user@example.com",
  "phone": "9876543210",
  "preferred_date": "2026-12-01",
  "preferred_time_slot": "09:00 AM - 10:00 AM",
  "consultation_type": "Term Life & Protection Gap Review",
  "notes": "Discussing debt coverage for mortgage.",
  "recommended_cover": 8227794.82
}
```

**Response (HTTP 201 Created):**
```json
{
  "id": 1,
  "full_name": "Demo User",
  "email": "demo.user@example.com",
  "phone": "9876543210",
  "preferred_date": "2026-12-01",
  "preferred_time_slot": "09:00 AM - 10:00 AM",
  "consultation_type": "Term Life & Protection Gap Review",
  "notes": "Discussing debt coverage for mortgage.",
  "recommended_cover": 8227794.82,
  "status": "REQUESTED",
  "created_at": "2026-10-18T05:03:31.352686+00:00",
  "disclaimer": "Demo advisory consultation request. Status is REQUESTED. This prototype does not guarantee a real advisor appointment."
}
```

### 3. `GET /api/appointments`
Returns privacy-safe masked records for development and demo verification:
```json
[
  {
    "id": 1,
    "masked_name": "D*** U***",
    "masked_email": "d***@e***.com",
    "preferred_date": "2026-12-01",
    "preferred_time_slot": "09:00 AM - 10:00 AM",
    "consultation_type": "Term Life & Protection Gap Review",
    "recommended_cover": 8227794.82,
    "status": "REQUESTED",
    "created_at": "2026-10-18T05:03:31.352686+00:00"
  }
]
```

---

## Running Automated Tests

CoverWise has a comprehensive automated test suite across backend and frontend (74 tests total).

### Backend Tests (31 tests)
```powershell
cd backend
.\venv\Scripts\pytest -v
```
* `test_calculators.py`: 12 pure mathematical tests.
* `test_api.py`: 7 integration tests for Net Needs & HLV endpoints.
* `test_appointments.py`: 12 tests for appointment persistence, validation (past dates, invalid email, invalid phone, negative cover, missing fields), and masked PII verification.

### Frontend Tests (43 tests)
```powershell
cd frontend
npm.cmd run test
```
* `validation.test.ts`: 15 unit tests for financial intake form validation and currency formatting.
* `recommendations.test.ts`: 9 unit tests for deterministic policy category ranking (Term, Whole Life, Endowment, ULIP).
* `advisory.test.ts`: 19 unit tests for educational advisory logic, appointment form validation, component rendering, and API response handling.

### Frontend Production Build & Lint
```powershell
cd frontend
npm.cmd run build
npm.cmd run lint
```

---

## Quick Start on Windows

Run the project using **two separate terminal windows**:

### Terminal 1: Backend (FastAPI)
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
* **Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
* **Interactive API Docs (Swagger):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Database File:** Created automatically at `backend/coverwise.db` on first run.

### Terminal 2: Frontend (React + TypeScript)
```powershell
cd frontend
npm.cmd run dev
```
* **Web App:** [http://localhost:5173](http://localhost:5173)

---

## Reproducible Manual Browser Verification Steps

If testing manually in a browser:
1. Open [http://localhost:5173](http://localhost:5173). Verify header displays "CoverWise" and backend status badge indicates "Online".
2. Fill the intake assessment form with sample numbers:
   - Annual Income: `600000`
   - Replacement Years: `15`
   - Remaining Earning Years: `25`
   - Outstanding Liabilities: `1500000`
   - Future Goals: `2000000`
   - Liquid Assets: `500000`
   - Existing Insurance: `1000000`
   - Primary Objective: `Family protection and debt coverage`
3. Click **Calculate Life Cover Needs**.
4. Review the Results Dashboard:
   - Net Needs Recommended Cover: `8,227,795`
   - Human Life Value (HLV): `8,456,367`
   - Explore Recharts breakdown bar chart, what-if sliders, and policy recommendation categories.
5. Scroll down to **Advisory Consultation & Action Plan**:
   - Verify overall diagnosis card, risk flags, action checklist, document preparation guide, and advisor questions.
6. Test appointment booking validation:
   - Click **Submit Demo Advisory Request** without filling in fields &mdash; verify field error messages appear.
   - Enter an invalid email or a past date &mdash; verify appropriate validation block.
7. Enter valid dummy details:
   - Name: `Demo User`
   - Email: `demo.user@example.com`
   - Phone: `9876543210`
   - Date: Select any future date
   - Time window: Select an approved time slot
8. Click **Submit Demo Advisory Request**:
   - Verify success confirmation displays with reference ID `#CW-APPT-{id}`, snapshot cover, and status **`REQUESTED`** (never `CONFIRMED`).
