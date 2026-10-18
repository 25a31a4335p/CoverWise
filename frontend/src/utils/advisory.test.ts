import { describe, it, expect, vi } from "vitest";
import { generateAdvisoryReport, validateAppointmentForm } from "./advisory";
import type { NetNeedsResult, HLVResult, AppointmentResponse } from "../types";

describe("Deterministic Educational Advisory Engine", () => {
  const basePositiveNetNeeds: NetNeedsResult = {
    outstanding_liabilities: 2000000,
    future_financial_goals: 3000000,
    annual_income_contribution: 600000,
    replacement_years: 15,
    pv_income_replacement: 6227794.82,
    total_obligations: 11227794.82,
    available_assets: 1000000,
    existing_life_insurance: 1500000,
    total_resources: 2500000,
    raw_net_cover: 8727794.82,
    recommended_cover: 8727794.82,
    is_clamped_to_zero: false,
  };

  const baseClampedNetNeeds: NetNeedsResult = {
    outstanding_liabilities: 100000,
    future_financial_goals: 200000,
    annual_income_contribution: 50000,
    replacement_years: 5,
    pv_income_replacement: 216473.83,
    total_obligations: 516473.83,
    available_assets: 1000000,
    existing_life_insurance: 500000,
    total_resources: 1500000,
    raw_net_cover: -983526.17,
    recommended_cover: 0,
    is_clamped_to_zero: true,
  };

  const baseHLV: HLVResult = {
    hlv_estimate: 10500000,
    remaining_earning_years: 25,
    benchmark_description: "Present economic earning capacity benchmark",
  };

  it("evaluates positive protection gap as critical or moderate urgency with action items", () => {
    const report = generateAdvisoryReport(basePositiveNetNeeds, baseHLV, "family_protection");

    expect(report.hasPositiveGap).toBe(true);
    expect(report.isClampedToZero).toBe(false);
    expect(report.gapAmount).toBe(8727794.82);
    expect(report.urgencyLevel).toBe("critical");
    expect(report.summaryHeadline).toContain("Action Required");

    // Must have gap risk flag
    const gapFlag = report.riskFlags.find((f) => f.id === "risk_protection_gap");
    expect(gapFlag).toBeDefined();
    expect(gapFlag?.severity).toBe("high");

    // Must have bridge gap checklist item
    const bridgeItem = report.actionChecklist.find((a) => a.id === "action_bridge_gap");
    expect(bridgeItem).toBeDefined();
    expect(bridgeItem?.priority).toBe("immediate");
    expect(bridgeItem?.description).toContain("pure term life");
  });

  it("evaluates zero gap / clamped resources as healthy baseline with review guidance", () => {
    const report = generateAdvisoryReport(baseClampedNetNeeds, baseHLV, "family_protection");

    expect(report.hasPositiveGap).toBe(false);
    expect(report.isClampedToZero).toBe(true);
    expect(report.gapAmount).toBe(0);
    expect(report.urgencyLevel).toBe("healthy");
    expect(report.summaryHeadline).toContain("Strong Baseline");

    // Should NOT have gap risk flag
    const gapFlag = report.riskFlags.find((f) => f.id === "risk_protection_gap");
    expect(gapFlag).toBeUndefined();

    // Should have inflation / review flag
    const inflationFlag = report.riskFlags.find((f) => f.id === "risk_inflation_erosion");
    expect(inflationFlag).toBeDefined();

    // Should have annual audit checklist item
    const auditItem = report.actionChecklist.find((a) => a.id === "action_annual_audit");
    expect(auditItem).toBeDefined();
    expect(auditItem?.priority).toBe("review");
  });

  it("generates debt-ring-fencing risk flag and checklist when liabilities > 0", () => {
    const report = generateAdvisoryReport(basePositiveNetNeeds, baseHLV, "family_protection");

    const debtFlag = report.riskFlags.find((f) => f.id === "risk_outstanding_debts");
    expect(debtFlag).toBeDefined();
    expect(debtFlag?.severity).toBe("high");
    expect(debtFlag?.title).toContain("2,000,000");

    const debtAction = report.actionChecklist.find((a) => a.id === "action_ring_fence_debts");
    expect(debtAction).toBeDefined();
    expect(debtAction?.priority).toBe("immediate");
  });

  it("omits debt risk flag when outstanding liabilities are zero", () => {
    const noDebtNeeds: NetNeedsResult = {
      ...basePositiveNetNeeds,
      outstanding_liabilities: 0,
    };
    const report = generateAdvisoryReport(noDebtNeeds, baseHLV, "family_protection");

    const debtFlag = report.riskFlags.find((f) => f.id === "risk_outstanding_debts");
    expect(debtFlag).toBeUndefined();

    const debtAction = report.actionChecklist.find((a) => a.id === "action_ring_fence_debts");
    expect(debtAction).toBeUndefined();
  });

  it("generates milestone protection items when future financial goals > 0", () => {
    const report = generateAdvisoryReport(basePositiveNetNeeds, baseHLV, "guaranteed_savings");

    const goalFlag = report.riskFlags.find((f) => f.id === "risk_unhedged_milestones");
    expect(goalFlag).toBeDefined();
    expect(goalFlag?.severity).toBe("moderate");

    const goalAction = report.actionChecklist.find((a) => a.id === "action_protect_milestones");
    expect(goalAction).toBeDefined();
    expect(goalAction?.priority).toBe("medium");
  });

  it("provides comprehensive document preparation guide", () => {
    const report = generateAdvisoryReport(basePositiveNetNeeds, baseHLV, "family_protection");

    expect(report.preparationDocuments.length).toBeGreaterThanOrEqual(4);
    const docNames = report.preparationDocuments.map((d) => d.documentName);
    expect(docNames.some((n) => n.includes("Income Proof"))).toBe(true);
    expect(docNames.some((n) => n.includes("Liability"))).toBe(true);
    expect(docNames.some((n) => n.includes("Existing Life Insurance"))).toBe(true);
  });

  it("provides critical questions for consulting a qualified financial advisor", () => {
    const report = generateAdvisoryReport(basePositiveNetNeeds, baseHLV, "family_protection");

    expect(report.questionsForAdvisor.length).toBeGreaterThanOrEqual(4);
    const questions = report.questionsForAdvisor.map((q) => q.question);
    expect(questions.some((q) => q.includes("pure term life"))).toBe(true);
    expect(questions.some((q) => q.includes("tenure"))).toBe(true);
    expect(questions.some((q) => q.includes("riders"))).toBe(true);
  });

  it("adapts checklist for legacy planning objective", () => {
    const report = generateAdvisoryReport(basePositiveNetNeeds, baseHLV, "legacy_planning");
    const legacyItem = report.actionChecklist.find((a) => a.id === "action_legacy_review");
    expect(legacyItem).toBeDefined();
    expect(legacyItem?.title).toContain("Estate Legacy");
  });

  it("adapts checklist for market wealth objective", () => {
    const report = generateAdvisoryReport(basePositiveNetNeeds, baseHLV, "market_wealth");
    const wealthItem = report.actionChecklist.find((a) => a.id === "action_wealth_diversification");
    expect(wealthItem).toBeDefined();
    expect(wealthItem?.title).toContain("Decouple");
  });

  it("includes clear educational non-advisory disclaimer with no claims of AI", () => {
    const report = generateAdvisoryReport(basePositiveNetNeeds, baseHLV, "family_protection");

    expect(report.educationalDisclaimer).toContain("Educational Guidance Notice");
    expect(report.educationalDisclaimer).toContain("does not constitute personalized professional financial");
    expect(report.educationalDisclaimer).toContain("does not use AI");
    expect(report.educationalDisclaimer).toContain("Consult a licensed, qualified financial advisor");
  });
});

describe("Appointment Booking Form Validation", () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  it("passes validation with valid dummy inputs", () => {
    const validValues = {
      full_name: "Demo User",
      email: "demo.user@example.com",
      phone: "9876543210",
      preferred_date: tomorrowStr,
      preferred_time_slot: "10:00 AM - 11:00 AM",
    };
    const errors = validateAppointmentForm(validValues);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("fails validation when all required fields are empty", () => {
    const emptyValues = {
      full_name: "",
      email: "",
      phone: "",
      preferred_date: "",
      preferred_time_slot: "",
    };
    const errors = validateAppointmentForm(emptyValues);
    expect(errors.full_name).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.phone).toBeDefined();
    expect(errors.preferred_date).toBeDefined();
    expect(errors.preferred_time_slot).toBeDefined();
  });

  it("rejects appointment dates in the past", () => {
    const pastValues = {
      full_name: "Demo User",
      email: "demo.user@example.com",
      phone: "9876543210",
      preferred_date: yesterdayStr,
      preferred_time_slot: "10:00 AM - 11:00 AM",
    };
    const errors = validateAppointmentForm(pastValues);
    expect(errors.preferred_date).toBe("Appointment date cannot be in the past.");
  });

  it("rejects invalid email formats", () => {
    const invalidEmailValues = {
      full_name: "Demo User",
      email: "not-an-email",
      phone: "9876543210",
      preferred_date: tomorrowStr,
      preferred_time_slot: "10:00 AM - 11:00 AM",
    };
    const errors = validateAppointmentForm(invalidEmailValues);
    expect(errors.email).toBe("Please enter a valid email address.");
  });

  it("rejects phone numbers with fewer than 10 digits", () => {
    const shortPhoneValues = {
      full_name: "Demo User",
      email: "demo.user@example.com",
      phone: "12345",
      preferred_date: tomorrowStr,
      preferred_time_slot: "10:00 AM - 11:00 AM",
    };
    const errors = validateAppointmentForm(shortPhoneValues);
    expect(errors.phone).toContain("between 10 and 15 digits");
  });

  it("rejects names shorter than 2 characters", () => {
    const shortNameValues = {
      full_name: "A",
      email: "demo.user@example.com",
      phone: "9876543210",
      preferred_date: tomorrowStr,
      preferred_time_slot: "10:00 AM - 11:00 AM",
    };
    const errors = validateAppointmentForm(shortNameValues);
    expect(errors.full_name).toContain("at least 2 characters");
  });
});

describe("AdvisoryConsultation Component Rendering & API Flow", () => {
  const mockNetNeeds: NetNeedsResult = {
    outstanding_liabilities: 1500000,
    future_financial_goals: 2000000,
    annual_income_contribution: 600000,
    replacement_years: 15,
    pv_income_replacement: 6227794.82,
    total_obligations: 9727794.82,
    available_assets: 500000,
    existing_life_insurance: 1000000,
    total_resources: 1500000,
    raw_net_cover: 8227794.82,
    recommended_cover: 8227794.82,
    is_clamped_to_zero: false,
  };

  const mockHLV: HLVResult = {
    hlv_estimate: 8456366.74,
    remaining_earning_years: 25,
    benchmark_description: "Present economic value of income contribution",
  };

  it("renders AdvisoryConsultation HTML tree with all advisory sections and form inputs", async () => {
    const { renderToString } = await import("react-dom/server");
    const { AdvisoryConsultation } = await import("../components/AdvisoryConsultation");

    const React = await import("react");
    const html = renderToString(
      React.createElement(AdvisoryConsultation, {
        netNeeds: mockNetNeeds,
        hlv: mockHLV,
        objective: "family_protection",
      })
    );

    // Advisory Header & Metrics
    expect(html).toContain("Advisory Consultation &amp; Action Plan");
    expect(html).toContain("Calculated Protection Gap:");
    expect(html).toContain("Human Life Value Benchmark:");

    // Diagnostic Card
    expect(html).toContain("Action Required");
    expect(html).toContain("High Protection Urgency");

    // Risk Flags
    expect(html).toContain("Identified Financial Risk Exposures");
    expect(html).toContain("Outstanding Liabilities Exposure");

    // Action Checklist
    expect(html).toContain("Recommended Action Checklist");
    expect(html).toContain("Bridge the 8,227,795 Protection Gap");

    // Document Guide & Questions
    expect(html).toContain("Documents to Assemble for Your Advisor");
    expect(html).toContain("Key Questions to Ask Your Advisor");

    // Educational Disclaimer
    expect(html).toContain("Educational Guidance &amp; Non-Advisory Notice");

    // Appointment Booking Form
    expect(html).toContain("Schedule a Digital Advisory Consultation");
    expect(html).toContain("Full Name");
    expect(html).toContain("Email Address");
    expect(html).toContain("Phone Number");
    expect(html).toContain("Preferred Date");
    expect(html).toContain("Approved Time Window");
    expect(html).toContain("Submit Demo Advisory Request");
  });

  it("handles successful API booking and verifies status is strictly REQUESTED", async () => {
    const { createAppointment } = await import("../api/client");

    const mockResponse: AppointmentResponse = {
      id: 42,
      full_name: "Demo User",
      email: "demo.user@example.com",
      phone: "9876543210",
      preferred_date: "2026-10-25",
      preferred_time_slot: "10:00 AM - 11:00 AM",
      consultation_type: "Term Life & Protection Gap Review",
      notes: "Testing appointment persistence",
      recommended_cover: 8227794.82,
      status: "REQUESTED",
      created_at: "2026-10-18T10:00:00Z",
      disclaimer: "Demo advisory consultation request. Status is REQUESTED. This prototype does not guarantee a real advisor appointment.",
    };

    // Mock global fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    try {
      const result = await createAppointment({
        full_name: "Demo User",
        email: "demo.user@example.com",
        phone: "9876543210",
        preferred_date: "2026-10-25",
        preferred_time_slot: "10:00 AM - 11:00 AM",
        consultation_type: "Term Life & Protection Gap Review",
        recommended_cover: 8227794.82,
      });

      expect(result.id).toBe(42);
      expect(result.status).toBe("REQUESTED");
      expect(result.status).not.toBe("CONFIRMED");
      expect(result.disclaimer).toContain("REQUESTED");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("handles appointment API errors safely without exposing personal data", async () => {
    const { createAppointment } = await import("../api/client");

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        detail: [
          { msg: "Appointment date cannot be in the past.", loc: ["body", "preferred_date"] },
        ],
      }),
    } as Response);

    try {
      await expect(
        createAppointment({
          full_name: "Demo User",
          email: "demo.user@example.com",
          phone: "9876543210",
          preferred_date: "2020-01-01",
          preferred_time_slot: "10:00 AM - 11:00 AM",
        })
      ).rejects.toThrow("Appointment date cannot be in the past.");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
