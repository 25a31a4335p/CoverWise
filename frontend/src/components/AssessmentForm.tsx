import React, { useState } from "react";
import type {
  AssessmentFormValues,
  FormErrors,
  CalculationRequest,
  PrimaryObjective,
  RiskPreference,
  CalculationMethod,
} from "../types";
import { validateAssessmentForm, transformFormToPayload } from "../utils/validation";

interface AssessmentFormProps {
  onSubmit: (payload: CalculationRequest, objective: PrimaryObjective) => Promise<void>;
  isLoading: boolean;
}

const INITIAL_VALUES: AssessmentFormValues = {
  age: "35",
  annual_income_contribution: "",
  monthly_household_expenses: "",
  dependents_count: "2",
  replacement_years: "",
  remaining_earning_years: "",
  outstanding_liabilities: "0",
  future_financial_goals: "0",
  available_assets: "0",
  existing_life_insurance: "0",
  discount_rate: "5.0",
  annual_premium_budget: "50000",
  risk_preference: "moderate",
  calculation_method: "net_needs",
  primary_objective: "family_protection",
};

// 5 Rich Scenario Presets for Hackathon Edge-Case Demonstration
interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  values: AssessmentFormValues;
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "young_family_mortgage",
    label: "Young Family with Home Loan",
    description: "Age 28, 2 dependents, high debt, future education goals.",
    values: {
      age: "28",
      annual_income_contribution: "800000",
      monthly_household_expenses: "45000",
      dependents_count: "2",
      replacement_years: "20",
      remaining_earning_years: "32",
      outstanding_liabilities: "2500000",
      future_financial_goals: "1500000",
      available_assets: "300000",
      existing_life_insurance: "500000",
      discount_rate: "5.0",
      annual_premium_budget: "45000",
      risk_preference: "moderate",
      calculation_method: "net_needs",
      primary_objective: "family_protection",
    },
  },
  {
    id: "single_no_dependents",
    label: "Single Professional (0 Dependents)",
    description: "Age 26, debt-free, no dependents. Minimal insurance need.",
    values: {
      age: "26",
      annual_income_contribution: "900000",
      monthly_household_expenses: "30000",
      dependents_count: "0",
      replacement_years: "0",
      remaining_earning_years: "34",
      outstanding_liabilities: "0",
      future_financial_goals: "0",
      available_assets: "400000",
      existing_life_insurance: "0",
      discount_rate: "5.0",
      annual_premium_budget: "30000",
      risk_preference: "aggressive",
      calculation_method: "net_needs",
      primary_objective: "market_wealth",
    },
  },
  {
    id: "substantially_insured",
    label: "Substantially Covered Earner",
    description: "Age 42, 2 dependents, ₹1.5 Cr active policies. Surplus assets.",
    values: {
      age: "42",
      annual_income_contribution: "1200000",
      monthly_household_expenses: "60000",
      dependents_count: "2",
      replacement_years: "15",
      remaining_earning_years: "18",
      outstanding_liabilities: "1000000",
      future_financial_goals: "1000000",
      available_assets: "2000000",
      existing_life_insurance: "15000000",
      discount_rate: "5.0",
      annual_premium_budget: "100000",
      risk_preference: "conservative",
      calculation_method: "net_needs",
      primary_objective: "guaranteed_savings",
    },
  },
  {
    id: "heavy_liabilities",
    label: "High Debt Deficit (3 Dependents)",
    description: "Age 34, 3 dependents, ₹40L liabilities, low assets.",
    values: {
      age: "34",
      annual_income_contribution: "700000",
      monthly_household_expenses: "40000",
      dependents_count: "3",
      replacement_years: "18",
      remaining_earning_years: "26",
      outstanding_liabilities: "4000000",
      future_financial_goals: "1500000",
      available_assets: "200000",
      existing_life_insurance: "0",
      discount_rate: "5.0",
      annual_premium_budget: "35000",
      risk_preference: "moderate",
      calculation_method: "net_needs",
      primary_objective: "family_protection",
    },
  },
  {
    id: "low_budget",
    label: "Limited Annual Budget",
    description: "Age 30, 2 dependents, ₹12,000/yr budget constraint.",
    values: {
      age: "30",
      annual_income_contribution: "400000",
      monthly_household_expenses: "25000",
      dependents_count: "2",
      replacement_years: "15",
      remaining_earning_years: "30",
      outstanding_liabilities: "800000",
      future_financial_goals: "500000",
      available_assets: "50000",
      existing_life_insurance: "0",
      discount_rate: "5.0",
      annual_premium_budget: "12000",
      risk_preference: "conservative",
      calculation_method: "net_needs",
      primary_objective: "family_protection",
    },
  },
];

export const AssessmentForm: React.FC<AssessmentFormProps> = ({ onSubmit, isLoading }) => {
  const [values, setValues] = useState<AssessmentFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (field: keyof AssessmentFormValues, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-suggest remaining earning years if age changes and remaining years not manually set
      if (field === "age") {
        const numAge = Number(value);
        if (!isNaN(numAge) && numAge >= 18 && numAge <= 70) {
          if (!prev.remaining_earning_years || prev.remaining_earning_years === String(Math.max(0, 60 - Number(prev.age)))) {
            next.remaining_earning_years = String(Math.max(0, 60 - numAge));
          }
        }
      }
      return next;
    });

    // Clear field-specific error as user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateAssessmentForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const payload = transformFormToPayload(values);
    await onSubmit(payload, values.primary_objective);
  };

  const handleApplyPreset = (preset: ScenarioPreset) => {
    setValues(preset.values);
    setErrors({});
  };

  const handleReset = () => {
    setValues(INITIAL_VALUES);
    setErrors({});
  };

  const isZeroDependents = Number(values.dependents_count) === 0;

  return (
    <form className="assessment-form" onSubmit={handleSubmit} noValidate>
      {/* Editorial Header & Preset Selector Desk */}
      <div className="form-intro-card">
        <div className="form-intro-header">
          <div className="form-intro-tag">01 / Input Ledger</div>
          <h2 className="form-intro-title">Financial Needs Assessment</h2>
          <p className="form-intro-subtitle">
            Enter your exact household financial details below, or select a pre-calibrated scenario to evaluate how debt obligations, dependents, and asset allocations influence the Net Needs gap.
          </p>
        </div>

        {/* Quick Scenario Presets Desk */}
        <div className="scenario-presets-panel">
          <div className="presets-bar-header">
            <span className="presets-badge-title">⚡ Pre-Configured Test Scenarios</span>
            <span className="presets-badge-sub">Click to load realistic benchmark data</span>
          </div>
          <div className="presets-pill-list">
            {SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="btn-preset-card"
                onClick={() => handleApplyPreset(preset)}
                disabled={isLoading}
              >
                <div className="preset-card-top">
                  <span className="preset-badge-tag">
                    {preset.id === "young_family_mortgage" && "Family & Debt"}
                    {preset.id === "single_no_dependents" && "0 Dependents"}
                    {preset.id === "substantially_insured" && "Surplus Cover"}
                    {preset.id === "heavy_liabilities" && "High Debt"}
                    {preset.id === "limited_budget" && "Tight Budget"}
                  </span>
                </div>
                <div className="preset-card-name">{preset.label}</div>
                <div className="preset-card-desc">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="currency-notice">
          <span className="notice-icon" aria-hidden="true">ℹ️</span>
          <span>
            <strong>Currency Guidance:</strong> Use the same currency (e.g. ₹ INR) consistently across all fields. Enter raw numbers without commas or symbols (e.g. enter <code>600000</code> for ₹6 Lakhs).
          </span>
        </div>
      </div>

      {/* SECTION 1: Customer Profile & Objective */}
      <div className="form-section">
        <div className="section-header">
          <div className="section-badge">1</div>
          <div>
            <h3 className="section-heading">Customer Profile & Objectives</h3>
            <p className="section-subtext">
              Demographic details, family structure, risk tolerance, and evaluation methodology.
            </p>
          </div>
        </div>

        <div className="form-grid three-columns">
          {/* Customer Age */}
          <div className={`form-group ${errors.age ? "has-error" : ""}`}>
            <label htmlFor="age" className="field-label">
              Customer Current Age (Years) <span className="required-star">*</span>
            </label>
            <p className="field-helper">Age between 18 and 75 years.</p>
            <input
              id="age"
              type="number"
              min="18"
              max="75"
              step="1"
              className="field-input"
              placeholder="e.g. 35"
              value={values.age}
              onChange={(e) => handleChange("age", e.target.value)}
              disabled={isLoading}
            />
            {errors.age && <span className="field-error">{errors.age}</span>}
          </div>

          {/* Dependents Count */}
          <div className={`form-group ${errors.dependents_count ? "has-error" : ""}`}>
            <label htmlFor="dependents_count" className="field-label">
              Financially Dependent Members <span className="required-star">*</span>
            </label>
            <p className="field-helper">Spouse, children, or dependent parents (0-10).</p>
            <input
              id="dependents_count"
              type="number"
              min="0"
              max="10"
              step="1"
              className="field-input"
              placeholder="e.g. 2"
              value={values.dependents_count}
              onChange={(e) => handleChange("dependents_count", e.target.value)}
              disabled={isLoading}
            />
            {errors.dependents_count && <span className="field-error">{errors.dependents_count}</span>}
            {isZeroDependents && (
              <span className="field-hint-notice">
                ℹ️ 0 Dependents: Living income support need will be calculated as ₹0.
              </span>
            )}
          </div>

          {/* Primary Objective */}
          <div className="form-group">
            <label htmlFor="primary_objective" className="field-label">
              Primary Objective <span className="required-star">*</span>
            </label>
            <p className="field-helper">Core goal for life insurance.</p>
            <select
              id="primary_objective"
              className="field-input field-select"
              value={values.primary_objective}
              onChange={(e) => handleChange("primary_objective", e.target.value as PrimaryObjective)}
              disabled={isLoading}
            >
              <option value="family_protection">Family protection & debt coverage</option>
              <option value="guaranteed_savings">Guaranteed milestone savings</option>
              <option value="market_wealth">Market-linked wealth creation</option>
              <option value="legacy_planning">Lifelong protection & legacy</option>
            </select>
          </div>
        </div>

        <div className="form-grid two-columns" style={{ marginTop: "1rem" }}>
          {/* Risk Preference */}
          <div className="form-group">
            <label htmlFor="risk_preference" className="field-label">
              Risk Appetite / Preference
            </label>
            <p className="field-helper">Guides product category suitability (Endowment vs ULIP).</p>
            <select
              id="risk_preference"
              className="field-input field-select"
              value={values.risk_preference}
              onChange={(e) => handleChange("risk_preference", e.target.value as RiskPreference)}
              disabled={isLoading}
            >
              <option value="conservative">Conservative (Capital preservation, zero equity risk)</option>
              <option value="moderate">Moderate (Balanced risk, pure protection + stable savings)</option>
              <option value="aggressive">Aggressive (Long-term equity market growth)</option>
            </select>
          </div>

          {/* Calculation Methodology Selector */}
          <div className="form-group">
            <label htmlFor="calculation_method" className="field-label">
              Primary Calculation Method
            </label>
            <p className="field-helper">Choose which method drives the primary coverage target.</p>
            <select
              id="calculation_method"
              className="field-input field-select"
              value={values.calculation_method}
              onChange={(e) => handleChange("calculation_method", e.target.value as CalculationMethod)}
              disabled={isLoading}
            >
              <option value="net_needs">Net Needs Approach (Liabilities + Goals + Living Costs &minus; Resources)</option>
              <option value="hlv">Human Life Value (HLV) (Economic Earning Capacity Benchmark)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: Household Living Support & Income */}
      <div className="form-section">
        <div className="section-header">
          <div className="section-badge">2</div>
          <div>
            <h3 className="section-heading">Household Living Support & Income</h3>
            <p className="section-subtext">
              Income allocated to family living expenses and monthly household outflow.
            </p>
          </div>
        </div>

        <div className="form-grid two-columns">
          <div className={`form-group ${errors.annual_income_contribution ? "has-error" : ""}`}>
            <label htmlFor="annual_income_contribution" className="field-label">
              Annual Household Income Contribution <span className="required-star">*</span>
            </label>
            <p className="field-helper">
              Annual take-home earnings allocated to family living, groceries, rent, and dependent care (excluding your own personal spending).
            </p>
            <input
              id="annual_income_contribution"
              type="number"
              min="0"
              step="any"
              className="field-input"
              placeholder="e.g. 600000"
              value={values.annual_income_contribution}
              onChange={(e) => handleChange("annual_income_contribution", e.target.value)}
              disabled={isLoading}
            />
            {errors.annual_income_contribution && (
              <span className="field-error">{errors.annual_income_contribution}</span>
            )}
          </div>

          <div className={`form-group ${errors.monthly_household_expenses ? "has-error" : ""}`}>
            <label htmlFor="monthly_household_expenses" className="field-label">
              Monthly Household Expenses (Optional)
            </label>
            <p className="field-helper">
              Estimated monthly household living expenses (used to evaluate or cross-check annual living support).
            </p>
            <input
              id="monthly_household_expenses"
              type="number"
              min="0"
              step="any"
              className="field-input"
              placeholder="e.g. 35000"
              value={values.monthly_household_expenses}
              onChange={(e) => handleChange("monthly_household_expenses", e.target.value)}
              disabled={isLoading}
            />
            {errors.monthly_household_expenses && (
              <span className="field-error">{errors.monthly_household_expenses}</span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: Family Obligations & Debts */}
      <div className="form-section">
        <div className="section-header">
          <div className="section-badge">3</div>
          <div>
            <h3 className="section-heading">Family Obligations & Debts</h3>
            <p className="section-subtext">
              Debts that would need immediate settlement, and targeted future life milestones.
            </p>
          </div>
        </div>

        <div className="form-grid two-columns">
          <div className={`form-group ${errors.outstanding_liabilities ? "has-error" : ""}`}>
            <label htmlFor="outstanding_liabilities" className="field-label">
              Outstanding Liabilities & Loans
            </label>
            <p className="field-helper">
              Total debt you currently owe that would burden your family (e.g. home mortgage, car loan, personal loans). Enter 0 if none.
            </p>
            <input
              id="outstanding_liabilities"
              type="number"
              min="0"
              step="any"
              className="field-input"
              placeholder="0 if debt-free"
              value={values.outstanding_liabilities}
              onChange={(e) => handleChange("outstanding_liabilities", e.target.value)}
              disabled={isLoading}
            />
            {errors.outstanding_liabilities && (
              <span className="field-error">{errors.outstanding_liabilities}</span>
            )}
          </div>

          <div className={`form-group ${errors.future_financial_goals ? "has-error" : ""}`}>
            <label htmlFor="future_financial_goals" className="field-label">
              Future Financial Milestone Goals
            </label>
            <p className="field-helper">
              Lump sums needed for major milestones (children&apos;s higher education, marriage, or family emergency buffer). Enter 0 if none.
            </p>
            <input
              id="future_financial_goals"
              type="number"
              min="0"
              step="any"
              className="field-input"
              placeholder="0 if none"
              value={values.future_financial_goals}
              onChange={(e) => handleChange("future_financial_goals", e.target.value)}
              disabled={isLoading}
            />
            {errors.future_financial_goals && (
              <span className="field-error">{errors.future_financial_goals}</span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: Existing Financial Resources */}
      <div className="form-section">
        <div className="section-header">
          <div className="section-badge">4</div>
          <div>
            <h3 className="section-heading">Existing Financial Resources</h3>
            <p className="section-subtext">
              Resources you already have that directly reduce the new life cover you need.
            </p>
          </div>
        </div>

        <div className="form-grid two-columns">
          <div className={`form-group ${errors.available_assets ? "has-error" : ""}`}>
            <label htmlFor="available_assets" className="field-label">
              Available Liquid Savings & Designated Assets
            </label>
            <p className="field-helper">
              Liquid savings (bank deposits, mutual funds) your family could easily tap into. Do not include your primary residence. Enter 0 if none.
            </p>
            <input
              id="available_assets"
              type="number"
              min="0"
              step="any"
              className="field-input"
              placeholder="0 if none"
              value={values.available_assets}
              onChange={(e) => handleChange("available_assets", e.target.value)}
              disabled={isLoading}
            />
            {errors.available_assets && (
              <span className="field-error">{errors.available_assets}</span>
            )}
          </div>

          <div className={`form-group ${errors.existing_life_insurance ? "has-error" : ""}`}>
            <label htmlFor="existing_life_insurance" className="field-label">
              Existing Life Insurance Cover
            </label>
            <p className="field-helper">
              Total active sum assured across existing policies. Subtracted from obligations so you never overpay. Enter 0 if none.
            </p>
            <input
              id="existing_life_insurance"
              type="number"
              min="0"
              step="any"
              className="field-input"
              placeholder="0 if none"
              value={values.existing_life_insurance}
              onChange={(e) => handleChange("existing_life_insurance", e.target.value)}
              disabled={isLoading}
            />
            {errors.existing_life_insurance && (
              <span className="field-error">{errors.existing_life_insurance}</span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 5: Time Horizon, Budget & Economic Parameters */}
      <div className="form-section">
        <div className="section-header">
          <div className="section-badge">5</div>
          <div>
            <h3 className="section-heading">Time Horizon, Budget & Economic Assumptions</h3>
            <p className="section-subtext">
              Duration of income support, planned retirement horizon, annual budget, and real discount rate.
            </p>
          </div>
        </div>

        <div className="form-grid four-columns">
          <div className={`form-group ${errors.replacement_years ? "has-error" : ""}`}>
            <label htmlFor="replacement_years" className="field-label">
              Income Replacement (Yrs) <span className="required-star">*</span>
            </label>
            <p className="field-helper">Years dependents need support (e.g. until youngest child graduates).</p>
            <input
              id="replacement_years"
              type="number"
              min="0"
              max="100"
              step="any"
              className="field-input"
              placeholder="e.g. 15"
              value={values.replacement_years}
              onChange={(e) => handleChange("replacement_years", e.target.value)}
              disabled={isLoading}
            />
            {errors.replacement_years && (
              <span className="field-error">{errors.replacement_years}</span>
            )}
          </div>

          <div className={`form-group ${errors.remaining_earning_years ? "has-error" : ""}`}>
            <label htmlFor="remaining_earning_years" className="field-label">
              Earning Years (to Retire) <span className="required-star">*</span>
            </label>
            <p className="field-helper">Years until planned retirement (Retirement Age &minus; Current Age).</p>
            <input
              id="remaining_earning_years"
              type="number"
              min="0"
              max="100"
              step="any"
              className="field-input"
              placeholder="e.g. 25"
              value={values.remaining_earning_years}
              onChange={(e) => handleChange("remaining_earning_years", e.target.value)}
              disabled={isLoading}
            />
            {errors.remaining_earning_years && (
              <span className="field-error">{errors.remaining_earning_years}</span>
            )}
          </div>

          <div className={`form-group ${errors.annual_premium_budget ? "has-error" : ""}`}>
            <label htmlFor="annual_premium_budget" className="field-label">
              Annual Premium Budget
            </label>
            <p className="field-helper">Estimated annual budget for life insurance premiums.</p>
            <input
              id="annual_premium_budget"
              type="number"
              min="0"
              step="any"
              className="field-input"
              placeholder="e.g. 50000"
              value={values.annual_premium_budget}
              onChange={(e) => handleChange("annual_premium_budget", e.target.value)}
              disabled={isLoading}
            />
            {errors.annual_premium_budget && (
              <span className="field-error">{errors.annual_premium_budget}</span>
            )}
          </div>

          <div className={`form-group ${errors.discount_rate ? "has-error" : ""}`}>
            <label htmlFor="discount_rate" className="field-label">
              Real Discount Rate (%)
            </label>
            <p className="field-helper">Conservative net real return above inflation (default 5.0%).</p>
            <input
              id="discount_rate"
              type="number"
              min="0"
              max="50"
              step="0.1"
              className="field-input"
              placeholder="5.0"
              value={values.discount_rate}
              onChange={(e) => handleChange("discount_rate", e.target.value)}
              disabled={isLoading}
            />
            {errors.discount_rate && (
              <span className="field-error">{errors.discount_rate}</span>
            )}
          </div>
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="form-actions">
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="btn-loading-wrapper">
              <span className="spinner"></span>
              Calculating Optimal Cover...
            </span>
          ) : (
            "Calculate Life Cover Needs"
          )}
        </button>

        <button
          type="button"
          className="btn-outline"
          onClick={handleReset}
          disabled={isLoading}
        >
          Clear Form
        </button>
      </div>
    </form>
  );
};
