import { describe, it, expect } from "vitest";
import { validateAssessmentForm, transformFormToPayload, formatCurrency } from "./validation";
import type { AssessmentFormValues } from "../types";

describe("validateAssessmentForm", () => {
  const validValues: AssessmentFormValues = {
    age: "35",
    annual_income_contribution: "600000",
    monthly_household_expenses: "35000",
    dependents_count: "2",
    replacement_years: "15",
    remaining_earning_years: "25",
    outstanding_liabilities: "1500000",
    future_financial_goals: "2000000",
    available_assets: "500000",
    existing_life_insurance: "1000000",
    discount_rate: "5.0",
    annual_premium_budget: "50000",
    risk_preference: "moderate",
    calculation_method: "net_needs",
    primary_objective: "family_protection",
  };

  it("passes validation with complete and valid values", () => {
    const errors = validateAssessmentForm(validValues);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("fails when annual_income_contribution is missing", () => {
    const errors = validateAssessmentForm({ ...validValues, annual_income_contribution: "" });
    expect(errors.annual_income_contribution).toBe("Annual income contribution is required.");
  });

  it("fails when annual_income_contribution is negative", () => {
    const errors = validateAssessmentForm({ ...validValues, annual_income_contribution: "-500" });
    expect(errors.annual_income_contribution).toBe("Income contribution cannot be negative.");
  });

  it("fails when replacement_years is missing", () => {
    const errors = validateAssessmentForm({ ...validValues, replacement_years: "" });
    expect(errors.replacement_years).toBe("Replacement duration in years is required.");
  });

  it("fails when replacement_years is negative", () => {
    const errors = validateAssessmentForm({ ...validValues, replacement_years: "-10" });
    expect(errors.replacement_years).toBe("Replacement years cannot be negative.");
  });

  it("fails when remaining_earning_years is negative", () => {
    const errors = validateAssessmentForm({ ...validValues, remaining_earning_years: "-2" });
    expect(errors.remaining_earning_years).toBe("Remaining earning years cannot be negative.");
  });

  it("fails when liabilities are negative", () => {
    const errors = validateAssessmentForm({ ...validValues, outstanding_liabilities: "-1000" });
    expect(errors.outstanding_liabilities).toBe("Liabilities cannot be negative.");
  });

  it("fails when future goals are negative", () => {
    const errors = validateAssessmentForm({ ...validValues, future_financial_goals: "-2000" });
    expect(errors.future_financial_goals).toBe("Future financial goals cannot be negative.");
  });

  it("fails when available assets are negative", () => {
    const errors = validateAssessmentForm({ ...validValues, available_assets: "-500" });
    expect(errors.available_assets).toBe("Available assets cannot be negative.");
  });

  it("fails when existing life insurance is negative", () => {
    const errors = validateAssessmentForm({ ...validValues, existing_life_insurance: "-1000" });
    expect(errors.existing_life_insurance).toBe("Existing insurance cannot be negative.");
  });

  it("fails when discount rate exceeds 50%", () => {
    const errors = validateAssessmentForm({ ...validValues, discount_rate: "55.0" });
    expect(errors.discount_rate).toBe("Discount rate percentage must be 50% or less.");
  });

  it("fails when non-numeric text is provided", () => {
    const errors = validateAssessmentForm({ ...validValues, annual_income_contribution: "abc" });
    expect(errors.annual_income_contribution).toBe("Please enter a valid numeric amount.");
  });

  it("fails when age is under 18 or over 75", () => {
    const underAgeErrors = validateAssessmentForm({ ...validValues, age: "16" });
    expect(underAgeErrors.age).toBe("Age must be between 18 and 75 years.");

    const overAgeErrors = validateAssessmentForm({ ...validValues, age: "80" });
    expect(overAgeErrors.age).toBe("Age must be between 18 and 75 years.");
  });

  it("fails when dependents count is negative or exceeds 10", () => {
    const negativeDepErrors = validateAssessmentForm({ ...validValues, dependents_count: "-1" });
    expect(negativeDepErrors.dependents_count).toBe("Dependents count cannot be negative.");

    const highDepErrors = validateAssessmentForm({ ...validValues, dependents_count: "15" });
    expect(highDepErrors.dependents_count).toBe("Please enter 10 or fewer dependents.");
  });

  it("fails when monthly expenses or budget is negative", () => {
    const expErrors = validateAssessmentForm({ ...validValues, monthly_household_expenses: "-5000" });
    expect(expErrors.monthly_household_expenses).toBe("Monthly expenses cannot be negative.");

    const budgetErrors = validateAssessmentForm({ ...validValues, annual_premium_budget: "-20000" });
    expect(budgetErrors.annual_premium_budget).toBe("Premium budget cannot be negative.");
  });
});

describe("transformFormToPayload", () => {
  it("correctly converts strings and percentages to API numbers", () => {
    const values: AssessmentFormValues = {
      age: "32",
      annual_income_contribution: "600000",
      monthly_household_expenses: "40000",
      dependents_count: "2",
      replacement_years: "15",
      remaining_earning_years: "25",
      outstanding_liabilities: "1500000",
      future_financial_goals: "2000000",
      available_assets: "500000",
      existing_life_insurance: "1000000",
      discount_rate: "5.0",
      annual_premium_budget: "45000",
      risk_preference: "moderate",
      calculation_method: "net_needs",
      primary_objective: "family_protection",
    };

    const payload = transformFormToPayload(values);
    expect(payload.age).toBe(32);
    expect(payload.dependents_count).toBe(2);
    expect(payload.monthly_household_expenses).toBe(40000);
    expect(payload.annual_income_contribution).toBe(600000);
    expect(payload.replacement_years).toBe(15);
    expect(payload.remaining_earning_years).toBe(25);
    expect(payload.outstanding_liabilities).toBe(1500000);
    expect(payload.future_financial_goals).toBe(2000000);
    expect(payload.available_assets).toBe(500000);
    expect(payload.existing_life_insurance).toBe(1000000);
    expect(payload.discount_rate).toBe(0.05);
    expect(payload.annual_premium_budget).toBe(45000);
    expect(payload.calculation_method).toBe("net_needs");
  });

  it("falls back to defaults for optional empty fields", () => {
    const values: AssessmentFormValues = {
      age: "",
      annual_income_contribution: "300000",
      monthly_household_expenses: "",
      dependents_count: "",
      replacement_years: "10",
      remaining_earning_years: "20",
      outstanding_liabilities: "",
      future_financial_goals: "",
      available_assets: "",
      existing_life_insurance: "",
      discount_rate: "",
      annual_premium_budget: "",
      risk_preference: "moderate",
      calculation_method: "net_needs",
      primary_objective: "family_protection",
    };

    const payload = transformFormToPayload(values);
    expect(payload.age).toBe(35);
    expect(payload.dependents_count).toBe(2);
    expect(payload.monthly_household_expenses).toBeUndefined();
    expect(payload.outstanding_liabilities).toBe(0);
    expect(payload.future_financial_goals).toBe(0);
    expect(payload.available_assets).toBe(0);
    expect(payload.existing_life_insurance).toBe(0);
    expect(payload.discount_rate).toBe(0.05);
    expect(payload.annual_premium_budget).toBe(50000);
  });
});

describe("formatCurrency", () => {
  it("formats numbers with proper thousands separators", () => {
    expect(formatCurrency(1000000)).toBe("1,000,000");
    expect(formatCurrency(8227795.31)).toBe("8,227,795");
    expect(formatCurrency(0)).toBe("0");
  });
});
