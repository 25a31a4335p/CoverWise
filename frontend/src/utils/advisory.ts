/**
 * CoverWise Deterministic Educational Advisory Consultation Engine
 * =================================================================
 * Synthesizes existing Net Needs and Human Life Value (HLV) calculation results
 * into structured educational guidance, risk diagnostics, document preparation guides,
 * and key questions for licensed financial advisors.
 *
 * All logic is purely rule-based and deterministic.
 * Does NOT claim to use AI or provide personalized professional financial advice.
 */

import type {
  NetNeedsResult,
  HLVResult,
  PrimaryObjective,
  AdvisoryReport,
  AdvisoryRiskFlag,
  AdvisoryChecklistItem,
  AdvisoryDocumentGuide,
  AdvisorQuestion,
} from "../types";
import { formatCurrency } from "./validation";

/**
 * Generate a comprehensive educational advisory report from existing calculation results.
 */
export function generateAdvisoryReport(
  netNeeds: NetNeedsResult,
  hlv: HLVResult,
  objective: PrimaryObjective
): AdvisoryReport {
  const gap = netNeeds.recommended_cover;
  const isClamped = netNeeds.is_clamped_to_zero;
  const liabilities = netNeeds.outstanding_liabilities;
  const goals = netNeeds.future_financial_goals;
  const replacementYears = Math.round(netNeeds.replacement_years);
  const earningYears = Math.round(hlv.remaining_earning_years);

  // 1. Determine Overall Urgency & Diagnosis
  let urgencyLevel: "critical" | "moderate" | "healthy" = "healthy";
  let summaryHeadline = "";
  let overallDiagnosis = "";

  if (gap > 0) {
    if (liabilities > 0 || gap >= 5000000) {
      urgencyLevel = "critical";
      summaryHeadline = `Action Required: Uncovered Family Protection Deficit of ${formatCurrency(gap)}`;
      overallDiagnosis = `Your calculated family financial obligations exceed your combined liquid assets and existing life insurance by ${formatCurrency(gap)}. In the event of an untimely death, dependents would face an immediate capital shortage to clear outstanding liabilities and replace ongoing household income over the next ${replacementYears} years.`;
    } else {
      urgencyLevel = "moderate";
      summaryHeadline = `Moderate Protection Gap Identified: ${formatCurrency(gap)}`;
      overallDiagnosis = `A net coverage gap of ${formatCurrency(gap)} was calculated under the Net Needs Approach. While your existing assets partially fund your family's future, additional coverage is advisable to fully guarantee income continuity.`;
    }
  } else {
    urgencyLevel = "healthy";
    summaryHeadline = "Strong Baseline: Existing Resources Cover Calculated Obligations";
    overallDiagnosis = `Your total available liquid assets and existing life insurance (${formatCurrency(netNeeds.total_resources)}) fully satisfy your family's calculated obligations (${formatCurrency(netNeeds.total_obligations)}). Your recommended additional cover is clamped to zero. The primary advisory focus is regular policy maintenance and inflation protection.`;
  }

  // 2. Risk Flags Evaluation
  const riskFlags: AdvisoryRiskFlag[] = [];

  // Gap Risk Flag
  if (gap > 0) {
    riskFlags.push({
      id: "risk_protection_gap",
      title: "Uninsured Income & Dependency Deficit",
      severity: urgencyLevel === "critical" ? "high" : "moderate",
      description: `Your family relies on your income contribution to sustain household expenses for ${replacementYears} years. Currently, ${formatCurrency(gap)} of obligations are unhedged.`,
      impact: "Dependents may be forced to liquidate long-term assets or compromise standard of living upon premature loss of the breadwinner.",
    });
  } else {
    riskFlags.push({
      id: "risk_inflation_erosion",
      title: "Inflation & Asset Illiquidity Reassessment",
      severity: "info",
      description: `Current resources exceed obligations by ${formatCurrency(Math.abs(netNeeds.raw_net_cover))}. However, lifestyle inflation, market fluctuations, or illiquid assets can alter this balance over time.`,
      impact: "Coverage sufficiency should be reassessed every 2–3 years or whenever new family dependents or liabilities are added.",
    });
  }

  // Liabilities Risk Flag
  if (liabilities > 0) {
    riskFlags.push({
      id: "risk_outstanding_debts",
      title: `Outstanding Liabilities Exposure (${formatCurrency(liabilities)})`,
      severity: "high",
      description: `You have ${formatCurrency(liabilities)} in outstanding liabilities. Lenders have primary claims on estate assets unless dedicated life insurance protection is ring-fenced to liquidate the debt.`,
      impact: "Family home or core estate assets could be subject to lender claims or repossession if debt servicing is disrupted.",
    });
  }

  // Milestone Goals Risk Flag
  if (goals > 0) {
    riskFlags.push({
      id: "risk_unhedged_milestones",
      title: `Unhedged Milestone Goals (${formatCurrency(goals)})`,
      severity: "moderate",
      description: `Your financial plan includes ${formatCurrency(goals)} in future milestone goals (e.g., higher education or marriage funds) that require sustained capital accumulation.`,
      impact: "Without the earner's future cash flow, milestones may need to be postponed or funded through high-interest student/personal loans.",
    });
  }

  // HLV Perspective Flag
  if (hlv.hlv_estimate > gap && gap > 0) {
    riskFlags.push({
      id: "risk_hlv_earning_potential",
      title: "Human Life Value Economic Capacity",
      severity: "info",
      description: `Your lifetime economic earning capacity benchmark is ${formatCurrency(hlv.hlv_estimate)} over ${earningYears} remaining working years. Your Net Needs gap (${formatCurrency(gap)}) covers baseline obligations today.`,
      impact: "As your household income and lifestyle ambitions expand, consider scaling coverage closer to your lifetime economic potential.",
    });
  }

  // 3. Action Checklist Items
  const actionChecklist: AdvisoryChecklistItem[] = [];

  if (gap > 0) {
    actionChecklist.push({
      id: "action_bridge_gap",
      priority: "immediate",
      title: `Bridge the ${formatCurrency(gap)} Protection Gap`,
      description: `Evaluate pure term life insurance with a sum assured of at least ${formatCurrency(gap)} and a policy duration of ${Math.max(10, replacementYears)} years.`,
      rationale: "Pure term life delivers the highest death benefit per dollar/rupee spent without investment drag, directly neutralizing your family's deficit.",
    });
  } else {
    actionChecklist.push({
      id: "action_annual_audit",
      priority: "review",
      title: "Schedule Periodic Coverage & Asset Audits",
      description: "Set an annual calendar reminder to review net worth, active policy renewals, and dependent milestone changes.",
      rationale: "Ensures your surplus coverage cushion keeps pace with inflation and life events.",
    });
  }

  if (liabilities > 0) {
    actionChecklist.push({
      id: "action_ring_fence_debts",
      priority: "immediate",
      title: `Ring-Fence ${formatCurrency(liabilities)} for Debt Payoff`,
      description: "Ensure loan liabilities are matched with term insurance coverage to ensure immediate debt settlement upon claim.",
      rationale: "Shields family residence and liquid investments from lender claims.",
    });
  }

  if (goals > 0) {
    actionChecklist.push({
      id: "action_protect_milestones",
      priority: "medium",
      title: `Protect ${formatCurrency(goals)} Future Milestone Targets`,
      description: "Ensure milestone funds are separated from daily living expenses through earmarked savings or insurance riders.",
      rationale: "Guarantees children's education and critical family milestones remain funded under all circumstances.",
    });
  }

  // Objective-specific action item
  if (objective === "legacy_planning") {
    actionChecklist.push({
      id: "action_legacy_review",
      priority: "medium",
      title: "Review Estate Legacy & Beneficiary Nominations",
      description: "Check that all existing and future policy contracts specify clear primary and contingent beneficiaries.",
      rationale: "Eliminates probate delays and legal disputes during estate transfer to the next generation.",
    });
  } else if (objective === "market_wealth") {
    actionChecklist.push({
      id: "action_wealth_diversification",
      priority: "medium",
      title: "Decouple Risk Protection from Market Investments",
      description: "Secure pure term life cover first before taking significant equity market risk in wealth-building vehicles.",
      rationale: "Prevents market downturns from leaving family protection underfunded.",
    });
  }

  // 4. Preparation Documents Guide
  const preparationDocuments: AdvisoryDocumentGuide[] = [
    {
      documentName: "Recent Income Proof (Salary Slips / Form 16 / ITR)",
      purpose: "Demonstrates verifiable earning capacity and establishes formal insurable interest for underwriting.",
      category: "income",
    },
    {
      documentName: "Liability & Loan Amortisation Statements",
      purpose: "Confirms outstanding principal balances, interest rates, and loan tenures for debt-clearing riders.",
      category: "liabilities",
    },
    {
      documentName: "Existing Life Insurance Policy Bonds",
      purpose: "Verifies active sum assured, policy exclusions, paid-up statuses, and nominee details.",
      category: "existing_coverage",
    },
    {
      documentName: "Liquid Asset & Investment Account Statements",
      purpose: "Validates liquid emergency funds and unencumbered savings available to the household.",
      category: "income",
    },
    {
      documentName: "Medical History & Lifestyle Records",
      purpose: "Required for insurer medical underwriting, declarations of pre-existing conditions, and nicotine status.",
      category: "identity",
    },
  ];

  // 5. Questions Users Can Ask a Qualified Financial Advisor
  const questionsForAdvisor: AdvisorQuestion[] = [
    {
      category: "Product & Cost Efficiency",
      question: "Why is pure term life recommended for my debt and income gap over bundled investment-insurance plans?",
      whyItMatters: "Helps you avoid high fee structures and low death benefit covers typical of traditional endowment products.",
    },
    {
      category: "Tenure & Duration Alignment",
      question: `Does a ${replacementYears}-year policy tenure sufficiently cover my youngest dependent until financial independence?`,
      whyItMatters: "Prevents policies from expiring too early while children still depend on household income.",
    },
    {
      category: "Riders & Underwriting",
      question: "Which riders (Critical Illness, Accidental Total Disability, Waiver of Premium) are essential for my occupational profile?",
      whyItMatters: "Protects against living death scenarios where illness prevents working but does not trigger life death benefit.",
    },
    {
      category: "Inflation & Stepped Coverage",
      question: "Should I choose an increasing sum assured or level term cover to manage lifestyle inflation over the next decade?",
      whyItMatters: "Ensures purchasing power of death benefit remains adequate over 15 to 25 year horizons.",
    },
    {
      category: "Nomination & Claims Settlement",
      question: "How do I ensure my death benefit is protected under the Married Women's Property Act (MWPA) or trust structure?",
      whyItMatters: "Protects insurance claim payouts exclusively for your spouse and children, immune to creditor attachments.",
    },
  ];

  const educationalDisclaimer =
    "Educational Guidance Notice: This advisory report is generated strictly through deterministic mathematical analysis of user-provided figures. It does not constitute personalized professional financial, legal, tax, or investment advice. CoverWise does not use AI algorithms or insurer underwriting models. Insurance contracts require formal medical underwriting, risk classification, and regulatory compliance. Consult a licensed, qualified financial advisor before purchasing any financial product.";

  return {
    summaryHeadline,
    overallDiagnosis,
    urgencyLevel,
    gapAmount: gap,
    hasPositiveGap: gap > 0,
    isClampedToZero: isClamped,
    riskFlags,
    actionChecklist,
    preparationDocuments,
    questionsForAdvisor,
    educationalDisclaimer,
  };
}

/**
 * Returns today's date formatted as YYYY-MM-DD for min date constraints.
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface AppointmentFormFields {
  full_name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time_slot: string;
}

/**
 * Client-side validation for appointment booking form.
 * Ensures all required fields are validated and past dates are rejected.
 */
export function validateAppointmentForm(
  values: AppointmentFormFields
): Partial<Record<keyof AppointmentFormFields, string>> {
  const errors: Partial<Record<keyof AppointmentFormFields, string>> = {};

  // Name validation
  const trimmedName = values.full_name ? values.full_name.trim() : "";
  if (!trimmedName || trimmedName.length < 2) {
    errors.full_name = "Full name must be at least 2 characters long.";
  } else if (trimmedName.length > 100) {
    errors.full_name = "Full name cannot exceed 100 characters.";
  }

  // Email validation
  const trimmedEmail = values.email ? values.email.trim() : "";
  const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  if (!trimmedEmail) {
    errors.email = "Email address is required.";
  } else if (!emailRegex.test(trimmedEmail)) {
    errors.email = "Please enter a valid email address.";
  }

  // Phone validation
  const trimmedPhone = values.phone ? values.phone.trim() : "";
  const digits = trimmedPhone.replace(/\D/g, "");
  if (!trimmedPhone) {
    errors.phone = "Phone number is required.";
  } else if (digits.length < 10 || digits.length > 15) {
    errors.phone = "Phone number must contain between 10 and 15 digits.";
  }

  // Date validation (must not be in the past)
  if (!values.preferred_date || values.preferred_date.trim() === "") {
    errors.preferred_date = "Please select a consultation date.";
  } else {
    const todayStr = getTodayDateString();
    if (values.preferred_date < todayStr) {
      errors.preferred_date = "Appointment date cannot be in the past.";
    }
  }

  // Time slot validation
  if (!values.preferred_time_slot || values.preferred_time_slot.trim() === "") {
    errors.preferred_time_slot = "Please select an approved time slot.";
  }

  return errors;
}
