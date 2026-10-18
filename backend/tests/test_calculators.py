"""
Unit Tests for CoverWise Pure Calculation Logic (calculators.py)
==============================================================
Tests calculation formulas independent of FastAPI / HTTP.
"""

import pytest
from app.calculators import (
    calculate_present_value,
    calculate_net_needs,
    calculate_human_life_value,
    run_full_assessment,
)


def test_present_value_standard():
    """Verify PV of annuity calculation with positive cashflow, years, and discount rate."""
    # PV of 100,000 for 10 years at 5% discount rate
    # Formula: 100000 * (1 - (1.05)^(-10)) / 0.05 ≈ 772173.49
    pv = calculate_present_value(100000.0, 10.0, 0.05)
    assert pytest.approx(pv, 0.01) == 772173.49


def test_present_value_zero_discount_rate():
    """When discount rate is 0%, PV is simple linear product (amount * years)."""
    pv = calculate_present_value(50000.0, 10.0, 0.0)
    assert pv == 500000.0


def test_present_value_zero_income():
    """When income contribution is 0, PV should safely return 0.0."""
    pv = calculate_present_value(0.0, 20.0, 0.05)
    assert pv == 0.0


def test_present_value_zero_years():
    """When duration is 0 years, PV should safely return 0.0."""
    pv = calculate_present_value(100000.0, 0.0, 0.05)
    assert pv == 0.0


def test_present_value_negative_inputs_raise_error():
    """Negative amounts, years, or discount rate must raise ValueError."""
    with pytest.raises(ValueError, match="Annual amount cannot be negative"):
        calculate_present_value(-100.0, 10.0, 0.05)

    with pytest.raises(ValueError, match="Years duration cannot be negative"):
        calculate_present_value(100.0, -5.0, 0.05)

    with pytest.raises(ValueError, match="Discount rate cannot be negative"):
        calculate_present_value(100.0, 5.0, -0.05)


def test_net_needs_standard_positive_gap():
    """
    Test a normal Net Needs scenario where obligations exceed resources.
    Liabilities: 2,000,000
    Future Goals: 3,000,000
    Income Replacement: 500,000 / yr for 15 yrs at 5% discount -> PV ≈ 5,189,829.43
    Total Obligations: 2,000,000 + 3,000,000 + 5,189,829.43 = 10,189,829.43
    Available Assets: 1,000,000
    Existing Life Insurance: 2,000,000
    Total Resources: 3,000,000
    Raw Net Cover: 10,189,829.43 - 3,000,000 = 7,189,829.43
    Recommended Cover: 7,189,829.43
    """
    result = calculate_net_needs(
        outstanding_liabilities=2000000.0,
        future_financial_goals=3000000.0,
        annual_income_contribution=500000.0,
        replacement_years=15.0,
        available_assets=1000000.0,
        existing_life_insurance=2000000.0,
        discount_rate=0.05,
    )

    expected_pv = calculate_present_value(500000.0, 15.0, 0.05)
    assert result.pv_income_replacement == expected_pv
    assert result.total_obligations == round(2000000.0 + 3000000.0 + expected_pv, 2)
    assert result.total_resources == 3000000.0
    assert result.raw_net_cover == round(result.total_obligations - 3000000.0, 2)
    assert result.recommended_cover == result.raw_net_cover
    assert result.recommended_cover > 0


def test_net_needs_clamping_when_resources_exceed_obligations():
    """
    When available assets + existing cover exceed total obligations,
    raw_net_cover is negative, but recommended_cover MUST be clamped to 0.0.
    """
    result = calculate_net_needs(
        outstanding_liabilities=100000.0,
        future_financial_goals=200000.0,
        annual_income_contribution=50000.0,
        replacement_years=5.0,  # PV at 5% is ~216,473.83
        available_assets=1000000.0,  # 1M assets > ~516k total obligations
        existing_life_insurance=500000.0,
        discount_rate=0.05,
    )

    assert result.raw_net_cover < 0.0
    assert result.recommended_cover == 0.0


def test_net_needs_zero_income_and_years():
    """
    Test safe calculation when income contribution and replacement years are both zero.
    Obligations reduce to just liabilities and future goals.
    """
    result = calculate_net_needs(
        outstanding_liabilities=500000.0,
        future_financial_goals=1000000.0,
        annual_income_contribution=0.0,
        replacement_years=0.0,
        available_assets=200000.0,
        existing_life_insurance=300000.0,
        discount_rate=0.05,
    )

    assert result.pv_income_replacement == 0.0
    assert result.total_obligations == 1500000.0
    assert result.total_resources == 500000.0
    assert result.recommended_cover == 1000000.0


def test_net_needs_negative_input_raises_value_error():
    """Any negative input to calculate_net_needs should raise ValueError."""
    with pytest.raises(ValueError, match="Input 'outstanding_liabilities' cannot be negative"):
        calculate_net_needs(
            outstanding_liabilities=-500.0,
            future_financial_goals=0.0,
            annual_income_contribution=10000.0,
            replacement_years=5.0,
            available_assets=0.0,
            existing_life_insurance=0.0,
        )


def test_human_life_value_benchmark():
    """
    Test HLV calculation as an independent benchmark.
    Annual income contribution: 800,000
    Remaining earning years: 25
    Discount rate: 5%
    Formula: PV(800000, 25, 0.05) ≈ 11,275,152.01
    """
    hlv = calculate_human_life_value(
        annual_income_contribution=800000.0,
        remaining_earning_years=25.0,
        discount_rate=0.05,
    )

    assert pytest.approx(hlv, 0.01) == 11275152.01


def test_human_life_value_zero_earning_years():
    """HLV should safely be 0 when remaining earning years is 0."""
    hlv = calculate_human_life_value(
        annual_income_contribution=800000.0,
        remaining_earning_years=0.0,
        discount_rate=0.05,
    )
    assert hlv == 0.0


def test_full_assessment_separation():
    """
    Verify run_full_assessment produces distinct Net Needs and HLV outputs,
    and correctly flags clamping.
    """
    assessment = run_full_assessment(
        annual_income_contribution=600000.0,
        replacement_years=15.0,
        remaining_earning_years=25.0,
        outstanding_liabilities=1000000.0,
        future_financial_goals=2000000.0,
        available_assets=500000.0,
        existing_life_insurance=1000000.0,
        discount_rate=0.05,
    )

    net_needs = assessment["net_needs"]
    hlv = assessment["human_life_value"]

    # Verify they are separate values with distinct semantics
    assert net_needs["recommended_cover"] != hlv["hlv_estimate"]
    assert net_needs["is_clamped_to_zero"] is False
    assert "benchmark_description" in hlv
    assert assessment["assumptions"]["discount_rate"] == 0.05


def test_net_needs_zero_dependents_returns_zero_income_replacement():
    """
    Edge Case 2: Customer with no dependents and no outstanding liabilities
    must have 0 income replacement need and 0 recommended cover.
    """
    result = calculate_net_needs(
        outstanding_liabilities=0.0,
        future_financial_goals=0.0,
        annual_income_contribution=1000000.0,
        replacement_years=20.0,
        available_assets=500000.0,
        existing_life_insurance=0.0,
        discount_rate=0.05,
        dependents_count=0,
    )
    assert result.pv_income_replacement == 0.0
    assert result.total_obligations == 0.0
    assert result.recommended_cover == 0.0


def test_net_needs_monthly_expenses_evaluation():
    """
    When monthly_household_expenses is provided and annual_income_contribution is 0,
    annual living expenses (monthly * 12) must be used.
    """
    result = calculate_net_needs(
        outstanding_liabilities=0.0,
        future_financial_goals=0.0,
        annual_income_contribution=0.0,
        replacement_years=10.0,
        available_assets=0.0,
        existing_life_insurance=0.0,
        discount_rate=0.05,
        monthly_household_expenses=50000.0,  # 600,000 / yr
        dependents_count=2,
    )
    expected_pv = calculate_present_value(600000.0, 10.0, 0.05)
    assert result.pv_income_replacement == expected_pv
    assert result.recommended_cover == expected_pv


def test_full_assessment_hlv_methodology_toggle():
    """
    When calculation_method is 'hlv', final_recommended_cover and coverage_gap
    must be driven by HLV net gap rather than Net Needs.
    """
    assessment = run_full_assessment(
        annual_income_contribution=500000.0,
        replacement_years=10.0,
        remaining_earning_years=20.0,
        outstanding_liabilities=100000.0,
        future_financial_goals=100000.0,
        available_assets=500000.0,
        existing_life_insurance=500000.0,
        discount_rate=0.05,
        calculation_method="hlv",
    )
    hlv_dict = assessment["human_life_value"]
    assert assessment["selected_method"] == "hlv"
    assert assessment["final_recommended_cover"] == hlv_dict["net_gap_hlv"]
    assert assessment["coverage_gap"] == hlv_dict["net_gap_hlv"]


def test_illustrative_pricing_model():
    """
    Verify illustrative pricing benchmarks for all 4 categories and budget checks.
    """
    from app.calculators import calculate_illustrative_premiums
    pricing = calculate_illustrative_premiums(
        coverage_amount=5000000.0,
        age=30,
        tenure=20,
        annual_budget=30000.0,
    )
    assert pricing["term_annual_premium"] > 0
    assert pricing["whole_life_annual_premium"] > pricing["term_annual_premium"]
    assert pricing["endowment_annual_premium"] > pricing["term_annual_premium"]
    assert pricing["ulip_annual_premium"] == 500000.0
    assert "Within Budget" in pricing["term_affordability_status"] or "Exceeds Budget" in pricing["term_affordability_status"]
    assert "Illustrative actuarial benchmark estimate only" in pricing["disclaimer"]


def test_hlv_preset_32_years_vs_25_years_reconciliation():
    """
    Reconciliation Test for HLV Discrepancy:
    - In the Young Family Preset (age 28, retirement 60), remaining_earning_years = 32.
      PV = 800,000 * [1 - (1.05)^(-32)] / 0.05 = 12,642,141.07 (reported in walkthrough).
    - In standard 25-year working horizon (age 35, retirement 60), remaining_earning_years = 25.
      PV = 800,000 * [1 - (1.05)^(-25)] / 0.05 = 11,275,155.65 (reported in unit test).
    Both numbers are verified as mathematically exact derivations of their respective durations.
    """
    income = 800000.0
    discount_rate = 0.05

    # 32 remaining earning years (Preset in UI)
    hlv_32 = calculate_human_life_value(income, remaining_earning_years=32.0, discount_rate=discount_rate)
    assert abs(hlv_32 - 12642141.33) < 0.01

    # 25 remaining earning years (Test in scratch script)
    hlv_25 = calculate_human_life_value(income, remaining_earning_years=25.0, discount_rate=discount_rate)
    assert abs(hlv_25 - 11275155.65) < 0.01

    # Verify difference is purely attributable to duration (32 yrs vs 25 yrs)
    assert hlv_32 > hlv_25


def test_net_needs_and_hlv_comprehensive_matrix():
    """
    Comprehensive verification across large amounts, decimals, and clamping transparency.
    """
    # 1. Decimal inputs
    result_dec = calculate_net_needs(
        outstanding_liabilities=1500250.75,
        future_financial_goals=2500750.25,
        annual_income_contribution=650320.50,
        replacement_years=14.5,
        available_assets=500100.00,
        existing_life_insurance=1000000.00,
        discount_rate=0.0525,
    )
    assert result_dec.recommended_cover > 0
    assert isinstance(result_dec.recommended_cover, float)

    # 2. Very large amounts (₹100 Crore / 1 Billion)
    result_large = calculate_net_needs(
        outstanding_liabilities=1000000000.0,
        future_financial_goals=500000000.0,
        annual_income_contribution=50000000.0,
        replacement_years=20.0,
        available_assets=200000000.0,
        existing_life_insurance=100000000.0,
        discount_rate=0.05,
    )
    assert result_large.total_obligations > 1000000000.0
    assert result_large.recommended_cover > 1000000000.0

    # 3. Clamping transparency: raw negative cover preserved alongside zero floor
    result_surplus = calculate_net_needs(
        outstanding_liabilities=500000.0,
        future_financial_goals=500000.0,
        annual_income_contribution=100000.0,
        replacement_years=5.0,
        available_assets=10000000.0,
        existing_life_insurance=5000000.0,
        discount_rate=0.05,
    )
    assert result_surplus.raw_net_cover < -13000000.0
    assert result_surplus.recommended_cover == 0.0
    assert result_surplus.raw_net_cover != result_surplus.recommended_cover
