import React, { useState } from "react";
import type {
  NetNeedsResult,
  HLVResult,
  PrimaryObjective,
  AppointmentResponse,
} from "../types";
import { VALID_TIME_SLOTS } from "../types";
import { formatCurrency } from "../utils/validation";
import {
  generateAdvisoryReport,
  validateAppointmentForm,
  getTodayDateString,
  type AppointmentFormFields,
} from "../utils/advisory";
import { createAppointment } from "../api/client";

interface AdvisoryConsultationProps {
  netNeeds: NetNeedsResult;
  hlv: HLVResult;
  objective: PrimaryObjective;
}

const CONSULTATION_TYPES = [
  "General Advisory Consultation",
  "Term Life & Protection Gap Review",
  "Debt Coverage & Liabilities Audit",
  "Milestone Goals & Education Shield",
  "Estate Planning & Nomination Review",
];

export const AdvisoryConsultation: React.FC<AdvisoryConsultationProps> = ({
  netNeeds,
  hlv,
  objective,
}) => {
  const report = generateAdvisoryReport(netNeeds, hlv, objective);

  // Appointment Booking Form State
  const todayDate = getTodayDateString();
  const [formValues, setFormValues] = useState<AppointmentFormFields & { consultation_type: string; notes: string }>({
    full_name: "",
    email: "",
    phone: "",
    preferred_date: "",
    preferred_time_slot: VALID_TIME_SLOTS[0],
    consultation_type: CONSULTATION_TYPES[0],
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<AppointmentResponse | null>(null);

  const handleInputChange = (
    field: keyof typeof formValues,
    value: string
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error on user keystroke
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions

    // Client-side validation
    const validationErrors = validateAppointmentForm({
      full_name: formValues.full_name,
      email: formValues.email,
      phone: formValues.phone,
      preferred_date: formValues.preferred_date,
      preferred_time_slot: formValues.preferred_time_slot,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await createAppointment({
        full_name: formValues.full_name.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        preferred_date: formValues.preferred_date,
        preferred_time_slot: formValues.preferred_time_slot,
        consultation_type: formValues.consultation_type,
        notes: formValues.notes.trim() ? formValues.notes.trim() : undefined,
        recommended_cover: netNeeds.recommended_cover,
      });

      // Show success with strictly REQUESTED status
      setConfirmedBooking(response);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Failed to submit appointment request. Please check your network and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetBooking = () => {
    setConfirmedBooking(null);
    setSubmitError(null);
    setFormErrors({});
    setFormValues({
      full_name: "",
      email: "",
      phone: "",
      preferred_date: "",
      preferred_time_slot: VALID_TIME_SLOTS[0],
      consultation_type: CONSULTATION_TYPES[0],
      notes: "",
    });
  };

  return (
    <div className="advisory-consultation-section">
      {/* 1. Header Banner */}
      <div className="advisory-header-card">
        <div className="advisory-pill">Educational Digital Advisory</div>
        <h3 className="advisory-title">Advisory Consultation & Action Plan</h3>
        <p className="advisory-subtitle">
          Objective evaluation of your protection deficit, key risk exposures, and preparation
          guide before you consult with a certified insurance professional.
        </p>

        {/* Reusing existing Net Needs & HLV without recalculation */}
        <div className="advisory-metrics-strip">
          <div className="advisory-metric-chip">
            <span className="chip-label">Calculated Protection Gap:</span>
            <span className="chip-value">
              {netNeeds.is_clamped_to_zero
                ? "0 (Fully Covered)"
                : formatCurrency(netNeeds.recommended_cover)}
            </span>
          </div>
          <div className="advisory-metric-chip">
            <span className="chip-label">Human Life Value Benchmark:</span>
            <span className="chip-value">{formatCurrency(hlv.hlv_estimate)}</span>
          </div>
          <div className="advisory-metric-chip">
            <span className="chip-label">Selected Goal Focus:</span>
            <span className="chip-value chip-objective">{objective.replace("_", " ")}</span>
          </div>
        </div>
      </div>

      {/* 2. Overall Diagnosis Card */}
      <div className={`diagnosis-card urgency-${report.urgencyLevel}`}>
        <div className="diagnosis-badge-row">
          <span className={`urgency-badge ${report.urgencyLevel}`}>
            {report.urgencyLevel === "critical" && "⚠️ High Protection Urgency"}
            {report.urgencyLevel === "moderate" && "⚡ Moderate Advisory Focus"}
            {report.urgencyLevel === "healthy" && "🛡️ Fully Funded Baseline"}
          </span>
          <span className="diagnosis-method-tag">Rule-Based Diagnostic</span>
        </div>
        <h4 className="diagnosis-headline">{report.summaryHeadline}</h4>
        <p className="diagnosis-body">{report.overallDiagnosis}</p>
      </div>

      {/* 3. Risk Exposure Diagnostics */}
      <div className="advisory-card-block">
        <h4 className="block-title">
          <span>🚩</span> Identified Financial Risk Exposures
        </h4>
        <p className="block-subtitle">
          Specific financial vulnerabilities identified from your liabilities, goals, and dependency horizon.
        </p>

        <div className="risk-flags-grid">
          {report.riskFlags.map((risk) => (
            <div key={risk.id} className={`risk-flag-card severity-${risk.severity}`}>
              <div className="risk-card-top">
                <span className={`severity-tag ${risk.severity}`}>
                  {risk.severity.toUpperCase()}
                </span>
                <h5 className="risk-title">{risk.title}</h5>
              </div>
              <p className="risk-desc">{risk.description}</p>
              <div className="risk-impact-box">
                <span className="impact-label">Practical Impact:</span>
                <span className="impact-text">{risk.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Prioritized Action Checklist */}
      <div className="advisory-card-block">
        <h4 className="block-title">
          <span>📋</span> Recommended Action Checklist
        </h4>
        <p className="block-subtitle">
          Concrete, chronological steps to prioritize with your insurance advisor.
        </p>

        <div className="action-checklist-list">
          {report.actionChecklist.map((item, index) => (
            <div key={item.id} className={`checklist-item-card priority-${item.priority}`}>
              <div className="checklist-number">{index + 1}</div>
              <div className="checklist-content">
                <div className="checklist-header-row">
                  <h5 className="checklist-item-title">{item.title}</h5>
                  <span className={`priority-badge ${item.priority}`}>
                    {item.priority === "immediate" && "Priority 1 • Immediate"}
                    {item.priority === "medium" && "Priority 2 • Medium Term"}
                    {item.priority === "review" && "Priority 3 • Annual Review"}
                  </span>
                </div>
                <p className="checklist-item-desc">{item.description}</p>
                <div className="checklist-rationale">
                  <strong>Why it matters:</strong> {item.rationale}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Two-Column Advisor Preparation & Question Guide */}
      <div className="guide-columns-grid">
        {/* Left: Document Preparation Checklist */}
        <div className="guide-column-card">
          <h4 className="guide-column-title">
            <span>📑</span> Documents to Assemble for Your Advisor
          </h4>
          <p className="guide-column-subtitle">
            Gather these records beforehand to streamline medical and financial underwriting.
          </p>

          <ul className="doc-guide-list">
            {report.preparationDocuments.map((doc, idx) => (
              <li key={idx} className="doc-guide-item">
                <span className="doc-bullet">✓</span>
                <div>
                  <strong className="doc-name">{doc.documentName}</strong>
                  <p className="doc-purpose">{doc.purpose}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Key Questions to Ask Advisor */}
        <div className="guide-column-card">
          <h4 className="guide-column-title">
            <span>💡</span> Key Questions to Ask Your Advisor
          </h4>
          <p className="guide-column-subtitle">
            Essential topics to interrogate during your formal consultation.
          </p>

          <div className="questions-list">
            {report.questionsForAdvisor.map((q, idx) => (
              <div key={idx} className="question-card">
                <span className="question-category">{q.category}</span>
                <p className="question-text">&ldquo;{q.question}&rdquo;</p>
                <p className="question-rationale">
                  <strong>Advisor Insight:</strong> {q.whyItMatters}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Educational Non-Advisory Notice */}
      <div className="advisory-disclaimer-box">
        <span className="disclaimer-icon">⚖️</span>
        <div>
          <strong className="disclaimer-heading">Educational Guidance & Non-Advisory Notice</strong>
          <p className="disclaimer-body-text">{report.educationalDisclaimer}</p>
        </div>
      </div>

      {/* 7. Appointment Booking Section */}
      <div className="appointment-booking-card" id="appointment-booking">
        {!confirmedBooking ? (
          <>
            <div className="booking-card-header">
              <span className="booking-badge">Interactive Demo Booking</span>
              <h4 className="booking-card-title">Schedule a Digital Advisory Consultation</h4>
              <p className="booking-card-subtitle">
                Request a 1-on-1 consultation session with a qualified advisor. All appointment
                requests are validated and persisted securely in SQLite.
              </p>
              <div className="booking-cover-note">
                <span className="cover-note-icon">🛡️</span>
                <span>
                  Consultation snapshot coverage: <strong>{formatCurrency(netNeeds.recommended_cover)}</strong>
                  {netNeeds.is_clamped_to_zero && " (Family fully protected today)"}
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {submitError && (
              <div className="booking-error-banner" role="alert">
                <span className="error-icon">⚠️</span>
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="booking-form" noValidate>
              <div className="form-fields-grid">
                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="appt-full-name" className="form-label">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="appt-full-name"
                    type="text"
                    className={`form-input ${formErrors.full_name ? "input-error" : ""}`}
                    placeholder="e.g., Demo User"
                    value={formValues.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    aria-invalid={!!formErrors.full_name}
                    aria-describedby={formErrors.full_name ? "name-error" : undefined}
                    disabled={isSubmitting}
                    required
                  />
                  {formErrors.full_name && (
                    <span id="name-error" className="field-error-text" role="alert">
                      {formErrors.full_name}
                    </span>
                  )}
                </div>

                {/* Email Address */}
                <div className="form-group">
                  <label htmlFor="appt-email" className="form-label">
                    Email Address <span className="required-star">*</span>
                  </label>
                  <input
                    id="appt-email"
                    type="email"
                    className={`form-input ${formErrors.email ? "input-error" : ""}`}
                    placeholder="e.g., demo.user@example.com"
                    value={formValues.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    aria-invalid={!!formErrors.email}
                    aria-describedby={formErrors.email ? "email-error" : undefined}
                    disabled={isSubmitting}
                    required
                  />
                  {formErrors.email && (
                    <span id="email-error" className="field-error-text" role="alert">
                      {formErrors.email}
                    </span>
                  )}
                </div>

                {/* Phone Number */}
                <div className="form-group">
                  <label htmlFor="appt-phone" className="form-label">
                    Phone Number <span className="required-star">*</span>
                  </label>
                  <input
                    id="appt-phone"
                    type="tel"
                    className={`form-input ${formErrors.phone ? "input-error" : ""}`}
                    placeholder="e.g., 9876543210 (10-15 digits)"
                    value={formValues.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    aria-invalid={!!formErrors.phone}
                    aria-describedby={formErrors.phone ? "phone-error" : undefined}
                    disabled={isSubmitting}
                    required
                  />
                  {formErrors.phone && (
                    <span id="phone-error" className="field-error-text" role="alert">
                      {formErrors.phone}
                    </span>
                  )}
                </div>

                {/* Preferred Date */}
                <div className="form-group">
                  <label htmlFor="appt-date" className="form-label">
                    Preferred Date <span className="required-star">*</span>
                  </label>
                  <input
                    id="appt-date"
                    type="date"
                    min={todayDate}
                    className={`form-input ${formErrors.preferred_date ? "input-error" : ""}`}
                    value={formValues.preferred_date}
                    onChange={(e) => handleInputChange("preferred_date", e.target.value)}
                    aria-invalid={!!formErrors.preferred_date}
                    aria-describedby={formErrors.preferred_date ? "date-error" : undefined}
                    disabled={isSubmitting}
                    required
                  />
                  {formErrors.preferred_date && (
                    <span id="date-error" className="field-error-text" role="alert">
                      {formErrors.preferred_date}
                    </span>
                  )}
                </div>

                {/* Preferred Time Slot */}
                <div className="form-group">
                  <label htmlFor="appt-slot" className="form-label">
                    Approved Time Window <span className="required-star">*</span>
                  </label>
                  <select
                    id="appt-slot"
                    className={`form-select ${formErrors.preferred_time_slot ? "input-error" : ""}`}
                    value={formValues.preferred_time_slot}
                    onChange={(e) => handleInputChange("preferred_time_slot", e.target.value)}
                    aria-invalid={!!formErrors.preferred_time_slot}
                    aria-describedby={formErrors.preferred_time_slot ? "slot-error" : undefined}
                    disabled={isSubmitting}
                    required
                  >
                    {VALID_TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {formErrors.preferred_time_slot && (
                    <span id="slot-error" className="field-error-text" role="alert">
                      {formErrors.preferred_time_slot}
                    </span>
                  )}
                </div>

                {/* Consultation Focus Type */}
                <div className="form-group">
                  <label htmlFor="appt-type" className="form-label">
                    Consultation Focus Topic
                  </label>
                  <select
                    id="appt-type"
                    className="form-select"
                    value={formValues.consultation_type}
                    onChange={(e) => handleInputChange("consultation_type", e.target.value)}
                    disabled={isSubmitting}
                  >
                    {CONSULTATION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes / Special Instructions */}
              <div className="form-group full-width" style={{ marginTop: "1rem" }}>
                <label htmlFor="appt-notes" className="form-label">
                  Special Notes or Family Questions (Optional)
                </label>
                <textarea
                  id="appt-notes"
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g., Specific questions regarding home loan term coverage, critical illness riders, or retirement goals..."
                  maxLength={500}
                  value={formValues.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  disabled={isSubmitting}
                />
                <span className="char-count-text">
                  {formValues.notes.length}/500 characters
                </span>
              </div>

              {/* Submit Button */}
              <div className="booking-submit-row">
                <button
                  type="submit"
                  className="btn-primary booking-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="btn-loading-content">
                      <span className="btn-spinner"></span> Persisting Request...
                    </span>
                  ) : (
                    "Submit Demo Advisory Request"
                  )}
                </button>
                <span className="booking-privacy-hint">
                  🔒 Personal data is never logged and is masked in public API queries.
                </span>
              </div>
            </form>
          </>
        ) : (
          /* 8. Success State Card (Status strictly REQUESTED) */
          <div className="booking-success-card" role="region" aria-live="polite">
            <div className="success-icon-badge">✓</div>
            <div className="success-badge-row">
              <span className="status-pill-requested">STATUS: {confirmedBooking.status}</span>
              <span className="demo-tag">Prototype Demo Booking</span>
            </div>

            <h4 className="success-title">Consultation Demo Request Received!</h4>
            <p className="success-subtitle">
              Your appointment request has been successfully persisted in SQLite with reference ID{" "}
              <strong>{confirmedBooking.reference_id || `#CW-APPT-${confirmedBooking.id}`}</strong>.
            </p>

            <div className="demo-disclaimer-banner">
              <strong>⚠️ Demo Prototype Notice:</strong> {confirmedBooking.disclaimer}
            </div>

            <div className="success-summary-grid">
              <div className="summary-item">
                <span className="summary-label">Reference ID:</span>
                <span className="summary-value font-mono">
                  {confirmedBooking.reference_id || `#CW-APPT-${confirmedBooking.id}`}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Requested Date:</span>
                <span className="summary-value">{confirmedBooking.preferred_date}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Time Window:</span>
                <span className="summary-value">{confirmedBooking.preferred_time_slot}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Consultation Focus:</span>
                <span className="summary-value">{confirmedBooking.consultation_type}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Snapshot Net Need:</span>
                <span className="summary-value font-mono">
                  {formatCurrency(confirmedBooking.recommended_cover)}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Status:</span>
                <span className="summary-value requested-text">
                  {confirmedBooking.status} (Pending real advisor outreach)
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-outline reset-booking-btn"
              onClick={handleResetBooking}
            >
              &larr; Submit Another Advisory Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
