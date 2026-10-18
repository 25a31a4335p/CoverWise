"""
CoverWise - SQLite Database Management
=======================================
Lightweight, thread-safe persistence for appointment requests using Python's built-in sqlite3.
Zero external ORM dependencies.
"""

import os
import sqlite3
from typing import List, Optional, Dict, Any
from contextlib import contextmanager

# Default database file path (stored in backend directory)
DEFAULT_DB_FILE = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "coverwise.db")
)


def get_db_path() -> str:
    """Retrieve the active database path (supports COVERWISE_DB_PATH override for isolated tests)."""
    return os.environ.get("COVERWISE_DB_PATH", DEFAULT_DB_FILE)


@contextmanager
def get_connection(db_path: Optional[str] = None):
    """
    Context manager providing a managed SQLite connection.
    Enforces WAL mode, foreign keys, row factories, and proper commit/rollback lifecycle.
    """
    path = db_path or get_db_path()
    dir_name = os.path.dirname(path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

    conn = sqlite3.connect(path, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db(db_path: Optional[str] = None) -> None:
    """
    Initialize SQLite schema for appointments table and supporting indexes.
    Safe to call multiple times (IF NOT EXISTS).
    """
    with get_connection(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                preferred_date TEXT NOT NULL,
                preferred_time_slot TEXT NOT NULL,
                consultation_type TEXT NOT NULL,
                notes TEXT,
                recommended_cover REAL NOT NULL DEFAULT 0.0,
                status TEXT NOT NULL DEFAULT 'REQUESTED',
                created_at TEXT NOT NULL
            );
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_appointments_created_at
            ON appointments(created_at);
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_appointments_slot
            ON appointments(preferred_date, preferred_time_slot);
        """)
        conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_active_slot
            ON appointments(preferred_date, preferred_time_slot)
            WHERE status != 'CANCELLED';
        """)


def format_reference_id(appointment_id: int) -> str:
    """Generate consistent, human-readable unique reference identifier."""
    return f"#CW-APPT-{1000 + appointment_id}"


def check_slot_available(
    preferred_date: str, preferred_time_slot: str, db_path: Optional[str] = None
) -> bool:
    """
    Verify if the requested appointment slot is free.
    Prevents conflicting bookings for the same date and time slot.
    """
    with get_connection(db_path) as conn:
        cursor = conn.execute(
            """
            SELECT COUNT(*) FROM appointments
            WHERE preferred_date = ? AND preferred_time_slot = ? AND status != 'CANCELLED'
            """,
            (preferred_date, preferred_time_slot),
        )
        count = cursor.fetchone()[0]
        return count == 0


def insert_appointment(data: Dict[str, Any], db_path: Optional[str] = None) -> int:
    """
    Insert a new appointment record and return the generated ID.
    Status is strictly enforced as REQUESTED.
    """
    with get_connection(db_path) as conn:
        cursor = conn.execute(
            """
            INSERT INTO appointments (
                full_name, email, phone, preferred_date,
                preferred_time_slot, consultation_type, notes,
                recommended_cover, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                data["full_name"],
                data["email"],
                data["phone"],
                data["preferred_date"],
                data["preferred_time_slot"],
                data["consultation_type"],
                data.get("notes"),
                data.get("recommended_cover", 0.0),
                "REQUESTED",
                data["created_at"],
            ),
        )
        return cursor.lastrowid  # type: ignore[return-value]


def get_appointment_by_id(
    appointment_id: int, db_path: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Retrieve a single appointment by ID."""
    with get_connection(db_path) as conn:
        cursor = conn.execute(
            "SELECT * FROM appointments WHERE id = ?",
            (appointment_id,),
        )
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None


def list_appointments(
    limit: int = 50, db_path: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Retrieve appointments in reverse chronological order up to limit."""
    with get_connection(db_path) as conn:
        cursor = conn.execute(
            "SELECT * FROM appointments ORDER BY id DESC LIMIT ?",
            (limit,),
        )
        return [dict(r) for r in cursor.fetchall()]
