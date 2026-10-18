import React, { useEffect, useRef } from "react";
import type { HealthResponse } from "../types";
import { getApiBaseUrl } from "../api/client";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: HealthResponse | null;
  healthStatus: "checking" | "connected" | "error";
  onResetSession: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  health,
  healthStatus,
  onResetSession,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="settings-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="settings-modal-panel" ref={modalRef}>
        {/* Header */}
        <div className="settings-modal-header">
          <div className="settings-title-group">
            <span className="settings-kicker">Configuration &amp; Architecture</span>
            <h2 id="settings-modal-title" className="settings-heading">
              CoverWise Settings &amp; Engine Info
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="settings-close-btn"
            onClick={onClose}
            aria-label="Close settings modal"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="settings-modal-body">
          {/* Section 1: Engine Status */}
          <div className="settings-section">
            <h3 className="settings-section-title">
              <span className="settings-section-icon" aria-hidden="true">⚡</span>
              Backend Calculation Engine
            </h3>
            <div className="settings-info-card">
              <div className="info-row">
                <span className="info-label">Status:</span>
                <span className="info-value">
                  {healthStatus === "connected" ? (
                    <span className="status-pill status-online">
                      <span className="status-dot"></span> Online &bull; v{health?.version || "0.1.0"}
                    </span>
                  ) : healthStatus === "checking" ? (
                    <span className="status-pill status-checking">Checking...</span>
                  ) : (
                    <span className="status-pill status-offline">Offline</span>
                  )}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Active API Endpoint:</span>
                <span className="info-value"><code>{getApiBaseUrl()}</code></span>
              </div>
              <div className="info-row">
                <span className="info-label">API Framework:</span>
                <span className="info-value">Python FastAPI REST (Asynchronous)</span>
              </div>
              <div className="info-row">
                <span className="info-label">Database Persistence:</span>
                <span className="info-value">Local SQLite (<code>coverwise.db</code>)</span>
              </div>
              <div className="info-row">
                <span className="info-label">Appointment Status Rule:</span>
                <span className="info-value">Strictly <code>REQUESTED</code> with slot conflict prevention</span>
              </div>
            </div>
          </div>

          {/* Section 2: Actuarial Model Parameters */}
          <div className="settings-section">
            <h3 className="settings-section-title">
              <span className="settings-section-icon" aria-hidden="true">📐</span>
              Actuarial Modeling Assumptions
            </h3>
            <div className="settings-info-card">
              <div className="info-row">
                <span className="info-label">Real Discount Rate:</span>
                <span className="info-value">7.0% per annum (default real investment yield)</span>
              </div>
              <div className="info-row">
                <span className="info-label">Baseline Inflation:</span>
                <span className="info-value">6.0% per annum (for lifestyle living replacement)</span>
              </div>
              <div className="info-row">
                <span className="info-label">Retirement Horizon:</span>
                <span className="info-value">Age 60 benchmark earning horizon</span>
              </div>
              <div className="info-row">
                <span className="info-label">Pricing Benchmark:</span>
                <span className="info-value">Standard actuarial age-mortality model (zero fabricated quotes)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Privacy & Security */}
          <div className="settings-section">
            <h3 className="settings-section-title">
              <span className="settings-section-icon" aria-hidden="true">🛡️</span>
              Privacy &amp; Data Security
            </h3>
            <div className="settings-info-card">
              <div className="info-row">
                <span className="info-label">Third-Party Tracking:</span>
                <span className="info-value">Zero (No Google Analytics, Meta Pixel, or trackers)</span>
              </div>
              <div className="info-row">
                <span className="info-label">PII Masking:</span>
                <span className="info-value">Customer email and names masked on retrieval</span>
              </div>
              <div className="info-row">
                <span className="info-label">Session Storage:</span>
                <span className="info-value">In-memory local client session only</span>
              </div>
            </div>
          </div>

          {/* Section 4: Session Reset */}
          <div className="settings-section">
            <h3 className="settings-section-title">
              <span className="settings-section-icon" aria-hidden="true">🔄</span>
              Session State Controls
            </h3>
            <div className="settings-info-card reset-card">
              <p className="reset-desc">
                Clear all active calculation results, scenario slider adjustments, and assessment data to start with a fresh evaluation.
              </p>
              <button
                type="button"
                className="btn-settings-reset"
                onClick={() => {
                  onResetSession();
                  onClose();
                }}
              >
                Reset Session &amp; Clear Results
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="settings-modal-footer">
          <span className="settings-footer-note">
            CoverWise &bull; Intelligent Financial Protection Prototype
          </span>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
