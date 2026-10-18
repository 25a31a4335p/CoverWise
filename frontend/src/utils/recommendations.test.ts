import { describe, it, expect } from "vitest";
import {
  generatePolicyRecommendations,
  evaluateCustomCoverage,
} from "./recommendations";
import type { NetNeedsResult, HLVResult, PrimaryObjective } from "../types";

describe("Rule-Based Policy Recommendations Engine", () => {
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

  it("recommends Term Life as primary when objective is family protection", () => {
    const recs = generatePolicyRecommendations("family_protection", mockNetNeeds, mockHLV);
    expect(recs).toHaveLength(4);
    expect(recs[0].category).toBe("term_life");
    expect(recs[0].isPrimaryFit).toBe(true);
    expect(recs[0].fitBadge).toBe("Primary Recommendation");
    expect(recs[0].triggerRule).toContain("Family Protection & Debt Coverage");
  });

  it("recommends Endowment as primary when objective is guaranteed savings", () => {
    const recs = generatePolicyRecommendations("guaranteed_savings", mockNetNeeds, mockHLV);
    expect(recs).toHaveLength(4);
    expect(recs[0].category).toBe("endowment");
    expect(recs[0].isPrimaryFit).toBe(true);
    expect(recs[0].fitBadge).toBe("Primary Recommendation");
    expect(recs[0].triggerRule).toContain("Guaranteed Milestone Savings");
  });

  it("recommends ULIP as primary when objective is market wealth creation", () => {
    const recs = generatePolicyRecommendations("market_wealth", mockNetNeeds, mockHLV);
    expect(recs).toHaveLength(4);
    expect(recs[0].category).toBe("ulip");
    expect(recs[0].isPrimaryFit).toBe(true);
    expect(recs[0].fitBadge).toBe("Primary Recommendation");
    expect(recs[0].triggerRule).toContain("Market-Linked Long-Term Wealth Creation");
  });

  it("recommends Whole Life as primary when objective is lifelong protection and legacy planning", () => {
    const recs = generatePolicyRecommendations("legacy_planning", mockNetNeeds, mockHLV);
    expect(recs).toHaveLength(4);
    expect(recs[0].category).toBe("whole_life");
    expect(recs[0].isPrimaryFit).toBe(true);
    expect(recs[0].fitBadge).toBe("Primary Recommendation");
    expect(recs[0].triggerRule).toContain("Lifelong Protection & Legacy Planning");
  });

  it("ensures all 4 categories contain all required fields with meaningful content", () => {
    const objectives: PrimaryObjective[] = [
      "family_protection",
      "guaranteed_savings",
      "market_wealth",
      "legacy_planning",
    ];

    for (const obj of objectives) {
      const recs = generatePolicyRecommendations(obj, mockNetNeeds, mockHLV);
      expect(recs).toHaveLength(4);

      // Verify the first item is the primary one
      expect(recs[0].isPrimaryFit).toBe(true);
      expect(recs.slice(1).every((r) => !r.isPrimaryFit)).toBe(true);

      for (const rec of recs) {
        expect(rec.name.length).toBeGreaterThan(0);
        expect(rec.tagline.length).toBeGreaterThan(0);
        expect(rec.purpose.length).toBeGreaterThan(0);
        expect(rec.whyItFits.length).toBeGreaterThan(0);
        expect(rec.advantages.length).toBeGreaterThanOrEqual(2);
        expect(rec.limitations.length).toBeGreaterThanOrEqual(2);
        expect(rec.suggestedCoverageText.length).toBeGreaterThan(0);
        expect(rec.suggestedTenureText.length).toBeGreaterThan(0);
        expect(rec.triggerRule.length).toBeGreaterThan(0);
      }
    }
  });

  it("handles clamped to zero / fully funded profiles gracefully", () => {
    const clampedNetNeeds: NetNeedsResult = {
      ...mockNetNeeds,
      recommended_cover: 0,
      raw_net_cover: -500000,
      is_clamped_to_zero: true,
    };

    const recs = generatePolicyRecommendations("family_protection", clampedNetNeeds, mockHLV);
    expect(recs).toHaveLength(4);
    expect(recs[0].category).toBe("term_life");
    expect(recs[0].suggestedCoverageText).toContain("Baseline protection");
  });
});

describe("Interactive Coverage Controls Evaluator", () => {
  const baselineGap = 8000000;

  it("evaluates exact coverage match correctly", () => {
    const result = evaluateCustomCoverage(8000000, baselineGap);
    expect(result.status).toBe("match");
    expect(result.difference).toBe(0);
    expect(result.message).toContain("matches your calculated Net Needs protection gap");
  });

  it("evaluates coverage shortfall correctly when proposed cover is below gap", () => {
    const result = evaluateCustomCoverage(6000000, baselineGap);
    expect(result.status).toBe("shortfall");
    expect(result.difference).toBe(2000000);
    expect(result.message).toContain("below your calculated gap");
  });

  it("evaluates coverage surplus correctly when proposed cover exceeds gap", () => {
    const result = evaluateCustomCoverage(10000000, baselineGap);
    expect(result.status).toBe("surplus");
    expect(result.difference).toBe(2000000);
    expect(result.message).toContain("surplus cushion");
  });

  it("evaluates illustrative premium and budget affordability", () => {
    // 8,000,000 cover, 20 yrs tenure, 50,000 budget, age 35
    const result = evaluateCustomCoverage(8000000, baselineGap, 20, 50000, 35);
    expect(result.illustrativePremium).toBeGreaterThan(0);
    expect(result.budgetStatus).toBeDefined();
    expect(result.budgetMessage).toBeDefined();
  });
});

describe("Illustrative Premium & Trade-Off Explanations", () => {
  it("provides indicative premium and whyAlternativeLessSuitable for all recommendations", () => {
    const mockNetNeeds: NetNeedsResult = {
      outstanding_liabilities: 1000000,
      future_financial_goals: 1500000,
      annual_income_contribution: 600000,
      replacement_years: 15,
      pv_income_replacement: 6227794.82,
      total_obligations: 8727794.82,
      available_assets: 500000,
      existing_life_insurance: 1000000,
      total_resources: 1500000,
      raw_net_cover: 7227794.82,
      recommended_cover: 7227794.82,
      is_clamped_to_zero: false,
    };
    const mockHLV: HLVResult = {
      hlv_estimate: 8456366.74,
      remaining_earning_years: 25,
      benchmark_description: "Present economic value of income contribution",
    };

    const recs = generatePolicyRecommendations(
      "family_protection",
      mockNetNeeds,
      mockHLV,
      30,
      35000,
      "moderate",
      2
    );

    for (const r of recs) {
      expect(r.indicativePremiumText).toContain("/year");
      expect(r.affordabilityStatus).toBeDefined();
      expect(r.whyAlternativeLessSuitable).toBeDefined();
      expect(r.whyAlternativeLessSuitable!.length).toBeGreaterThan(10);
    }
  });
});
