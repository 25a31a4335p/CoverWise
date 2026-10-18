import type { AssessmentFormValues, CalculationRequest, FormErrors } from "../types";

/**
 * Validate user input before sending to backend calculation API.
 * All monetary and duration fields must be valid non-negative numbers.
 */
export function validateAssessmentForm(values: AssessmentFormValues): FormErrors {
  const errors: FormErrors = {};

  // 1. Annual Income Contribution (Mandatory)
  if (!values.annual_income_contribution || values.annual_income_contribution.trim() === "") {
    errors.annual_income_contribution = "Annual income contribution is required.";
  } else {
    const val = Number(values.annual_income_contribution);
    if (isNaN(val)) {
      errors.annual_income_contribution = "Please enter a valid numeric amount.";
    } else if (val < 0) {
      errors.annual_income_contribution = "Income contribution cannot be negative.";
    }
  }

  // 2. Replacement Years (Mandatory)
  if (!values.replacement_years || values.replacement_years.trim() === "") {
    errors.replacement_years = "Replacement duration in years is required.";
  } else {
    const val = Number(values.replacement_years);
    if (isNaN(val)) {
      errors.replacement_years = "Please enter a valid number of years.";
    } else if (val < 0) {
      errors.replacement_years = "Replacement years cannot be negative.";
    } else if (val > 100) {
      errors.replacement_years = "Replacement years should be reasonable (e.g. 1 to 50 years).";
    }
  }

  // 3. Remaining Earning Years (Mandatory)
  if (!values.remaining_earning_years || values.remaining_earning_years.trim() === "") {
    errors.remaining_earning_years = "Remaining earning years is required.";
  } else {
    const val = Number(values.remaining_earning_years);
    if (isNaN(val)) {
      errors.remaining_earning_years = "Please enter a valid number of years.";
    } else if (val < 0) {
      errors.remaining_earning_years = "Remaining earning years cannot be negative.";
    } else if (val > 100) {
      errors.remaining_earning_years = "Remaining earning years should be reasonable (e.g. 1 to 50 years).";
    }
  }

  // 4. Outstanding Liabilities (Optional, defaults to 0)
  if (values.outstanding_liabilities && values.outstanding_liabilities.trim() !== "") {
    const val = Number(values.outstanding_liabilities);
    if (isNaN(val)) {
      errors.outstanding_liabilities = "Please enter a valid number (or 0 if no debts).";
    } else if (val < 0) {
      errors.outstanding_liabilities = "Liabilities cannot be negative.";
    }
  }

  // 5. Future Financial Goals (Optional, defaults to 0)
  if (values.future_financial_goals && values.future_financial_goals.trim() !== "") {
    const val = Number(values.future_financial_goals);
    if (isNaN(val)) {
      errors.future_financial_goals = "Please enter a valid number (or 0 if none).";
    } else if (val < 0) {
      errors.future_financial_goals = "Future financial goals cannot be negative.";
    }
  }

  // 6. Available Assets (Optional, defaults to 0)
  if (values.available_assets && values.available_assets.trim() !== "") {
    const val = Number(values.available_assets);
    if (isNaN(val)) {
      errors.available_assets = "Please enter a valid number (or 0 if none).";
    } else if (val < 0) {
      errors.available_assets = "Available assets cannot be negative.";
    }
  }

  // 7. Existing Life Insurance (Optional, defaults to 0)
  if (values.existing_life_insurance && values.existing_life_insurance.trim() !== "") {
    const val = Number(values.existing_life_insurance);
    if (isNaN(val)) {
      errors.existing_life_insurance = "Please enter a valid number (or 0 if none).";
    } else if (val < 0) {
      errors.existing_life_insurance = "Existing insurance cannot be negative.";
    }
  }

  // 8. Discount Rate (Default 5.0%)
  if (values.discount_rate && values.discount_rate.trim() !== "") {
    const val = Number(values.discount_rate);
    if (isNaN(val)) {
      errors.discount_rate = "Please enter a valid discount rate percentage (e.g., 5.0).";
    } else if (val < 0) {
      errors.discount_rate = "Discount rate cannot be negative.";
    } else if (val > 50) {
      errors.discount_rate = "Discount rate percentage must be 50% or less.";
    }
  }

  // 9. Age (Optional or defaults to 35, range 18 to 75)
  if (values.age && values.age.trim() !== "") {
    const val = Number(values.age);
    if (isNaN(val) || !Number.isInteger(val)) {
      errors.age = "Please enter a valid whole number for age.";
    } else if (val < 18 || val > 75) {
      errors.age = "Age must be between 18 and 75 years.";
    }
  }

  // 10. Dependents Count (Optional or defaults to 2, range 0 to 10)
  if (values.dependents_count && values.dependents_count.trim() !== "") {
    const val = Number(values.dependents_count);
    if (isNaN(val) || !Number.isInteger(val)) {
      errors.dependents_count = "Please enter a valid number of dependents.";
    } else if (val < 0) {
      errors.dependents_count = "Dependents count cannot be negative.";
    } else if (val > 10) {
      errors.dependents_count = "Please enter 10 or fewer dependents.";
    }
  }

  // 11. Monthly Household Expenses (Optional)
  if (values.monthly_household_expenses && values.monthly_household_expenses.trim() !== "") {
    const val = Number(values.monthly_household_expenses);
    if (isNaN(val)) {
      errors.monthly_household_expenses = "Please enter a valid numeric amount.";
    } else if (val < 0) {
      errors.monthly_household_expenses = "Monthly expenses cannot be negative.";
    }
  }

  // 12. Annual Premium Budget (Optional, defaults to 50,000)
  if (values.annual_premium_budget && values.annual_premium_budget.trim() !== "") {
    const val = Number(values.annual_premium_budget);
    if (isNaN(val)) {
      errors.annual_premium_budget = "Please enter a valid premium budget.";
    } else if (val < 0) {
      errors.annual_premium_budget = "Premium budget cannot be negative.";
    }
  }

  return errors;
}

/**
 * Transform validated form string values into clean numbers for the API
 */
export function transformFormToPayload(values: AssessmentFormValues): CalculationRequest {
  const discountRatePercent = values.discount_rate ? Number(values.discount_rate) : 5.0;
  // Convert percentage (e.g. 5.0%) to decimal (0.05)
  const discountRateDecimal = Number((discountRatePercent / 100).toFixed(4));

  const age = values.age ? Number(values.age) : 35;
  const dependentsCount = values.dependents_count !== undefined && values.dependents_count.trim() !== ""
    ? Number(values.dependents_count)
    : 2;
  const monthlyExpenses = values.monthly_household_expenses && values.monthly_household_expenses.trim() !== ""
    ? Number(values.monthly_household_expenses)
    : undefined;
  const budget = values.annual_premium_budget && values.annual_premium_budget.trim() !== ""
    ? Number(values.annual_premium_budget)
    : 50000;

  return {
    age,
    annual_income_contribution: Number(values.annual_income_contribution),
    monthly_household_expenses: monthlyExpenses,
    dependents_count: dependentsCount,
    replacement_years: Number(values.replacement_years),
    remaining_earning_years: Number(values.remaining_earning_years),
    outstanding_liabilities: values.outstanding_liabilities ? Number(values.outstanding_liabilities) : 0,
    future_financial_goals: values.future_financial_goals ? Number(values.future_financial_goals) : 0,
    available_assets: values.available_assets ? Number(values.available_assets) : 0,
    existing_life_insurance: values.existing_life_insurance ? Number(values.existing_life_insurance) : 0,
    discount_rate: discountRateDecimal,
    annual_premium_budget: budget,
    risk_preference: values.risk_preference || "moderate",
    calculation_method: values.calculation_method || "net_needs",
  };
}

/**
 * Helper to format monetary values with grouping separators
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}
