"""
Integration Tests for CoverWise API Endpoints (main.py)
======================================================
Tests the FastAPI HTTP layer using TestClient.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify GET /health remains operational and returns expected metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "CoverWise"
    assert "version" in data


def test_root_endpoint():
    """Verify GET / remains operational."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["docs_url"] == "/docs"


def test_calculate_endpoint_valid_request():
    """Test POST /api/calculate with standard valid inputs."""
    payload = {
        "annual_income_contribution": 600000.0,
        "replacement_years": 15.0,
        "remaining_earning_years": 25.0,
        "outstanding_liabilities": 1500000.0,
        "future_financial_goals": 2000000.0,
        "available_assets": 500000.0,
        "existing_life_insurance": 1000000.0,
        "discount_rate": 0.05,
    }

    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Net Needs verification
    net_needs = data["net_needs"]
    assert "pv_income_replacement" in net_needs
    assert "total_obligations" in net_needs
    assert "total_resources" in net_needs
    assert "recommended_cover" in net_needs
    assert net_needs["recommended_cover"] > 0
    assert net_needs["is_clamped_to_zero"] is False

    # HLV verification
    hlv = data["human_life_value"]
    assert "hlv_estimate" in hlv
    assert hlv["hlv_estimate"] > 0
    assert hlv["hlv_estimate"] != net_needs["recommended_cover"]

    # Assumptions verification
    assert data["assumptions"]["discount_rate"] == 0.05


def test_calculate_endpoint_clamping_to_zero():
    """Test POST /api/calculate where resources exceed obligations."""
    payload = {
        "annual_income_contribution": 20000.0,
        "replacement_years": 2.0,
        "remaining_earning_years": 10.0,
        "outstanding_liabilities": 50000.0,
        "future_financial_goals": 50000.0,
        "available_assets": 1000000.0,  # 1M assets dwarfs total obligations
        "existing_life_insurance": 500000.0,
    }

    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    net_needs = data["net_needs"]
    assert net_needs["raw_net_cover"] < 0
    assert net_needs["recommended_cover"] == 0.0
    assert net_needs["is_clamped_to_zero"] is True


def test_calculate_endpoint_zero_income_and_years():
    """Test POST /api/calculate with zeros for income and duration."""
    payload = {
        "annual_income_contribution": 0.0,
        "replacement_years": 0.0,
        "remaining_earning_years": 0.0,
        "outstanding_liabilities": 200000.0,
        "future_financial_goals": 300000.0,
        "available_assets": 100000.0,
        "existing_life_insurance": 50000.0,
    }

    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["net_needs"]["pv_income_replacement"] == 0.0
    assert data["human_life_value"]["hlv_estimate"] == 0.0
    assert data["net_needs"]["recommended_cover"] == 350000.0


def test_calculate_endpoint_negative_input_rejected():
    """Verify that negative inputs are rejected with 422 Unprocessable Entity."""
    payload = {
        "annual_income_contribution": -50000.0,  # Negative value
        "replacement_years": 10.0,
        "remaining_earning_years": 20.0,
    }

    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any("greater than or equal to 0" in err.get("msg", "") for err in errors)


def test_calculate_endpoint_missing_required_fields():
    """Verify that omitting required fields returns 422 Unprocessable Entity."""
    # Omit annual_income_contribution, replacement_years, and remaining_earning_years
    payload = {
        "outstanding_liabilities": 100000.0,
    }

    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 422
    errors = response.json()["detail"]
    missing_fields = [err["loc"][-1] for err in errors if err.get("type") == "missing"]
    assert "annual_income_contribution" in missing_fields
    assert "replacement_years" in missing_fields
    assert "remaining_earning_years" in missing_fields


def test_calculate_endpoint_invalid_age_rejected():
    """Verify that age < 18 or > 75 is rejected with 422."""
    payload_underage = {
        "age": 16,  # Under 18
        "annual_income_contribution": 500000.0,
        "replacement_years": 10.0,
        "remaining_earning_years": 20.0,
    }
    resp1 = client.post("/api/calculate", json=payload_underage)
    assert resp1.status_code == 422

    payload_overage = {
        "age": 80,  # Over 75
        "annual_income_contribution": 500000.0,
        "replacement_years": 10.0,
        "remaining_earning_years": 20.0,
    }
    resp2 = client.post("/api/calculate", json=payload_overage)
    assert resp2.status_code == 422


def test_calculate_endpoint_hlv_method_selection():
    """Test POST /api/calculate with calculation_method='hlv' returns illustrative premiums."""
    payload = {
        "age": 28,
        "dependents_count": 2,
        "annual_income_contribution": 800000.0,
        "replacement_years": 15.0,
        "remaining_earning_years": 25.0,
        "annual_premium_budget": 40000.0,
        "calculation_method": "hlv",
    }
    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["selected_method"] == "hlv"
    assert "illustrative_premiums" in data
    assert data["illustrative_premiums"]["term_annual_premium"] > 0
    assert "term_affordability_status" in data["illustrative_premiums"]
