/**
 * CoverWise TypeScript Type Definitions
 * Exact mapping of backend CalculationRequest & CalculationResponse
 */

export type PrimaryObjective =
  | "family_protection"
  | "guaranteed_savings"
  | "market_wealth"
  | "legacy_planning";

export type RiskPreference = "conservative" | "moderate" | "aggressive";
export type CalculationMethod = "net_needs" | "hlv";

export type PolicyCategory = "term_life" | "whole_life" | "endowment" | "ulip";

export interface PolicyRecommendation {
  category: PolicyCategory;
  name: string;
  tagline: string;
  isPrimaryFit: boolean;
  fitBadge: string;
  purpose: string;
  whyItFits: string;
  advantages: string[];
  limitations: string[];
  suggestedCoverageText: string;
  suggestedTenureText: string;
  indicativePremiumText: string;
  affordabilityStatus: "within_budget" | "exceeds_budget" | "stretched" | "info";
  affordabilityNote: string;
  whyAlternativeLessSuitable?: string;
  triggerRule: string;
}

export interface CalculationRequest {
  age?: number;
  annual_income_contribution: number;
  monthly_household_expenses?: number;
  dependents_count?: number;
  replacement_years: number;
  remaining_earning_years: number;
  outstanding_liabilities?: number;
  future_financial_goals?: number;
  available_assets?: number;
  existing_life_insurance?: number;
  discount_rate?: number;
  annual_premium_budget?: number;
  risk_preference?: RiskPreference;
  calculation_method?: CalculationMethod;
}

export interface NetNeedsResult {
  outstanding_liabilities: number;
  future_financial_goals: number;
  annual_income_contribution: number;
  monthly_household_expenses?: number | null;
  dependents_count?: number;
  replacement_years: number;
  pv_income_replacement: number;
  total_obligations: number;
  available_assets: number;
  existing_life_insurance: number;
  total_resources: number;
  raw_net_cover: number;
  recommended_cover: number;
  is_clamped_to_zero: boolean;
  calculation_method?: string;
}

export interface HLVResult {
  hlv_estimate: number;
  remaining_earning_years: number;
  benchmark_description: string;
  annual_income_used?: number;
  discount_rate_used?: number;
  net_gap_hlv?: number;
}

export interface IllustrativePremiumEstimate {
  term_annual_premium: number;
  whole_life_annual_premium: number;
  endowment_annual_premium: number;
  ulip_annual_premium: number;
  annual_budget: number;
  term_affordability_status: string;
  disclaimer: string;
}

export interface Assumptions {
  selected_method_name?: string;
  customer_age?: number;
  dependents_count?: number;
  annual_premium_budget?: number;
  risk_preference?: string;
  discount_rate: number;
  discount_rate_percentage: string;
  net_needs_formula: string;
  hlv_formula: string;
  currency_unit: string;
  limitations?: string;
}

export interface CalculationResponse {
  net_needs: NetNeedsResult;
  human_life_value: HLVResult;
  selected_method?: string;
  final_recommended_cover?: number;
  coverage_gap?: number;
  illustrative_premiums?: IllustrativePremiumEstimate;
  assumptions: Assumptions;
}

export interface HealthResponse {
  status: string;
  app: string;
  tagline: string;
  version: string;
}

export interface AssessmentFormValues {
  age: string;
  annual_income_contribution: string;
  monthly_household_expenses: string;
  dependents_count: string;
  replacement_years: string;
  remaining_earning_years: string;
  outstanding_liabilities: string;
  future_financial_goals: string;
  available_assets: string;
  existing_life_insurance: string;
  discount_rate: string; // percentage string (e.g. "5.0")
  annual_premium_budget: string;
  risk_preference: RiskPreference;
  calculation_method: CalculationMethod;
  primary_objective: PrimaryObjective;
}

export type FormErrors = Partial<Record<keyof AssessmentFormValues, string>>;

export const VALID_TIME_SLOTS = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM",
] as const;

export type ValidTimeSlot = (typeof VALID_TIME_SLOTS)[number];

export type AppointmentStatus = "REQUESTED";

export interface AppointmentCreateRequest {
  full_name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time_slot: string;
  consultation_type?: string;
  notes?: string;
  recommended_cover?: number;
}

export interface AppointmentResponse {
  id: number;
  reference_id?: string;
  full_name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time_slot: string;
  consultation_type: string;
  notes?: string | null;
  recommended_cover: number;
  status: AppointmentStatus;
  created_at: string;
  disclaimer: string;
}

export interface SafeAppointmentSummary {
  id: number;
  reference_id?: string;
  masked_name: string;
  masked_email: string;
  preferred_date: string;
  preferred_time_slot: string;
  consultation_type: string;
  recommended_cover: number;
  status: AppointmentStatus | string;
  created_at: string;
}

export type RiskSeverity = "high" | "moderate" | "low" | "info";

export interface AdvisoryRiskFlag {
  id: string;
  title: string;
  severity: RiskSeverity;
  description: string;
  impact: string;
}

export interface AdvisoryChecklistItem {
  id: string;
  priority: "immediate" | "medium" | "review";
  title: string;
  description: string;
  rationale: string;
}

export interface AdvisoryDocumentGuide {
  documentName: string;
  purpose: string;
  category: "income" | "liabilities" | "existing_coverage" | "identity";
}

export interface AdvisorQuestion {
  category: string;
  question: string;
  whyItMatters: string;
}

export interface AdvisoryReport {
  summaryHeadline: string;
  overallDiagnosis: string;
  urgencyLevel: "critical" | "moderate" | "healthy";
  gapAmount: number;
  hasPositiveGap: boolean;
  isClampedToZero: boolean;
  riskFlags: AdvisoryRiskFlag[];
  actionChecklist: AdvisoryChecklistItem[];
  preparationDocuments: AdvisoryDocumentGuide[];
  questionsForAdvisor: AdvisorQuestion[];
  educationalDisclaimer: string;
}
