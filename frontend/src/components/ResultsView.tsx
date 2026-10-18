import React from "react";
import type { CalculationResponse, CalculationRequest, PrimaryObjective } from "../types";
import { formatCurrency } from "../utils/validation";
import { FinancialBreakdownChart } from "./FinancialBreakdownChart";
import { InteractiveSliders } from "./InteractiveSliders";
import { CoverageTenureControls } from "./CoverageTenureControls";
import { PolicyRecommendations } from "./PolicyRecommendations";
import { AdvisoryConsultation } from "./AdvisoryConsultation";

interface ResultsViewProps {
  data: CalculationResponse;
  currentPayload: CalculationRequest;
  primaryObjective: PrimaryObjective;
  onEdit: () => void;
  onRecalculate: (updatedPayload: CalculationRequest) => Promise<void>;
  isRecalculating: boolean;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  data,
  currentPayload,
  primaryObjective,
  onEdit,
  onRecalculate,
  isRecalculating,
}) => {
  const { net_needs, human_life_value, assumptions } = data;
  const isHLVSelected = (currentPayload.calculation_method || "net_needs") === "hlv";

  const handleToggleMethod = async (method: "net_needs" | "hlv") => {
    if (currentPayload.calculation_method === method) return;
    await onRecalculate({
      ...currentPayload,
      calculation_method: method,
    });
  };

  const hlvNetGap = human_life_value.net_gap_hlv !== undefined
    ? human_life_value.net_gap_hlv
    : Math.max(0, human_life_value.hlv_estimate - net_needs.existing_life_insurance);

  return (
    <div className="results-container" id="coverage-results">
      {/* Top Banner & Navigation */}
      <div className="results-header-card">
        <div className="results-header-meta">
          <span className="results-pill">Assessment Results & Dashboard</span>
          <h2 className="results-title">Your Personalized Life Insurance Dashboard</h2>
          <p className="results-subtitle">
            Transparent breakdown of family obligations, liquid resources, and earning capacity benchmark.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={onEdit}>
          &larr; Edit Full Assessment
        </button>
      </div>

      {/* Methodology Switcher Strip */}
      <div className="method-switcher-card">
        <div className="method-switcher-info">
          <span className="method-switcher-title">Selected Calculation Methodology:</span>
          <span className="method-switcher-desc">
            Toggle between the two distinct valuation models to compare their financial logic.
          </span>
        </div>
        <div className="method-buttons-row">
          <button
            type="button"
            className={`btn-method-toggle ${!isHLVSelected ? "active" : ""}`}
            onClick={() => handleToggleMethod("net_needs")}
            disabled={isRecalculating}
            aria-pressed={!isHLVSelected}
          >
            <span className="method-toggle-icon">📊</span>
            <div>
              <strong>Net Needs Approach</strong>
              <div className="btn-method-sub">Debts + Goals + Living Costs &minus; Resources</div>
            </div>
          </button>

          <button
            type="button"
            className={`btn-method-toggle ${isHLVSelected ? "active" : ""}`}
            onClick={() => handleToggleMethod("hlv")}
            disabled={isRecalculating}
            aria-pressed={isHLVSelected}
          >
            <span className="method-toggle-icon">📈</span>
            <div>
              <strong>Human Life Value (HLV)</strong>
              <div className="btn-method-sub">Lifetime Economic Earning Capacity Benchmark</div>
            </div>
          </button>
        </div>
      </div>

      {/* Clamped to zero notice if applicable */}
      {net_needs.is_clamped_to_zero && !isHLVSelected && (
        <div className="clamped-alert">
          <div className="alert-icon">🛡️</div>
          <div className="alert-content">
            <h4 className="alert-title">Family Is Fully Protected!</h4>
            <p className="alert-text">
              Your available liquid assets and existing life insurance total{" "}
              <strong>{formatCurrency(net_needs.total_resources)}</strong>, which fully satisfies your family&apos;s total calculated obligations of{" "}
              <strong>{formatCurrency(net_needs.total_obligations)}</strong>. Because your existing resources exceed your obligations by{" "}
              <strong>{formatCurrency(Math.abs(net_needs.raw_net_cover))}</strong>, your recommended additional cover is clamped to <strong>0</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Zero Dependents Notice if applicable */}
      {currentPayload.dependents_count === 0 && (
        <div className="zero-dependents-alert">
          <div className="alert-icon">👤</div>
          <div className="alert-content">
            <h4 className="alert-title">Zero Financial Dependents Profile</h4>
            <p className="alert-text">
              Because you have no financial dependents relying on your income for living expenses, your living income replacement obligation is <strong>₹0</strong>. Your life insurance requirement is strictly limited to eliminating any outstanding liabilities and funding specific milestone goals.
            </p>
          </div>
        </div>
      )}

      {/* Core Side-by-Side Cards: Net Needs vs Human Life Value */}
      <div className="results-grid">
        {/* Metric 1: Net Needs Recommended Cover */}
        <div className={`result-card primary-card ${!isHLVSelected ? "method-active" : ""}`}>
          <div className="card-top-tag">
            {!isHLVSelected ? "★ Active Primary Method" : "Liabilities & Debt Approach"}
          </div>
          <div className="card-heading-row">
            <h3 className="card-metric-title">Net Needs Recommended Life Cover</h3>
            <span className="badge-method">Net Needs Method</span>
          </div>

          <div className="metric-amount">
            {formatCurrency(net_needs.recommended_cover)}
          </div>
          <p className="metric-caption">
            {net_needs.is_clamped_to_zero
              ? "0 additional cover needed (Fully covered by assets & existing insurance)"
              : "Exact additional insurance cover needed to guarantee your family's future"}
          </p>

          <hr className="card-divider" />

          {/* Breakdown of Net Needs */}
          <div className="breakdown-list">
            <div className="breakdown-row highlight-row">
              <span className="breakdown-label">Total Obligations:</span>
              <span className="breakdown-val">{formatCurrency(net_needs.total_obligations)}</span>
            </div>
            <div className="breakdown-subrow">
              <span>&bull; Outstanding Debts / Liabilities:</span>
              <span>{formatCurrency(net_needs.outstanding_liabilities)}</span>
            </div>
            <div className="breakdown-subrow">
              <span>&bull; Future Milestone Goals:</span>
              <span>{formatCurrency(net_needs.future_financial_goals)}</span>
            </div>
            <div className="breakdown-subrow">
              <span>&bull; Present Value of Income Replacement ({net_needs.replacement_years} yrs):</span>
              <span>{formatCurrency(net_needs.pv_income_replacement)}</span>
            </div>

            <div className="breakdown-row highlight-row" style={{ marginTop: "0.75rem" }}>
              <span className="breakdown-label">Less Total Resources:</span>
              <span className="breakdown-val">&minus; {formatCurrency(net_needs.total_resources)}</span>
            </div>
            <div className="breakdown-subrow">
              <span>&bull; Available Liquid Savings & Assets:</span>
              <span>{formatCurrency(net_needs.available_assets)}</span>
            </div>
            <div className="breakdown-subrow">
              <span>&bull; Existing Life Insurance Sum Assured:</span>
              <span>{formatCurrency(net_needs.existing_life_insurance)}</span>
            </div>

            <div className="breakdown-row final-gap-row">
              <span>Net Coverage Gap (Uninsured Need):</span>
              <span>{formatCurrency(net_needs.recommended_cover)}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Human Life Value Benchmark */}
        <div className={`result-card benchmark-card ${isHLVSelected ? "method-active" : ""}`}>
          <div className="card-top-tag">
            {isHLVSelected ? "★ Active Primary Method" : "Economic Earning Benchmark"}
          </div>
          <div className="card-heading-row">
            <h3 className="card-metric-title">Human Life Value (HLV)</h3>
            <span className="badge-benchmark">Income Benchmark</span>
          </div>

          <div className="metric-amount benchmark-amount">
            {formatCurrency(human_life_value.hlv_estimate)}
          </div>
          <p className="metric-caption">
            Present economic value of income support over {human_life_value.remaining_earning_years} remaining working years.
          </p>

          <hr className="card-divider" />

          {/* HLV Deductions and Net Gap */}
          <div className="breakdown-list">
            <div className="breakdown-row highlight-row">
              <span className="breakdown-label">Gross Human Life Value:</span>
              <span className="breakdown-val">{formatCurrency(human_life_value.hlv_estimate)}</span>
            </div>
            <div className="breakdown-subrow">
              <span>&bull; Less Existing Life Insurance:</span>
              <span>&minus; {formatCurrency(net_needs.existing_life_insurance)}</span>
            </div>
            <div className="breakdown-row final-gap-row">
              <span>Uninsured HLV Gap:</span>
              <span>{formatCurrency(hlvNetGap)}</span>
            </div>
          </div>

          {/* Crucial Explanation of Distinction */}
          <div className="hlv-explainer-box">
            <h4 className="explainer-heading">Why is HLV different from Net Needs?</h4>
            <p className="explainer-body">
              <strong>Human Life Value (HLV)</strong> measures the present value of your lifetime economic earning power for dependents until retirement. It treats earning capacity as an economic asset.
            </p>
            <p className="explainer-body">
              In contrast, the <strong>Net Needs Approach</strong> analyzes your specific debts, future milestone goals, and designated liquid assets to calculate the precise dollar gap needed to balance the family balance sheet.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Recharts Financial Breakdown */}
      <FinancialBreakdownChart netNeeds={net_needs} />

      {/* Unified Policy Workshop & Interactive Simulation Lab */}
      <section className="policy-workshop-section" id="policy-lab-section">
        <div className="section-masthead">
          <div className="masthead-badge">03 / Interactive Policy Lab</div>
          <h3 className="masthead-title">Stress-Test &amp; Tailor Your Coverage Parameters</h3>
          <p className="masthead-subtext">
            Simulate how varying household income support, retirement timelines, coverage amounts, and annual premium budgets alter your optimal policy structure.
          </p>
        </div>

        <div className="policy-lab-grid">
          {/* Part A: Macro Economic Parameters & What-If Sliders */}
          <div className="policy-lab-col">
            <InteractiveSliders
              key={`${currentPayload.annual_income_contribution}-${currentPayload.replacement_years}-${currentPayload.remaining_earning_years}-${currentPayload.discount_rate}`}
              currentPayload={currentPayload}
              currentNetNeeds={net_needs}
              currentHLV={human_life_value}
              onRecalculate={onRecalculate}
              isRecalculating={isRecalculating}
            />
          </div>

          {/* Part B: Policy Customization, Tenure & Benchmark Affordability */}
          <div className="policy-lab-col">
            <CoverageTenureControls
              key={`${net_needs.recommended_cover}-${net_needs.replacement_years}-${human_life_value.remaining_earning_years}-${currentPayload.annual_premium_budget}`}
              netNeeds={net_needs}
              hlv={human_life_value}
              age={currentPayload.age || 35}
              initialBudget={currentPayload.annual_premium_budget || 50000}
            />
          </div>
        </div>
      </section>

      {/* Rule-Based Policy Recommendations */}
      <div id="recommendations-section">
        <PolicyRecommendations
          initialObjective={primaryObjective}
          netNeeds={net_needs}
          hlv={human_life_value}
          age={currentPayload.age || 35}
          annualBudget={currentPayload.annual_premium_budget || 50000}
          riskPreference={currentPayload.risk_preference || "moderate"}
          dependents={currentPayload.dependents_count !== undefined ? currentPayload.dependents_count : 2}
        />
      </div>

      {/* Phase 5: Educational Advisory Consultation & Appointment Booking */}
      <div id="advisory-section">
        <AdvisoryConsultation
          netNeeds={net_needs}
          hlv={human_life_value}
          objective={primaryObjective}
        />
      </div>

      {/* Assumptions & Disclosures Card */}
      <div className="assumptions-card">
        <h4 className="assumptions-title">
          <span>🔍</span> Calculation Assumptions & Disclosures
        </h4>
        <div className="assumptions-grid">
          <div className="assumption-item">
            <span className="assumption-label">Customer Profile:</span>
            <span className="assumption-value">
              Age {currentPayload.age || 35} &bull; {currentPayload.dependents_count ?? 2} Dependents
            </span>
            <span className="assumption-subtext">
              Budget: {formatCurrency(currentPayload.annual_premium_budget || 50000)}/yr &bull; Risk: {currentPayload.risk_preference || "moderate"}
            </span>
          </div>

          <div className="assumption-item">
            <span className="assumption-label">Real Discount Rate:</span>
            <span className="assumption-value">{assumptions.discount_rate_percentage} annual</span>
            <span className="assumption-subtext">Models conservative investment returns above inflation.</span>
          </div>

          <div className="assumption-item">
            <span className="assumption-label">Net Needs Formula:</span>
            <span className="assumption-value font-mono">
              Max(0, Debts + Goals + PV(Income) - Assets - Existing Cover)
            </span>
          </div>

          <div className="assumption-item">
            <span className="assumption-label">HLV Formula:</span>
            <span className="assumption-value font-mono">
              PV(Income Support, {human_life_value.remaining_earning_years} yrs, {assumptions.discount_rate_percentage})
            </span>
          </div>
        </div>

        <div className="educational-disclaimer-panel" style={{ marginTop: "1rem" }}>
          <span>⚖️</span>
          <p>
            <strong>Responsible Educational Disclosure:</strong> CoverWise provides mathematical scenario modeling for consumer financial education. Figures are not binding insurance quotations and do not replace regulated financial advice. Real policy pricing and underwriting approval depend on verified medical underwriting, lifestyle declarations, smoker status, and insurer product filing terms.
          </p>
        </div>
      </div>
    </div>
  );
};
