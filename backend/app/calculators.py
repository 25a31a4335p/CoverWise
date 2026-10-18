"""
CoverWise Financial Calculation Engine
=====================================
Dedicated, pure Python module for calculating life insurance needs.

Contains two core financial methodologies:
1. Net Needs Approach:
   Required Cover = Outstanding Liabilities + Future Financial Goals
                    + Present Value of Income Replacement
                    - Available Assets - Existing Life Insurance
   Clamped to >= 0 (no negative required coverage).

2. Human Life Value (HLV) Benchmark:
   Economic value of the individual's future earning capacity for dependents,
   evaluated as the present value of income contribution over remaining earning years.

Assumptions:
- Discount Rate: Models the net real return on a conservative investment portfolio
  over the projection period. Default assumption is 5.0% annual (0.05).
- If discount rate is 0.0, present value reduces to simple linear sum (Amount * Years).
- Boundary conditions (0 income, 0 years, discount rate = 0) are handled safely without division by zero.
- All monetary inputs must be non-negative.
"""

from typing import Dict, Any, NamedTuple


from typing import Dict, Any, NamedTuple, Optional
import math


class NetNeedsBreakdown(NamedTuple):
    outstanding_liabilities: float
    future_financial_goals: float
    annual_income_contribution: float
    monthly_household_expenses: Optional[float]
    dependents_count: int
    replacement_years: float
    pv_income_replacement: float
    total_obligations: float
    available_assets: float
    existing_life_insurance: float
    total_resources: float
    raw_net_cover: float
    recommended_cover: float
    discount_rate_used: float


def calculate_present_value(
    annual_amount: float,
    years: float,
    discount_rate: float = 0.05,
) -> float:
    """
    Calculate the Present Value (PV) of an ordinary annuity with annual payments.

    Formula:
        If annual_amount == 0 or years <= 0:
            PV = 0.0
        If discount_rate == 0:
            PV = annual_amount * years
        If discount_rate > 0:
            PV = annual_amount * [1 - (1 + discount_rate)^(-years)] / discount_rate
    """
    if annual_amount < 0:
        raise ValueError("Annual amount cannot be negative.")
    if years < 0:
        raise ValueError("Years duration cannot be negative.")
    if discount_rate < 0:
        raise ValueError("Discount rate cannot be negative.")

    if annual_amount == 0.0 or years == 0.0:
        return 0.0

    if discount_rate == 0.0:
        return round(annual_amount * years, 2)

    # Standard present value of an annuity formula
    pv = annual_amount * (1.0 - (1.0 + discount_rate) ** (-years)) / discount_rate
    return round(pv, 2)


def calculate_net_needs(
    outstanding_liabilities: float,
    future_financial_goals: float,
    annual_income_contribution: float,
    replacement_years: float,
    available_assets: float,
    existing_life_insurance: float,
    discount_rate: float = 0.05,
    monthly_household_expenses: Optional[float] = None,
    dependents_count: int = 2,
) -> NetNeedsBreakdown:
    """
    Calculate required life insurance coverage using the Net Needs Method.

    Formula:
        If dependents_count == 0:
            PV of Income Replacement = 0.0 (No dependent support required)
        Else:
            PV of Income Replacement = PV(effective_annual_support, replacement_years, discount_rate)

        Total Obligations = Outstanding Liabilities + Future Financial Goals + PV of Income Replacement
        Total Resources = Available Assets + Existing Life Insurance
        Raw Net Cover = Total Obligations - Total Resources
        Recommended Cover = max(0.0, Raw Net Cover)
    """
    inputs = {
        "outstanding_liabilities": outstanding_liabilities,
        "future_financial_goals": future_financial_goals,
        "annual_income_contribution": annual_income_contribution,
        "replacement_years": replacement_years,
        "available_assets": available_assets,
        "existing_life_insurance": existing_life_insurance,
        "discount_rate": discount_rate,
        "dependents_count": dependents_count,
    }
    if monthly_household_expenses is not None:
        inputs["monthly_household_expenses"] = monthly_household_expenses

    for name, val in inputs.items():
        if val < 0:
            raise ValueError(f"Input '{name}' cannot be negative (received: {val}).")

    # If customer has 0 dependents, no dependent living support is required
    if dependents_count == 0:
        pv_income = 0.0
    else:
        # If monthly expenses provided, evaluate annual living support
        if monthly_household_expenses is not None and monthly_household_expenses > 0:
            annual_living_from_expenses = monthly_household_expenses * 12.0
            effective_support = (
                annual_income_contribution
                if annual_income_contribution > 0
                else annual_living_from_expenses
            )
        else:
            effective_support = annual_income_contribution

        pv_income = calculate_present_value(
            annual_amount=effective_support,
            years=replacement_years,
            discount_rate=discount_rate,
        )

    total_obligations = round(
        outstanding_liabilities + future_financial_goals + pv_income, 2
    )

    total_resources = round(
        available_assets + existing_life_insurance, 2
    )

    raw_net_cover = round(total_obligations - total_resources, 2)
    recommended_cover = max(0.0, raw_net_cover)

    return NetNeedsBreakdown(
        outstanding_liabilities=round(outstanding_liabilities, 2),
        future_financial_goals=round(future_financial_goals, 2),
        annual_income_contribution=round(annual_income_contribution, 2),
        monthly_household_expenses=round(monthly_household_expenses, 2) if monthly_household_expenses is not None else None,
        dependents_count=dependents_count,
        replacement_years=round(replacement_years, 2),
        pv_income_replacement=pv_income,
        total_obligations=total_obligations,
        available_assets=round(available_assets, 2),
        existing_life_insurance=round(existing_life_insurance, 2),
        total_resources=total_resources,
        raw_net_cover=raw_net_cover,
        recommended_cover=recommended_cover,
        discount_rate_used=discount_rate,
    )


def calculate_human_life_value(
    annual_income_contribution: float,
    remaining_earning_years: float,
    discount_rate: float = 0.05,
    dependents_count: int = 2,
) -> float:
    """
    Calculate Human Life Value (HLV) as an earning-capacity benchmark.
    If dependents_count == 0, economic value to dependents is 0.
    """
    if annual_income_contribution < 0:
        raise ValueError("Annual income contribution cannot be negative.")
    if remaining_earning_years < 0:
        raise ValueError("Remaining earning years cannot be negative.")
    if discount_rate < 0:
        raise ValueError("Discount rate cannot be negative.")
    if dependents_count < 0:
        raise ValueError("Dependents count cannot be negative.")

    if dependents_count == 0:
        return 0.0

    return calculate_present_value(
        annual_amount=annual_income_contribution,
        years=remaining_earning_years,
        discount_rate=discount_rate,
    )


def calculate_illustrative_premiums(
    coverage_amount: float,
    age: int = 35,
    tenure: int = 20,
    annual_budget: float = 50000.0,
) -> Dict[str, Any]:
    """
    Transparent illustrative pricing model across 4 policy categories.
    Based on standard actuarial mortality tables and capital accumulation principles.
    Explicitly labeled as an educational illustrative benchmark.
    """
    if coverage_amount <= 0:
        return {
            "term_annual_premium": 0.0,
            "whole_life_annual_premium": 0.0,
            "endowment_annual_premium": 0.0,
            "ulip_annual_premium": 0.0,
            "annual_budget": round(annual_budget, 2),
            "term_affordability_status": "No Coverage Needed (Zero Gap)",
            "disclaimer": (
                "Illustrative actuarial benchmark estimate only. Not an actual insurer quotation. "
                "Actual premiums require insurer underwriting, medical evaluation, and product approval."
            ),
        }

    # 1. Pure Term Life benchmark rate per 1,000 sum assured
    age_factor = math.pow(1.055, max(0, age - 25))
    tenure_factor = 1.0 + (tenure / 100.0)
    term_rate_per_1000 = max(0.70, 0.85 * age_factor * tenure_factor)
    term_premium = round((coverage_amount / 1000.0) * term_rate_per_1000, 2)

    # 2. Whole Life (payout guaranteed until age 100 -> ~5.5x term rate)
    whole_life_rate_per_1000 = term_rate_per_1000 * 5.5
    whole_life_premium = round((coverage_amount / 1000.0) * whole_life_rate_per_1000, 2)

    # 3. Endowment Plan (guaranteed capital accumulation + cover -> ~45-60 per 1000)
    endowment_rate_per_1000 = max(45.0, (1000.0 / max(10, tenure)) * 0.85 + term_rate_per_1000)
    endowment_premium = round((coverage_amount / 1000.0) * endowment_rate_per_1000, 2)

    # 4. ULIP (standard 10x sum assured to annual premium ratio)
    ulip_premium = round(coverage_amount / 10.0, 2)

    # Budget affordability assessment for Term Life
    if annual_budget <= 0:
        affordability = "No Budget Specified"
    elif term_premium <= annual_budget:
        surplus = round(annual_budget - term_premium, 2)
        affordability = f"Within Budget (Surplus: {surplus:,.0f})"
    elif term_premium <= annual_budget * 1.25:
        deficit = round(term_premium - annual_budget, 2)
        affordability = f"Slightly Stretched (Deficit: {deficit:,.0f})"
    else:
        deficit = round(term_premium - annual_budget, 2)
        affordability = f"Exceeds Budget (Deficit: {deficit:,.0f})"

    return {
        "term_annual_premium": term_premium,
        "whole_life_annual_premium": whole_life_premium,
        "endowment_annual_premium": endowment_premium,
        "ulip_annual_premium": ulip_premium,
        "annual_budget": round(annual_budget, 2),
        "term_affordability_status": affordability,
        "disclaimer": (
            "Illustrative actuarial benchmark estimate only. Not an actual insurer quotation. "
            "Actual premiums require insurer underwriting, medical evaluation, and product approval."
        ),
    }


def run_full_assessment(
    annual_income_contribution: float,
    replacement_years: float,
    remaining_earning_years: float,
    outstanding_liabilities: float = 0.0,
    future_financial_goals: float = 0.0,
    available_assets: float = 0.0,
    existing_life_insurance: float = 0.0,
    discount_rate: float = 0.05,
    age: int = 35,
    dependents_count: int = 2,
    monthly_household_expenses: Optional[float] = None,
    annual_premium_budget: float = 50000.0,
    calculation_method: str = "net_needs",
    risk_preference: str = "moderate",
) -> Dict[str, Any]:
    """
    Execute Net Needs analysis, HLV benchmark, and illustrative pricing in one cohesive evaluation.
    Maintains strict separation between Net Needs and HLV results while supporting methodology toggle.
    """
    net_needs = calculate_net_needs(
        outstanding_liabilities=outstanding_liabilities,
        future_financial_goals=future_financial_goals,
        annual_income_contribution=annual_income_contribution,
        replacement_years=replacement_years,
        available_assets=available_assets,
        existing_life_insurance=existing_life_insurance,
        discount_rate=discount_rate,
        monthly_household_expenses=monthly_household_expenses,
        dependents_count=dependents_count,
    )

    hlv_estimate = calculate_human_life_value(
        annual_income_contribution=annual_income_contribution,
        remaining_earning_years=remaining_earning_years,
        discount_rate=discount_rate,
        dependents_count=dependents_count,
    )
    net_gap_hlv = max(0.0, round(hlv_estimate - existing_life_insurance, 2))
    hlv_dict = {
        "hlv_estimate": hlv_estimate,
        "remaining_earning_years": round(remaining_earning_years, 2),
        "annual_income_used": round(annual_income_contribution, 2),
        "discount_rate_used": discount_rate,
        "net_gap_hlv": net_gap_hlv,
        "benchmark_description": (
            "Human Life Value represents the present value of future economic earnings "
            "available to dependents until retirement, independent of specific debts or assets."
        ),
    }

    is_clamped = net_needs.raw_net_cover < 0.0

    # Determine final active recommended coverage based on selected methodology
    if calculation_method == "hlv":
        final_recommended_cover = hlv_dict["net_gap_hlv"]
        active_method_label = "Human Life Value (HLV)"
    else:
        final_recommended_cover = net_needs.recommended_cover
        active_method_label = "Net Needs Approach"

    coverage_gap = final_recommended_cover

    # Compute illustrative benchmark premiums for the recommended cover
    tenure = int(max(10, round(replacement_years)))
    illustrative_pricing = calculate_illustrative_premiums(
        coverage_amount=final_recommended_cover,
        age=age,
        tenure=tenure,
        annual_budget=annual_premium_budget,
    )

    return {
        "net_needs": {
            "outstanding_liabilities": net_needs.outstanding_liabilities,
            "future_financial_goals": net_needs.future_financial_goals,
            "annual_income_contribution": net_needs.annual_income_contribution,
            "monthly_household_expenses": net_needs.monthly_household_expenses,
            "dependents_count": net_needs.dependents_count,
            "replacement_years": net_needs.replacement_years,
            "pv_income_replacement": net_needs.pv_income_replacement,
            "total_obligations": net_needs.total_obligations,
            "available_assets": net_needs.available_assets,
            "existing_life_insurance": net_needs.existing_life_insurance,
            "total_resources": net_needs.total_resources,
            "raw_net_cover": net_needs.raw_net_cover,
            "recommended_cover": net_needs.recommended_cover,
            "is_clamped_to_zero": is_clamped,
            "calculation_method": "net_needs",
        },
        "human_life_value": hlv_dict,
        "selected_method": calculation_method,
        "final_recommended_cover": final_recommended_cover,
        "coverage_gap": coverage_gap,
        "illustrative_premiums": illustrative_pricing,
        "assumptions": {
            "selected_method_name": active_method_label,
            "customer_age": age,
            "dependents_count": dependents_count,
            "annual_premium_budget": annual_premium_budget,
            "risk_preference": risk_preference,
            "discount_rate": discount_rate,
            "discount_rate_percentage": f"{discount_rate * 100:.1f}%",
            "net_needs_formula": (
                "Required Cover = max(0, Outstanding Liabilities + Future Goals + "
                "PV(Income Replacement) - Available Assets - Existing Insurance)"
            ),
            "hlv_formula": (
                "HLV = PV(Annual Income Contribution, Remaining Earning Years, Discount Rate)"
            ),
            "currency_unit": "Standard Currency Units (Consistent across all inputs)",
            "limitations": (
                "Calculations assume constant discount rate and fixed family obligations. "
                "Does not account for future inflation shocks or changes in earning capacity."
            ),
        },
    }
