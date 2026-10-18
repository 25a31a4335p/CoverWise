import React, { useState } from "react";
import type { NetNeedsResult, HLVResult } from "../types";
import { formatCurrency } from "../utils/validation";
import { evaluateCustomCoverage } from "../utils/recommendations";

interface CoverageTenureControlsProps {
  netNeeds: NetNeedsResult;
  hlv: HLVResult;
  age?: number;
  initialBudget?: number;
}

export const CoverageTenureControls: React.FC<CoverageTenureControlsProps> = ({
  netNeeds,
  hlv,
  age = 35,
  initialBudget = 50000,
}) => {
  const baselineGap = netNeeds.recommended_cover;
  const baselineTenure = Math.max(10, Math.round(netNeeds.replacement_years));

  // User-adjusted proposed cover, tenure, and budget
  const [selectedCover, setSelectedCover] = useState<number>(
    baselineGap > 0 ? baselineGap : Math.round(hlv.hlv_estimate * 0.5)
  );
  const [selectedTenure, setSelectedTenure] = useState<number>(baselineTenure);
  const [selectedBudget, setSelectedBudget] = useState<number>(initialBudget);

  // Maximum sensible slider upper bound
  const maxCover = Math.max(
    30000000,
    Math.round(Math.max(baselineGap, hlv.hlv_estimate) * 1.5)
  );

  const comparison = evaluateCustomCoverage(
    selectedCover,
    baselineGap,
    selectedTenure,
    selectedBudget,
    age
  );

  // Quick preset adjustment handlers
  const handlePreset = (type: "baseline" | "minus25" | "plus25" | "hlv") => {
    switch (type) {
      case "baseline":
        setSelectedCover(baselineGap);
        setSelectedTenure(baselineTenure);
        break;
      case "minus25":
        setSelectedCover(Math.max(0, Math.round(baselineGap * 0.75)));
        break;
      case "plus25":
        setSelectedCover(Math.round(baselineGap * 1.25));
        break;
      case "hlv":
        setSelectedCover(Math.round(hlv.hlv_estimate));
        setSelectedTenure(Math.max(10, Math.round(hlv.remaining_earning_years)));
        break;
    }
  };

  return (
    <div className="coverage-controls-card">
      <div className="controls-header">
        <div>
          <span className="results-pill">Interactive Scenario Planning</span>
          <h3 className="controls-title">Proposed Coverage Amount, Policy Tenure & Budget Controls</h3>
          <p className="controls-subtitle">
            Fine-tune your policy parameters to test custom scenarios and evaluate indicative premium affordability.
          </p>
        </div>
      </div>

      {/* Side-by-Side Baseline vs Proposed Display */}
      <div className="coverage-comparison-grid four-col-metric-grid">
        {/* Baseline Net Needs (Unchanging reference) */}
        <div className="comparison-metric-box baseline-box">
          <span className="comparison-metric-label">Calculated Net Needs Gap</span>
          <div className="comparison-metric-amount">{formatCurrency(baselineGap)}</div>
          <p className="comparison-metric-caption">
            {baselineGap === 0
              ? "Zero additional cover needed (Fully funded by liquid assets & existing policies)"
              : "Minimum objective sum needed to eliminate debts and replace income"}
          </p>
          <div className="metric-tag">Benchmark Baseline</div>
        </div>

        {/* Proposed User Coverage */}
        <div className="comparison-metric-box proposed-box">
          <span className="comparison-metric-label">Your Proposed Policy Cover</span>
          <div className="comparison-metric-amount proposed-amount">
            {formatCurrency(selectedCover)}
          </div>
          <p className="comparison-metric-caption">
            Adjust using the slider below to test custom coverage scenarios
          </p>
          <div className={`status-badge-inline ${comparison.status}`}>
            {comparison.status === "match" && "Optimal 100% Match"}
            {comparison.status === "shortfall" && "Coverage Shortfall"}
            {comparison.status === "surplus" && "Surplus Safety Buffer"}
          </div>
        </div>

        {/* Estimated Indicative Premium */}
        <div className="comparison-metric-box premium-box">
          <span className="comparison-metric-label">Indicative Term Premium</span>
          <div className="comparison-metric-amount font-mono" style={{ color: "var(--cw-plum-deep)" }}>
            {comparison.illustrativePremium ? formatCurrency(comparison.illustrativePremium) : "0"}{" "}
            <span className="unit-label">/yr</span>
          </div>
          <p className="comparison-metric-caption">
            Actuarial benchmark rate for Age {age}, {selectedTenure}-yr term
          </p>
          <div className={`status-badge-inline ${comparison.budgetStatus || "within_budget"}`}>
            {comparison.budgetStatus === "within_budget" && "Within Budget"}
            {comparison.budgetStatus === "stretched" && "Budget Stretched (+25%)"}
            {comparison.budgetStatus === "exceeds_budget" && "Exceeds Budget"}
          </div>
        </div>

        {/* Proposed Tenure */}
        <div className="comparison-metric-box tenure-box">
          <span className="comparison-metric-label">Proposed Policy Tenure</span>
          <div className="comparison-metric-amount">{selectedTenure} <span className="unit-label">Years</span></div>
          <p className="comparison-metric-caption">
            Dependency: {baselineTenure} yrs &bull; Working: {hlv.remaining_earning_years} yrs
          </p>
          <div className="metric-tag">Coverage Duration</div>
        </div>
      </div>

      {/* Interactive Controls & Sliders */}
      <div className="sliders-panel">
        {/* Slider 1: Coverage Amount */}
        <div className="control-slider-group">
          <div className="slider-header-row">
            <label htmlFor="coverage-amount-slider" className="slider-field-title">
              1. Adjust Proposed Coverage Amount:
            </label>
            <span className="slider-live-value font-mono">
              {formatCurrency(selectedCover)}
            </span>
          </div>

          <input
            id="coverage-amount-slider"
            type="range"
            min="0"
            max={maxCover}
            step="50000"
            value={selectedCover}
            onChange={(e) => setSelectedCover(Number(e.target.value))}
            className="slider-input"
            aria-label="Proposed Coverage Amount Slider"
          />

          <div className="slider-range-labels">
            <span>0</span>
            <span className="slider-midpoint-marker">Baseline: {formatCurrency(baselineGap)}</span>
            <span>{formatCurrency(maxCover)}</span>
          </div>
        </div>

        {/* Slider 2: Policy Tenure */}
        <div className="control-slider-group">
          <div className="slider-header-row">
            <label htmlFor="policy-tenure-slider" className="slider-field-title">
              2. Adjust Proposed Policy Tenure:
            </label>
            <span className="slider-live-value font-mono">
              {selectedTenure} Years
            </span>
          </div>

          <input
            id="policy-tenure-slider"
            type="range"
            min="5"
            max="50"
            step="1"
            value={selectedTenure}
            onChange={(e) => setSelectedTenure(Number(e.target.value))}
            className="slider-input"
            aria-label="Proposed Policy Tenure Slider"
          />

          <div className="slider-range-labels">
            <span>5 Years</span>
            <span className="slider-midpoint-marker">Income Duration: {baselineTenure} yrs</span>
            <span>50 Years</span>
          </div>
        </div>

        {/* Slider 3: Annual Premium Budget */}
        <div className="control-slider-group">
          <div className="slider-header-row">
            <label htmlFor="annual-budget-slider" className="slider-field-title">
              3. Annual Premium Budget Control:
            </label>
            <span className="slider-live-value font-mono" style={{ color: "var(--cw-rose-text)" }}>
              {formatCurrency(selectedBudget)} / year
            </span>
          </div>

          <input
            id="annual-budget-slider"
            type="range"
            min="5000"
            max="250000"
            step="2500"
            value={selectedBudget}
            onChange={(e) => setSelectedBudget(Number(e.target.value))}
            className="slider-input"
            aria-label="Annual Premium Budget Slider"
          />

          <div className="slider-range-labels">
            <span>5,000</span>
            <span className="slider-midpoint-marker">Indicative Premium: {formatCurrency(comparison.illustrativePremium || 0)}</span>
            <span>250,000</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="quick-presets-row">
          <span className="presets-label">Quick Presets:</span>
          <button
            type="button"
            className="btn-preset"
            onClick={() => handlePreset("baseline")}
          >
            Exact Net Needs (100%)
          </button>
          {baselineGap > 0 && (
            <>
              <button
                type="button"
                className="btn-preset"
                onClick={() => handlePreset("minus25")}
              >
                -25% Budget Cover
              </button>
              <button
                type="button"
                className="btn-preset"
                onClick={() => handlePreset("plus25")}
              >
                +25% Inflation Buffer
              </button>
            </>
          )}
          <button
            type="button"
            className="btn-preset"
            onClick={() => handlePreset("hlv")}
          >
            Full HLV Benchmark
          </button>
        </div>
      </div>

      {/* Shortfall / Surplus Analysis Card */}
      <div className={`coverage-evaluation-banner ${comparison.status}`}>
        <div className="eval-icon">
          {comparison.status === "match" && "🎯"}
          {comparison.status === "shortfall" && "⚠️"}
          {comparison.status === "surplus" && "🛡️"}
        </div>
        <div className="eval-body">
          <div className="eval-status-row">
            <h4 className="eval-title">
              {comparison.status === "match" && "Coverage Status: Exactly Matches Calculated Need"}
              {comparison.status === "shortfall" && `Coverage Shortfall: ${formatCurrency(comparison.difference)} Deficit`}
              {comparison.status === "surplus" && `Coverage Surplus: ${formatCurrency(comparison.difference)} Cushion`}
            </h4>
          </div>
          <p className="eval-explanation">{comparison.message}</p>

          {/* Affordability evaluation feedback */}
          {comparison.budgetMessage && (
            <div className={`budget-feedback-note ${comparison.budgetStatus}`}>
              <strong>Budget Affordability:</strong> {comparison.budgetMessage}
            </div>
          )}

          {/* Tenure Alignment Explanations */}
          <div className="tenure-alignment-note">
            {selectedTenure < baselineTenure ? (
              <span className="tenure-warning">
                <strong>Tenure Gap Alert:</strong> Your proposed tenure ({selectedTenure} yrs) is shorter than your family&apos;s income replacement duration ({baselineTenure} yrs). If the policy expires early, your family could be left without protection while children or dependents still need support.
              </span>
            ) : selectedTenure > hlv.remaining_earning_years ? (
              <span className="tenure-info">
                <strong>Extended Tenure:</strong> Your proposed tenure ({selectedTenure} yrs) extends past your remaining earning years ({hlv.remaining_earning_years} yrs). Consider whether coverage is required into retirement or if debts will already be retired.
              </span>
            ) : (
              <span className="tenure-ok">
                <strong>Tenure Aligned:</strong> Your proposed tenure covers your family through their critical income dependency years ({baselineTenure} yrs).
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Illustrative Disclaimer Notice */}
      <div className="controls-disclaimer">
        <span>ℹ️</span>
        <p>
          <strong>Illustrative Scenario Notice:</strong> Custom coverage, tenure, and premium estimates are based on an actuarial benchmark model for educational comparison only. CoverWise does not guarantee insurer quotations, returns, or policy issuance. Formal premiums require underwriting evaluation of medical history, lifestyle factors, and rider selections.
        </p>
      </div>
    </div>
  );
};
