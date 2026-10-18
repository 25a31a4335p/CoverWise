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

/**
 * Resolves the backend API base URL dynamically:
 * - Checks for Vite environment variable VITE_API_BASE_URL (configured in Vercel or local .env)
 * - Trims whitespace and strips any trailing slash
 * - Falls back to local development server (http://127.0.0.1:8000)
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "http://127.0.0.1:8000";
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Fetch backend health status
 */
export async function checkBackendHealth(): Promise<HealthResponse> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/health`);
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
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/calculate`, {
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
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/appointments`, {
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
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/appointments?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch appointments with status: ${response.status}`);
  }
  return response.json();
}
