import type {
  PrimaryObjective,
  NetNeedsResult,
  HLVResult,
  PolicyRecommendation,
  RiskPreference,
} from "../types";
import { formatCurrency } from "./validation";

/**
 * Actuarial illustrative benchmark estimator.
 * Explicitly labeled as an educational illustrative benchmark.
 */
export function estimateIllustrativeAnnualPremium(
  category: "term_life" | "whole_life" | "endowment" | "ulip",
  coverage: number,
  age: number = 35,
  tenure: number = 20
): number {
  if (coverage <= 0) return 0;

  const ageFactor = Math.pow(1.055, Math.max(0, age - 25));
  const tenureFactor = 1.0 + (tenure / 100.0);
  const termRate = Math.max(0.70, 0.85 * ageFactor * tenureFactor);

  switch (category) {
    case "term_life":
      return Math.round((coverage / 1000.0) * termRate);
    case "whole_life":
      return Math.round((coverage / 1000.0) * (termRate * 5.5));
    case "endowment": {
      const endowmentRate = Math.max(45.0, (1000.0 / Math.max(10, tenure)) * 0.85 + termRate);
      return Math.round((coverage / 1000.0) * endowmentRate);
    }
    case "ulip":
      return Math.round(coverage / 10.0);
  }
}

/**
 * Deterministic, rule-based recommendation engine for 4 life insurance categories:
 * - Term Life Insurance
 * - Whole Life Insurance
 * - Endowment Plans
 * - Unit Linked Insurance Plans (ULIP)
 *
 * Rules use the user's explicit primary objective, calculated Net Needs/HLV numbers,
 * customer age, dependents count, risk preference, and annual premium budget.
 */
export function generatePolicyRecommendations(
  objective: PrimaryObjective,
  netNeeds: NetNeedsResult,
  hlv: HLVResult,
  age: number = 35,
  annualBudget: number = 50000,
  riskPreference: RiskPreference = "moderate",
  dependents: number = 2
): PolicyRecommendation[] {
  const gap = netNeeds.recommended_cover;
  const liabilities = netNeeds.outstanding_liabilities;
  const goals = netNeeds.future_financial_goals;
  const replacementYears = netNeeds.replacement_years;
  const earningYears = hlv.remaining_earning_years;
  const tenure = Math.max(10, Math.round(replacementYears));

  // Compute illustrative benchmark premiums for all 4 categories
  const termPrem = estimateIllustrativeAnnualPremium("term_life", gap > 0 ? gap : 5000000, age, tenure);
  const wholePrem = estimateIllustrativeAnnualPremium("whole_life", gap > 0 ? Math.round(gap * 0.75) : 3000000, age, 50);
  const endowmentPrem = estimateIllustrativeAnnualPremium("endowment", goals > 0 ? goals : Math.round(gap * 0.5), age, Math.min(20, tenure));
  const ulipPrem = estimateIllustrativeAnnualPremium("ulip", gap > 0 ? gap : 5000000, age, tenure);

  // Helper for budget affordability
  const checkBudget = (prem: number) => {
    if (annualBudget <= 0) {
      return {
        status: "info" as const,
        note: `Illustrative benchmark: ${formatCurrency(prem)}/yr (No annual budget specified).`,
      };
    }
    if (prem <= annualBudget) {
      const surplus = annualBudget - prem;
      return {
        status: "within_budget" as const,
        note: `Comfortably within your ${formatCurrency(annualBudget)}/yr budget (${formatCurrency(surplus)} surplus buffer).`,
      };
    }
    if (prem <= annualBudget * 1.25) {
      const def = prem - annualBudget;
      return {
        status: "stretched" as const,
        note: `Slightly exceeds budget by ${formatCurrency(def)}/yr (Within 25% tolerance).`,
      };
    }
    const def = prem - annualBudget;
    return {
      status: "exceeds_budget" as const,
      note: `Exceeds your ${formatCurrency(annualBudget)}/yr budget by ${formatCurrency(def)}/yr. Consider adjusting sum assured.`,
    };
  };

  const termBudget = checkBudget(termPrem);
  const wholeBudget = checkBudget(wholePrem);
  const endowmentBudget = checkBudget(endowmentPrem);
  const ulipBudget = checkBudget(ulipPrem);

  // 1. TERM LIFE INSURANCE
  const termIsPrimary = objective === "family_protection" || (dependents > 0 && liabilities > 0 && objective !== "legacy_planning" && objective !== "guaranteed_savings" && objective !== "market_wealth");
  const termWhy = gap > 0
    ? `You have a calculated protection deficit of ${formatCurrency(gap)}${liabilities > 0 ? ` (including ${formatCurrency(liabilities)} in outstanding liabilities)` : ""} and active family obligations over ${replacementYears} years. Term life provides the highest death benefit per dollar spent with zero investment overhead, ensuring full debt and living cost coverage.`
    : `Even though your existing resources currently meet your calculated obligations, term insurance remains the benchmark for pure, low-cost family income replacement should your financial liabilities expand.`;

  const termRecommendation: PolicyRecommendation = {
    category: "term_life",
    name: "Term Life Insurance",
    tagline: "Pure, Low-Cost Financial Protection",
    isPrimaryFit: termIsPrimary,
    fitBadge: termIsPrimary ? "Primary Recommendation" : "Foundation Alternative",
    purpose: "Provides a guaranteed lump-sum payout to your beneficiaries if you pass away during the policy tenure.",
    whyItFits: termWhy,
    advantages: [
      "Maximum sum assured per rupee/dollar of premium.",
      "Directly eliminates family financial distress from debts and income loss.",
      "Simple, transparent contract without market volatility or investment fees.",
    ],
    limitations: [
      "Pure risk cover with zero maturity/survival payout if you outlive the policy tenure.",
      "Premiums increase significantly if repurchasing after policy term expires.",
    ],
    suggestedCoverageText: gap > 0
      ? `${formatCurrency(gap)} (Matches 100% of your calculated Net Needs gap)`
      : "Baseline protection (e.g., 5-10x annual income contribution)",
    suggestedTenureText: `${tenure} Years (Matching dependent dependency period)`,
    indicativePremiumText: `~${formatCurrency(termPrem)}/year (Illustrative actuarial benchmark)`,
    affordabilityStatus: termBudget.status,
    affordabilityNote: termBudget.note,
    whyAlternativeLessSuitable: "If you prioritize capital accumulation or guaranteed survival payouts rather than pure risk cover, an Endowment or ULIP provides maturity cash values that Term Life does not.",
    triggerRule: termIsPrimary
      ? "Triggered as Primary because your selected objective is Family Protection & Debt Coverage."
      : "Triggered as Core Alternative because you have ongoing family dependency and debt obligations.",
  };

  // 2. WHOLE LIFE INSURANCE
  const wholeIsPrimary = objective === "legacy_planning";
  const wholeWhy = wholeIsPrimary
    ? `You indicated a priority for lifelong protection and estate legacy transfer. Unlike term policies which expire after a fixed duration, whole life guarantees a death benefit payout whenever you pass away (up to age 99 or 100).`
    : `If you desire permanent financial protection that never expires and want to guarantee a financial inheritance for the next generation regardless of age at passing.`;

  const wholeRecommendation: PolicyRecommendation = {
    category: "whole_life",
    name: "Whole Life Insurance",
    tagline: "Lifelong Coverage & Estate Legacy Transfer",
    isPrimaryFit: wholeIsPrimary,
    fitBadge: wholeIsPrimary ? "Primary Recommendation" : "Estate Alternative",
    purpose: "Guaranteed lifelong life cover up to age 99/100 combined with a conservative cash value component.",
    whyItFits: wholeWhy,
    advantages: [
      "Permanent coverage that never expires as long as premiums are paid.",
      "Guaranteed legacy payout to heirs for intergenerational estate transfer.",
      "Gradual accumulation of accessible surrender/loan cash value over decades.",
    ],
    limitations: [
      "Substantially higher premiums (typically 5x to 7x higher than term life for identical cover).",
      "Lower death benefit affordability for young families on limited budgets compared to pure term cover.",
    ],
    suggestedCoverageText: gap > 0
      ? `${formatCurrency(Math.round(gap * 0.75))} - ${formatCurrency(gap)} (Targeted legacy corpus)`
      : `${formatCurrency(Math.round(hlv.hlv_estimate * 0.5))} (Conservative estate benchmark)`,
    suggestedTenureText: "Lifelong / To Age 99–100",
    indicativePremiumText: `~${formatCurrency(wholePrem)}/year (Illustrative benchmark)`,
    affordabilityStatus: wholeBudget.status,
    affordabilityNote: wholeBudget.note,
    whyAlternativeLessSuitable: "Requires higher recurring premium commitments. For temporary obligations like 20-year home mortgages or dependent school fees, Term Life provides significantly higher cover at a fraction of the cost.",
    triggerRule: wholeIsPrimary
      ? "Triggered as Primary because your selected objective is Lifelong Protection & Legacy Planning."
      : "Triggered as Alternative for individuals wanting permanent inheritance guarantees rather than term-bound coverage.",
  };

  // 3. ENDOWMENT PLANS
  const endowmentIsPrimary = objective === "guaranteed_savings" || (riskPreference === "conservative" && goals > 0 && objective !== "family_protection" && objective !== "legacy_planning");
  const endowmentWhy = endowmentIsPrimary || goals > 0
    ? `You have milestone financial goals totaling ${formatCurrency(goals)} and prioritize capital preservation. Endowment plans enforce disciplined annual savings combined with modest life cover and guaranteed maturity payouts.`
    : `Provides a guaranteed lump-sum payout on maturity for conservative savers who want zero exposure to stock market fluctuations.`;

  const endowmentRecommendation: PolicyRecommendation = {
    category: "endowment",
    name: "Endowment Plan",
    tagline: "Disciplined Guaranteed Milestone Savings",
    isPrimaryFit: endowmentIsPrimary,
    fitBadge: endowmentIsPrimary ? "Primary Recommendation" : "Milestone Alternative",
    purpose: "Dual-benefit policy providing a guaranteed lump sum upon policy maturity, or death benefit if death occurs earlier.",
    whyItFits: endowmentWhy,
    advantages: [
      "Guaranteed maturity payout helping meet specific milestones (e.g., college tuition or marriage).",
      "Forced savings discipline with zero direct equity market downside risk.",
      "Tax efficiency under applicable local insurance saving provisions.",
    ],
    limitations: [
      "Lower internal rate of return (historically modest, often lagging inflation).",
      "Provides much smaller life insurance cover for the same premium compared to pure term life.",
    ],
    suggestedCoverageText: goals > 0
      ? `${formatCurrency(goals)} (Aligned with your milestone savings target)`
      : `${formatCurrency(Math.round(gap * 0.5))} (Coupled with separate term protection)`,
    suggestedTenureText: `${Math.min(20, Math.max(10, tenure))} Years (Aligned with target goal date)`,
    indicativePremiumText: `~${formatCurrency(endowmentPrem)}/year (Illustrative benchmark)`,
    affordabilityStatus: endowmentBudget.status,
    affordabilityNote: endowmentBudget.note,
    whyAlternativeLessSuitable: "If your primary goal is maximizing equity compounding over a 15+ year horizon, ULIP offers higher potential upside; if your primary need is large debt protection, Term Life provides far greater sum assured.",
    triggerRule: endowmentIsPrimary
      ? "Triggered as Primary because your selected objective is Guaranteed Milestone Savings."
      : "Triggered as Alternative because you have documented future financial milestone goals.",
  };

  // 4. UNIT LINKED INSURANCE PLAN (ULIP)
  const ulipIsPrimary = objective === "market_wealth" || (riskPreference === "aggressive" && earningYears >= 15 && objective !== "family_protection" && objective !== "legacy_planning");
  const ulipWhy = ulipIsPrimary || earningYears >= 15
    ? `With ${earningYears} remaining earning years and ${riskPreference} risk appetite, you have a sufficiently long time horizon to benefit from equity market compounding alongside life cover.`
    : `Combines life cover with choice of market funds (equity, balanced, debt) for investors seeking potential long-term capital appreciation.`;

  const ulipRecommendation: PolicyRecommendation = {
    category: "ulip",
    name: "Unit Linked Insurance Plan (ULIP)",
    tagline: "Market-Linked Long-Term Wealth Creation",
    isPrimaryFit: ulipIsPrimary,
    fitBadge: ulipIsPrimary ? "Primary Recommendation" : "Investment Alternative",
    purpose: "Hybrid vehicle where part of premium provides life cover and the remaining is invested in equity/debt funds of your choice.",
    whyItFits: ulipWhy,
    advantages: [
      "Potential for higher inflation-beating returns through equity market compounding over 10+ years.",
      "Flexibility to switch between equity, hybrid, and debt asset allocations as you near maturity.",
      "Long-term tax benefits on qualifying contributions and payouts under local regulations.",
    ],
    limitations: [
      "Investment returns are not guaranteed and are subject entirely to capital market risks.",
      "Mandatory 5-year lock-in period with early surrender penalties.",
      "Subject to fund management, mortality, and policy administration charges.",
    ],
    suggestedCoverageText: "10x to 15x Annual Premium Contribution (Aligned with regulatory limits)",
    suggestedTenureText: `${Math.min(25, Math.max(10, Math.round(earningYears)))} Years (Long horizon to ride market cycles)`,
    indicativePremiumText: `~${formatCurrency(ulipPrem)}/year (Illustrative benchmark)`,
    affordabilityStatus: ulipBudget.status,
    affordabilityNote: ulipBudget.note,
    whyAlternativeLessSuitable: "If you have low tolerance for capital market drawdowns, an Endowment plan guarantees principal and return; if you have large debt obligations, Term Life should be secured first.",
    triggerRule: ulipIsPrimary
      ? "Triggered as Primary because your selected objective is Market-Linked Long-Term Wealth Creation."
      : "Triggered as Alternative because your working time horizon (15+ yrs) allows absorbing market volatility.",
  };

  const all = [termRecommendation, wholeRecommendation, endowmentRecommendation, ulipRecommendation];

  // Sort so primary recommendation appears first
  return all.sort((a, b) => {
    if (a.isPrimaryFit && !b.isPrimaryFit) return -1;
    if (!a.isPrimaryFit && b.isPrimaryFit) return 1;
    return 0;
  });
}

export interface CoverageComparisonResult {
  selectedCover: number;
  baselineGap: number;
  difference: number;
  status: "match" | "shortfall" | "surplus";
  message: string;
  illustrativePremium?: number;
  annualBudget?: number;
  budgetStatus?: "within_budget" | "exceeds_budget" | "stretched";
  budgetMessage?: string;
}

/**
 * Validate user-customized coverage amount against calculated Net Needs gap
 * and evaluate illustrative affordability against customer budget.
 */
export function evaluateCustomCoverage(
  selectedCover: number,
  baselineGap: number,
  selectedTenure: number = 20,
  annualBudget: number = 50000,
  age: number = 35
): CoverageComparisonResult {
  const diff = selectedCover - baselineGap;

  // Compute illustrative term premium for custom coverage
  const illustrativePremium = estimateIllustrativeAnnualPremium("term_life", selectedCover, age, selectedTenure);

  let budgetStatus: "within_budget" | "exceeds_budget" | "stretched" = "within_budget";
  let budgetMessage = "";

  if (annualBudget > 0) {
    if (illustrativePremium <= annualBudget) {
      budgetStatus = "within_budget";
      budgetMessage = `Estimated illustrative premium of ${formatCurrency(illustrativePremium)}/yr is comfortably within your ${formatCurrency(annualBudget)}/yr budget (${formatCurrency(annualBudget - illustrativePremium)} surplus).`;
    } else if (illustrativePremium <= annualBudget * 1.25) {
      budgetStatus = "stretched";
      budgetMessage = `Estimated illustrative premium of ${formatCurrency(illustrativePremium)}/yr slightly exceeds your budget by ${formatCurrency(illustrativePremium - annualBudget)}/yr (within 25% stretch).`;
    } else {
      budgetStatus = "exceeds_budget";
      budgetMessage = `Estimated illustrative premium of ${formatCurrency(illustrativePremium)}/yr exceeds your ${formatCurrency(annualBudget)}/yr budget by ${formatCurrency(illustrativePremium - annualBudget)}/yr. Consider adjusting cover or tenure.`;
    }
  }

  if (Math.abs(diff) < 1) {
    return {
      selectedCover,
      baselineGap,
      difference: 0,
      status: "match",
      message: "Selected coverage exactly matches your calculated Net Needs protection gap (100% of obligations covered).",
      illustrativePremium,
      annualBudget,
      budgetStatus,
      budgetMessage,
    };
  }

  if (diff < 0) {
    return {
      selectedCover,
      baselineGap,
      difference: Math.abs(diff),
      status: "shortfall",
      message: `Selected coverage is ${formatCurrency(Math.abs(diff))} below your calculated gap. This leaves a portion of your family's debts or income replacement unprotected.`,
      illustrativePremium,
      annualBudget,
      budgetStatus,
      budgetMessage,
    };
  }

  return {
    selectedCover,
    baselineGap,
    difference: diff,
    status: "surplus",
    message: `Selected coverage provides a ${formatCurrency(diff)} surplus cushion above your minimum calculated need, offering an extra buffer for inflation and unexpected expenses.`,
    illustrativePremium,
    annualBudget,
    budgetStatus,
    budgetMessage,
  };
}
