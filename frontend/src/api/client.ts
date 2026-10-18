/**
 * CoverWise API Client
 * Facilitates communication with the FastAPI backend
 */

import type {
  CalculationRequest,
  CalculationResponse,
  HealthResponse,
  AppointmentCreateRequest,
  AppointmentResponse,
  SafeAppointmentSummary,
} from "../types";

const API_BASE_URL = "http://127.0.0.1:8000";

/**
 * Fetch backend health status
 */
export async function checkBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  return response.json();
}

/**
 * Submit financial assessment data to the calculation engine
 */
export async function calculateNeeds(
  payload: CalculationRequest
): Promise<CalculationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/calculate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = "Failed to calculate life insurance needs.";
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        if (Array.isArray(errJson.detail)) {
          errorDetail = errJson.detail.map((d: { msg?: string; loc?: string[] }) => d.msg || "Invalid field").join(", ");
        } else if (typeof errJson.detail === "string") {
          errorDetail = errJson.detail;
        }
      }
    } catch {
      // Use fallback error message
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Request an educational advisory consultation appointment demo.
 * Persisted in FastAPI backend and SQLite.
 */
export async function createAppointment(
  payload: AppointmentCreateRequest
): Promise<AppointmentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = "Failed to submit appointment request.";
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        if (Array.isArray(errJson.detail)) {
          errorDetail = errJson.detail
            .map((d: { msg?: string; loc?: string[] }) => d.msg || "Invalid field")
            .join(", ");
        } else if (typeof errJson.detail === "string") {
          errorDetail = errJson.detail;
        }
      }
    } catch {
      // Use fallback error message
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Fetch masked appointment summaries (useful for dev / demo verification).
 * Personal details are masked by backend to protect privacy.
 */
export async function getAppointments(
  limit: number = 50
): Promise<SafeAppointmentSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/appointments?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch appointments with status: ${response.status}`);
  }
  return response.json();
}
