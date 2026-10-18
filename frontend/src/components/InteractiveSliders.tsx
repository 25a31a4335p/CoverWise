import React, { useState } from "react";
import type { CalculationRequest, NetNeedsResult, HLVResult } from "../types";
import { formatCurrency } from "../utils/validation";

interface InteractiveSlidersProps {
  currentPayload: CalculationRequest;
  currentNetNeeds: NetNeedsResult;
  currentHLV: HLVResult;
  onRecalculate: (updatedPayload: CalculationRequest) => Promise<void>;
  isRecalculating: boolean;
}

export const InteractiveSliders: React.FC<InteractiveSlidersProps> = ({
  currentPayload,
  onRecalculate,
  isRecalculating,
}) => {
  // Local state for the interactive sliders initialized from current payload
  const [income, setIncome] = useState<number>(currentPayload.annual_income_contribution);
  const [replacementYears, setReplacementYears] = useState<number>(currentPayload.replacement_years);
  const [earningYears, setEarningYears] = useState<number>(currentPayload.remaining_earning_years);
  const [discountRatePercent, setDiscountRatePercent] = useState<number>(
    (currentPayload.discount_rate ?? 0.05) * 100
  );

  const hasChanges =
    income !== currentPayload.annual_income_contribution ||
    replacementYears !== currentPayload.replacement_years ||
    earningYears !== currentPayload.remaining_earning_years ||
    Math.abs(discountRatePercent / 100 - (currentPayload.discount_rate ?? 0.05)) > 0.001;

  const handleApply = async () => {
    const updatedPayload: CalculationRequest = {
      ...currentPayload,
      annual_income_contribution: income,
      replacement_years: replacementYears,
      remaining_earning_years: earningYears,
      discount_rate: Number((discountRatePercent / 100).toFixed(4)),
    };
    await onRecalculate(updatedPayload);
  };

  const handleResetSliders = () => {
    setIncome(currentPayload.annual_income_contribution);
    setReplacementYears(currentPayload.replacement_years);
    setEarningYears(currentPayload.remaining_earning_years);
    setDiscountRatePercent((currentPayload.discount_rate ?? 0.05) * 100);
  };

  return (
    <div className="sliders-container">
      <div className="sliders-header">
        <div>
          <span className="results-pill" style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}>
            Scenario Modeling
          </span>
          <h3 className="sliders-title">Interactive &ldquo;What-If&rdquo; Controls</h3>
          <p className="sliders-subtitle">
            Adjust the sliders below to explore how income levels, duration, and discount rates alter your recommended cover and HLV benchmark via the FastAPI calculation engine.
          </p>
        </div>
      </div>

      <div className="sliders-grid">
        {/* Slider 1: Annual Income Contribution */}
        <div className="slider-card">
          <div className="slider-label-row">
            <span className="slider-name">Annual Income Contribution</span>
            <span className="slider-value-badge">{formatCurrency(income)}</span>
          </div>
          <p className="slider-hint">Amount allocated toward household living and bills each year.</p>
          <input
            type="range"
            min="0"
            max="3000000"
            step="25000"
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="custom-range"
            disabled={isRecalculating}
            aria-label="Annual Income Contribution slider"
          />
          <div className="slider-ticks">
            <span>0</span>
            <span>1,500,000</span>
            <span>3,000,000+</span>
          </div>
        </div>

        {/* Slider 2: Replacement Duration */}
        <div className="slider-card">
          <div className="slider-label-row">
            <span className="slider-name">Replacement Duration (Years)</span>
            <span className="slider-value-badge">{replacementYears} Years</span>
          </div>
          <p className="slider-hint">How many years dependents will need income replacement.</p>
          <input
            type="range"
            min="1"
            max="35"
            step="1"
            value={replacementYears}
            onChange={(e) => setReplacementYears(Number(e.target.value))}
            className="custom-range"
            disabled={isRecalculating}
            aria-label="Replacement Duration slider"
          />
          <div className="slider-ticks">
            <span>1 Yr</span>
            <span>15 Yrs</span>
            <span>35 Yrs</span>
          </div>
        </div>

        {/* Slider 3: Remaining Earning Years (HLV Horizon) */}
        <div className="slider-card">
          <div className="slider-label-row">
            <span className="slider-name">Remaining Earning Years</span>
            <span className="slider-value-badge">{earningYears} Years</span>
          </div>
          <p className="slider-hint">Years until planned retirement (governs the HLV benchmark).</p>
          <input
            type="range"
            min="1"
            max="40"
            step="1"
            value={earningYears}
            onChange={(e) => setEarningYears(Number(e.target.value))}
            className="custom-range"
            disabled={isRecalculating}
            aria-label="Remaining Earning Years slider"
          />
          <div className="slider-ticks">
            <span>1 Yr</span>
            <span>20 Yrs</span>
            <span>40 Yrs</span>
          </div>
        </div>

        {/* Slider 4: Real Discount Rate */}
        <div className="slider-card">
          <div className="slider-label-row">
            <span className="slider-name">Assumed Real Discount Rate</span>
            <span className="slider-value-badge">{discountRatePercent.toFixed(1)}%</span>
          </div>
          <p className="slider-hint">Conservative return above inflation on invested corpus.</p>
          <input
            type="range"
            min="0"
            max="15"
            step="0.5"
            value={discountRatePercent}
            onChange={(e) => setDiscountRatePercent(Number(e.target.value))}
            className="custom-range"
            disabled={isRecalculating}
            aria-label="Discount Rate slider"
          />
          <div className="slider-ticks">
            <span>0.0% (Linear)</span>
            <span>5.0% (Default)</span>
            <span>15.0%</span>
          </div>
        </div>
      </div>

      {/* Action Controls for Sliders */}
      <div className="sliders-action-bar">
        <button
          type="button"
          className="btn-primary"
          onClick={handleApply}
          disabled={isRecalculating || !hasChanges}
        >
          {isRecalculating ? (
            <span className="btn-loading-wrapper">
              <span className="spinner"></span>
              Recalculating via Backend API...
            </span>
          ) : hasChanges ? (
            "Apply Changes & Recalculate"
          ) : (
            "Sliders Synced with Current Results"
          )}
        </button>

        {hasChanges && (
          <button
            type="button"
            className="btn-outline"
            onClick={handleResetSliders}
            disabled={isRecalculating}
          >
            Reset Sliders
          </button>
        )}

        {hasChanges && (
          <span className="slider-change-alert">
            ⚡ Slider values modified. Click &ldquo;Apply Changes&rdquo; to fetch updated results.
          </span>
        )}
      </div>
    </div>
  );
};
