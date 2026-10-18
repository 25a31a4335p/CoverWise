import React, { useState } from "react";
import type {
  PrimaryObjective,
  NetNeedsResult,
  HLVResult,
  RiskPreference,
} from "../types";
import { generatePolicyRecommendations } from "../utils/recommendations";

interface PolicyRecommendationsProps {
  initialObjective: PrimaryObjective;
  netNeeds: NetNeedsResult;
  hlv: HLVResult;
  age?: number;
  annualBudget?: number;
  riskPreference?: RiskPreference;
  dependents?: number;
}

const OBJECTIVE_OPTIONS: { id: PrimaryObjective; label: string; icon: string }[] = [
  {
    id: "family_protection",
    label: "Family protection and debt coverage",
    icon: "🛡️",
  },
  {
    id: "guaranteed_savings",
    label: "Guaranteed milestone savings",
    icon: "🎯",
  },
  {
    id: "market_wealth",
    label: "Market-linked long-term wealth creation",
    icon: "📈",
  },
  {
    id: "legacy_planning",
    label: "Lifelong protection and legacy planning",
    icon: "🏛️",
  },
];

export const PolicyRecommendations: React.FC<PolicyRecommendationsProps> = ({
  initialObjective,
  netNeeds,
  hlv,
  age = 35,
  annualBudget = 50000,
  riskPreference = "moderate",
  dependents = 2,
}) => {
  const [selectedObjective, setSelectedObjective] = useState<PrimaryObjective>(initialObjective);

  const recommendations = generatePolicyRecommendations(
    selectedObjective,
    netNeeds,
    hlv,
    age,
    annualBudget,
    riskPreference,
    dependents
  );
  const primaryRec = recommendations.find((r) => r.isPrimaryFit);
  const alternativeRecs = recommendations.filter((r) => !r.isPrimaryFit);

  return (
    <div className="recommendations-container">
      {/* Header & Objective Selector */}
      <div className="recommendations-header-card">
        <div className="rec-header-titles">
          <span className="results-pill">Rule-Based Policy Recommendations</span>
          <h3 className="rec-main-title">Transparent Life Insurance Product Category Matching</h3>
          <p className="rec-main-subtitle">
            Based on your stated objective, customer profile, risk preference, and calculated financial obligations,
            CoverWise matches you with the most relevant insurance category using deterministic, explainable rules.
          </p>
        </div>

        {/* Objective Switcher */}
        <div className="objective-selector-wrapper">
          <label htmlFor="objective-select" className="objective-selector-label">
            Selected Financial Objective:
          </label>
          <div className="objective-pills">
            {OBJECTIVE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`btn-objective-pill ${selectedObjective === opt.id ? "active" : ""}`}
                onClick={() => setSelectedObjective(opt.id)}
                aria-pressed={selectedObjective === opt.id}
              >
                <span className="pill-icon">{opt.icon}</span>
                <span className="pill-label">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Recommendation Section */}
      {primaryRec && (
        <div className="primary-recommendation-hero">
          <div className="primary-hero-badge-row">
            <span className="hero-star-badge">⭐ Primary Category Fit</span>
            <span className="category-type-pill">{primaryRec.category.toUpperCase().replace("_", " ")}</span>
            <span className={`status-badge-inline ${primaryRec.affordabilityStatus}`}>
              {primaryRec.affordabilityStatus === "within_budget" && "Within Annual Budget"}
              {primaryRec.affordabilityStatus === "stretched" && "Budget Stretched (+25%)"}
              {primaryRec.affordabilityStatus === "exceeds_budget" && "Exceeds Annual Budget"}
              {primaryRec.affordabilityStatus === "info" && "Illustrative Pricing Available"}
            </span>
          </div>

          <div className="primary-hero-header">
            <div>
              <h4 className="primary-rec-title">{primaryRec.name}</h4>
              <p className="primary-rec-tagline">{primaryRec.tagline}</p>
            </div>
          </div>

          {/* Core Purpose & Why it fits */}
          <div className="rec-highlight-grid">
            <div className="rec-highlight-item">
              <span className="rec-item-label">Core Category Purpose:</span>
              <p className="rec-item-value">{primaryRec.purpose}</p>
            </div>

            <div className="rec-highlight-item">
              <span className="rec-item-label">Why It Fits Your Profile:</span>
              <p className="rec-item-value">{primaryRec.whyItFits}</p>
            </div>
          </div>

          {/* Illustrative Scope & Indicative Pricing */}
          <div className="illustrative-scope-banner">
            <div className="scope-col">
              <span className="scope-label">Suggested Illustrative Coverage:</span>
              <span className="scope-value">{primaryRec.suggestedCoverageText}</span>
              <span className="illustrative-disclaimer-tag">(Illustrative benchmark &mdash; not an insurance quote)</span>
            </div>
            <div className="scope-col">
              <span className="scope-label">Suggested Illustrative Tenure:</span>
              <span className="scope-value">{primaryRec.suggestedTenureText}</span>
              <span className="illustrative-disclaimer-tag">(Aligned with dependency & earning horizon)</span>
            </div>
            <div className="scope-col">
              <span className="scope-label">Indicative Benchmark Premium:</span>
              <span className="scope-value font-mono premium-highlight">
                {primaryRec.indicativePremiumText}
              </span>
              <span className="illustrative-disclaimer-tag">{primaryRec.affordabilityNote}</span>
            </div>
          </div>

          {/* Advantages & Limitations Grid */}
          <div className="pros-cons-grid">
            <div className="pros-box">
              <h5 className="pros-title">
                <span className="pro-icon">✓</span> Key Advantages
              </h5>
              <ul className="pros-list">
                {primaryRec.advantages.map((adv, idx) => (
                  <li key={idx}>{adv}</li>
                ))}
              </ul>
            </div>

            <div className="cons-box">
              <h5 className="cons-title">
                <span className="con-icon">⚠️</span> Trade-offs & Limitations
              </h5>
              <ul className="cons-list">
                {primaryRec.limitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Why Alternative Less Suitable */}
          {primaryRec.whyAlternativeLessSuitable && (
            <div className="tradeoff-explainer-banner">
              <span className="tradeoff-icon">⚖️</span>
              <div>
                <strong>Why Alternatives May Be Less Suitable: </strong>
                <span>{primaryRec.whyAlternativeLessSuitable}</span>
              </div>
            </div>
          )}

          {/* Trigger Rule Explanation */}
          <div className="trigger-rule-box">
            <span className="rule-badge">Deterministic Rule Trigger</span>
            <p className="rule-text">{primaryRec.triggerRule}</p>
          </div>
        </div>
      )}

      {/* Alternative Categories Section */}
      <div className="alternatives-section">
        <h4 className="alternatives-header">
          Alternative Life Insurance Categories & Trade-Offs
        </h4>
        <p className="alternatives-subtext">
          Compare other product categories to understand their relative purposes, indicative costs, and constraints.
        </p>

        <div className="alternatives-cards-grid">
          {alternativeRecs.map((alt) => (
            <div key={alt.category} className="alt-category-card">
              <div className="alt-card-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="alt-fit-badge">{alt.fitBadge}</span>
                  <span className={`status-badge-inline ${alt.affordabilityStatus}`}>
                    {alt.affordabilityStatus === "within_budget" ? "Within Budget" : "Exceeds Budget"}
                  </span>
                </div>
                <h5 className="alt-card-title">{alt.name}</h5>
                <p className="alt-card-tagline">{alt.tagline}</p>
              </div>

              <div className="alt-card-body">
                <div className="alt-body-section">
                  <span className="alt-label">Main Purpose:</span>
                  <p className="alt-text">{alt.purpose}</p>
                </div>

                <div className="alt-body-section">
                  <span className="alt-label">Suitability Analysis:</span>
                  <p className="alt-text">{alt.whyItFits}</p>
                </div>

                <div className="alt-scope-box">
                  <div className="alt-scope-row">
                    <span className="alt-scope-key">Illustrative Cover:</span>
                    <span className="alt-scope-val">{alt.suggestedCoverageText}</span>
                  </div>
                  <div className="alt-scope-row">
                    <span className="alt-scope-key">Illustrative Tenure:</span>
                    <span className="alt-scope-val">{alt.suggestedTenureText}</span>
                  </div>
                  <div className="alt-scope-row">
                    <span className="alt-scope-key">Indicative Premium:</span>
                    <span className="alt-scope-val font-mono">{alt.indicativePremiumText}</span>
                  </div>
                </div>

                {/* Pros & Cons */}
                <div className="alt-pros-cons">
                  <div className="alt-pros">
                    <strong className="alt-pro-title">Advantages:</strong>
                    <ul>
                      {alt.advantages.map((adv, idx) => (
                        <li key={idx}>{adv}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="alt-cons">
                    <strong className="alt-con-title">Limitations:</strong>
                    <ul>
                      {alt.limitations.map((lim, idx) => (
                        <li key={idx}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Why Alternative Less Suitable */}
                {alt.whyAlternativeLessSuitable && (
                  <div className="alt-less-suitable-note">
                    <strong>Trade-off Notice:</strong> {alt.whyAlternativeLessSuitable}
                  </div>
                )}

                {/* Trigger Rule */}
                <div className="alt-rule-box">
                  <span className="alt-rule-label">Evaluation Rule:</span>
                  <p className="alt-rule-text">{alt.triggerRule}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advisory & Regulatory Non-Advisory Disclaimer */}
      <div className="advisory-disclaimer-card">
        <div className="disclaimer-header">
          <span className="disclaimer-icon">⚖️</span>
          <h4 className="disclaimer-title">Educational Life Insurance Guidance & Rule Transparency Notice</h4>
        </div>
        <p className="disclaimer-body">
          CoverWise delivers transparent product category comparisons based strictly on the user&apos;s selected financial objective, liabilities, and deterministic mathematical rules. This software does not constitute personalized financial, tax, or legal advice, nor does it guarantee policy issuance or premium quotes. Insurance policies are legal contracts subject to formal medical underwriting, terms, conditions, and applicable local regulatory guidelines. Consult a licensed insurance professional before purchasing any financial product.
        </p>
      </div>
    </div>
  );
};
