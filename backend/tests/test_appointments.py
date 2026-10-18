"""
Integration Tests for Appointment Booking API & SQLite Persistence
==================================================================
Tests input validation, safe data retrieval, and SQLite database isolation.
Uses dummy data only. All tests run against an isolated temporary SQLite database.
"""

import datetime
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db, get_appointment_by_id


_client = TestClient(app)


@pytest.fixture
def client():
    return _client


@pytest.fixture(autouse=True)
def setup_isolated_db(tmp_path, monkeypatch):
    """
    Ensure every test uses a dedicated, isolated temporary SQLite database.
    Prevents tests from modifying or relying on any developer demo database.
    """
    test_db_file = str(tmp_path / "test_coverwise.db")
    monkeypatch.setenv("COVERWISE_DB_PATH", test_db_file)
    init_db(test_db_file)
    return test_db_file


def test_book_appointment_success(client):
    """
    Test successful appointment booking with valid dummy data.
    Status must be REQUESTED (never CONFIRMED).
    """
    future_date = (datetime.date.today() + datetime.timedelta(days=7)).isoformat()
    payload = {
        "full_name": "Demo User",
        "email": "demo.user@example.com",
        "phone": "9876543210",
        "preferred_date": future_date,
        "preferred_time_slot": "10:00 AM - 11:00 AM",
        "consultation_type": "Term Life & Protection Gap Review",
        "notes": "Discussing income replacement plan.",
        "recommended_cover": 7500000.0,
    }

    response = client.post("/api/appointments", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["id"] > 0
    assert data["full_name"] == "Demo User"
    assert data["email"] == "demo.user@example.com"
    assert data["phone"] == "9876543210"
    assert data["preferred_date"] == future_date
    assert data["preferred_time_slot"] == "10:00 AM - 11:00 AM"
    assert data["status"] == "REQUESTED"
    assert "disclaimer" in data
    assert "REQUESTED" in data["disclaimer"]


def test_appointment_persists_in_sqlite(client, setup_isolated_db):
    """
    Verify that the created appointment is persisted in SQLite.
    """
    future_date = (datetime.date.today() + datetime.timedelta(days=10)).isoformat()
    payload = {
        "full_name": "Test Client",
        "email": "test.client@example.com",
        "phone": "+91 9123456789",
        "preferred_date": future_date,
        "preferred_time_slot": "02:00 PM - 03:00 PM",
        "consultation_type": "General Advisory Consultation",
        "recommended_cover": 5000000.0,
    }

    response = client.post("/api/appointments", json=payload)
    assert response.status_code == 201
    appt_id = response.json()["id"]

    # Directly inspect isolated SQLite database
    record = get_appointment_by_id(appt_id, db_path=setup_isolated_db)
    assert record is not None
    assert record["full_name"] == "Test Client"
    assert record["email"] == "test.client@example.com"
    assert record["status"] == "REQUESTED"
    assert record["recommended_cover"] == 5000000.0


def test_book_appointment_rejects_past_date(client):
    """Past dates must be rejected with 422 Unprocessable Entity."""
    past_date = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
    payload = {
        "full_name": "Demo User",
        "email": "demo.user@example.com",
        "phone": "9876543210",
        "preferred_date": past_date,
        "preferred_time_slot": "10:00 AM - 11:00 AM",
    }

    response = client.post("/api/appointments", json=payload)
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any("past" in str(err) for err in errors)


def test_book_appointment_rejects_malformed_date(client):
    """Malformed date strings must be rejected with 422."""
    payload = {
        "full_name": "Demo User",
        "email": "demo.user@example.com",
        "phone": "9876543210",
        "preferred_date": "not-a-date",
        "preferred_time_slot": "10:00 AM - 11:00 AM",
    }

    response = client.post("/api/appointments", json=payload)
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any("Invalid date format" in str(err) for err in errors)


def test_book_appointment_rejects_invalid_time_slot(client):
    """Arbitrary/invalid time slot must be rejected with 422."""
    future_date = (datetime.date.today() + datetime.timedelta(days=5)).isoformat()
    payload = {
        "full_name": "Demo User",
        "email": "demo.user@example.com",
        "phone": "9876543210",
        "preferred_date": future_date,
        "preferred_time_slot": "Midnight 12:00 AM",  # Invalid slot
    }

    response = client.post("/api/appointments", json=payload)
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any("Invalid time slot" in str(err) for err in errors)


def test_book_appointment_rejects_invalid_email(client):
    """Malformed email must be rejected with 422."""
    future_date = (datetime.date.today() + datetime.timedelta(days=5)).isoformat()
    payload = {
        "full_name": "Demo User",
        "email": "demo-not-an-email",
        "phone": "9876543210",
        "preferred_date": future_date,
        "preferred_time_slot": "10:00 AM - 11:00 AM",
    }

    response = client.post("/api/appointments", json=payload)
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any("email address format" in str(err) for err in errors)


def test_book_appointment_rejects_invalid_phone(client):
    """Phone number with fewer than 10 digits must be rejected with 422."""
    future_date = (datetime.date.today() + datetime.timedelta(days=5)).isoformat()
    payload = {
        "full_name": "Demo User",
        "email": "demo.user@example.com",
        "phone": "12345",  # Too short
        "preferred_date": future_date,
        "preferred_time_slot": "10:00 AM - 11:00 AM",
    }

    response = client.post("/api/appointments", json=payload)
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any("between 10 and 15 digits" in str(err) for err in errors)


def test_book_appointment_rejects_short_name(client):
    """Empty or 1-character name must be rejected with 422."""
    future_date = (datetime.date.today() + datetime.timedelta(days=5)).isoformat()
    payload = {
        "full_name": "A",
        "email": "demo.user@example.com",
        "phone": "9876543210",
        "preferred_date": future_date,
        "preferred_time_slot": "10:00 AM - 11:00 AM",
    }

    response = client.post("/api/appointments", json=payload)
    assert response.status_code == 422


def test_book_appointment_rejects_negative_cover(client):
    """Negative recommended cover must be rejected with 422."""
    future_date = (datetime.date.today() + datetime.timedelta(days=5)).isoformat()
    payload = {
        "full_name": "Demo User",
        "email": "demo.user@example.com",
        "phone": "9876543210",
        "preferred_date": future_date,
        "preferred_time_slot": "10:00 AM - 11:00 AM",
        "recommended_cover": -1000.0,
    }

    response = client.post("/api/appointments", json=payload)
    assert response.status_code == 422


def test_book_appointment_missing_required_fields(client):
    """Omitting required fields must return 422."""
    response = client.post("/api/appointments", json={})
    assert response.status_code == 422
    errors = response.json()["detail"]
    missing_fields = [err["loc"][-1] for err in errors if err.get("type") == "missing"]
    assert "full_name" in missing_fields
    assert "email" in missing_fields
    assert "phone" in missing_fields
    assert "preferred_date" in missing_fields
    assert "preferred_time_slot" in missing_fields


def test_get_appointments_masks_personal_data(client):
    """
    Verify GET /api/appointments returns masked summary data to protect privacy.
    Names and emails must be masked; phone numbers and notes must not be present.
    """
    future_date = (datetime.date.today() + datetime.timedelta(days=3)).isoformat()
    client.post(
        "/api/appointments",
        json={
            "full_name": "Private Customer",
            "email": "private.customer@domain.com",
            "phone": "9876543210",
            "preferred_date": future_date,
            "preferred_time_slot": "11:00 AM - 12:00 PM",
            "notes": "Highly sensitive private debt notes",
        },
    )

    response = client.get("/api/appointments")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 1

    summary = items[0]
    # Check that personal data is masked and omitted
    assert "Private Customer" not in summary["masked_name"]
    assert "P" in summary["masked_name"]
    assert "private.customer@domain.com" not in summary["masked_email"]
    assert "@" in summary["masked_email"]
    assert "phone" not in summary
    assert "notes" not in summary
    assert summary["status"] == "REQUESTED"


def test_get_appointment_detail_by_id_and_not_found(client):
    """Verify single appointment query by ID returns masked summary and 404 on missing."""
    future_date = (datetime.date.today() + datetime.timedelta(days=4)).isoformat()
    create_resp = client.post(
        "/api/appointments",
        json={
            "full_name": "Jane Doe",
            "email": "jane.doe@example.org",
            "phone": "9988776655",
            "preferred_date": future_date,
            "preferred_time_slot": "04:00 PM - 05:00 PM",
        },
    )
    appt_id = create_resp.json()["id"]

    # Successful retrieval of masked detail
    get_resp = client.get(f"/api/appointments/{appt_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["id"] == appt_id
    assert "masked_name" in data
    assert "Jane Doe" not in data["masked_name"]
    assert "phone" not in data

    # Non-existent ID returns 404
    not_found_resp = client.get("/api/appointments/999999")
    assert not_found_resp.status_code == 404


def test_book_appointment_rejects_duplicate_conflicting_slot(client):
    """
    Prevention of conflicting bookings:
    Attempting to book the same date and time slot must be rejected with 409 Conflict.
    """
    future_date = (datetime.date.today() + datetime.timedelta(days=12)).isoformat()
    slot = "11:00 AM - 12:00 PM"
    payload_1 = {
        "full_name": "First User",
        "email": "first.user@example.com",
        "phone": "9876543210",
        "preferred_date": future_date,
        "preferred_time_slot": slot,
        "consultation_type": "Term Life Review",
    }
    resp1 = client.post("/api/appointments", json=payload_1)
    assert resp1.status_code == 201

    payload_2 = {
        "full_name": "Second User",
        "email": "second.user@example.com",
        "phone": "9123456789",
        "preferred_date": future_date,
        "preferred_time_slot": slot,
        "consultation_type": "Endowment Review",
    }
    resp2 = client.post("/api/appointments", json=payload_2)
    assert resp2.status_code == 409
    assert "already booked" in resp2.json()["detail"]


def test_book_appointment_returns_formatted_reference_id(client):
    """Verify that booking returns unique formatted reference ID e.g. #CW-APPT-1001."""
    future_date = (datetime.date.today() + datetime.timedelta(days=14)).isoformat()
    payload = {
        "full_name": "Unique Ref User",
        "email": "ref.user@example.com",
        "phone": "9876543210",
        "preferred_date": future_date,
        "preferred_time_slot": "05:00 PM - 06:00 PM",
    }
    response = client.post("/api/appointments", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "reference_id" in data
    assert data["reference_id"].startswith("#CW-APPT-")


def test_sqlite_unique_constraint_atomic_collision_prevention(setup_isolated_db):
    """
    Verify that SQLite partial unique index uq_appointments_active_slot atomically
    prevents duplicate slot insertion even if application-level check_slot_available is bypassed.
    """
    import sqlite3
    from app.database import insert_appointment

    future_date = (datetime.date.today() + datetime.timedelta(days=21)).isoformat()
    record1 = {
        "full_name": "Concurrent User A",
        "email": "user.a@example.com",
        "phone": "9876543210",
        "preferred_date": future_date,
        "preferred_time_slot": "11:00 AM - 12:00 PM",
        "consultation_type": "Term Life Review",
        "recommended_cover": 5000000.0,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

    record2 = {
        "full_name": "Concurrent User B",
        "email": "user.b@example.com",
        "phone": "9123456789",
        "preferred_date": future_date,
        "preferred_time_slot": "11:00 AM - 12:00 PM",
        "consultation_type": "Term Life Review",
        "recommended_cover": 5000000.0,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

    # First insert succeeds
    id1 = insert_appointment(record1, db_path=setup_isolated_db)
    assert id1 > 0

    # Second direct insert on same date & slot must fail with sqlite3.IntegrityError
    with pytest.raises(sqlite3.IntegrityError):
        insert_appointment(record2, db_path=setup_isolated_db)
