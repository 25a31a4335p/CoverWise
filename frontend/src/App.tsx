import { useState, useEffect, useCallback } from "react";
import { HomeDashboard } from "./components/HomeDashboard";
import { AssessmentForm } from "./components/AssessmentForm";
import { ResultsView } from "./components/ResultsView";
import { NavigationDrawer } from "./components/NavigationDrawer";
import { SettingsModal } from "./components/SettingsModal";
import type { CalculationRequest, CalculationResponse, HealthResponse, PrimaryObjective } from "./types";
import { calculateNeeds, checkBackendHealth } from "./api/client";

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<"checking" | "connected" | "error">("checking");
  const [result, setResult] = useState<CalculationResponse | null>(null);
  const [currentPayload, setCurrentPayload] = useState<CalculationRequest | null>(null);
  const [primaryObjective, setPrimaryObjective] = useState<PrimaryObjective>("family_protection");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [activeSection, setActiveSection] = useState<string>("home");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [navigationNotice, setNavigationNotice] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setHealthStatus("checking");
    try {
      const data = await checkBackendHealth();
      setHealth(data);
      setHealthStatus("connected");
    } catch {
      setHealth(null);
      setHealthStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleCalculate = async (payload: CalculationRequest, objective: PrimaryObjective) => {
    setIsLoading(true);
    setApiError(null);
    setNavigationNotice(null);
    try {
      const data = await calculateNeeds(payload);
      setCurrentPayload(payload);
      setPrimaryObjective(objective);
      setResult(data);
      // Smoothly navigate to results after calculation
      setTimeout(() => {
        const resultsEl = document.getElementById("coverage-results");
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("Unable to calculate needs. Please ensure the backend server is running.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async (updatedPayload: CalculationRequest) => {
    setIsRecalculating(true);
    setApiError(null);
    try {
      const data = await calculateNeeds(updatedPayload);
      setCurrentPayload(updatedPayload);
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(`Scenario recalculation failed: ${err.message}`);
      } else {
        setApiError("Scenario recalculation failed. Please check backend connection.");
      }
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleNavigateToSection = (targetId: string, requiresResult: boolean = false) => {
    const sectionKey =
      targetId === "home" ? "home" :
      targetId === "financial-assessment" ? "assessment" :
      targetId === "coverage-results" ? "results" :
      targetId === "policy-lab-section" ? "policy-lab" :
      targetId === "recommendations-section" ? "recommendations" :
      targetId === "advisory-section" ? "advisory" :
      targetId === "appointment-booking" ? "booking" : "home";
    setActiveSection(sectionKey);

    if (requiresResult && (!result || !currentPayload)) {
      setNavigationNotice("Please complete your financial assessment first to view this module. We've scrolled to the assessment inputs below.");
      const formEl = document.getElementById("financial-assessment");
      if (formEl) {
        formEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setTimeout(() => setNavigationNotice(null), 6000);
      return;
    }

    if (targetId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleScrollToAssessment = () => {
    setActiveSection("assessment");
    const formEl = document.getElementById("financial-assessment");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleResetSession = () => {
    setActiveSection("home");
    setResult(null);
    setCurrentPayload(null);
    setApiError(null);
    setNavigationNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-container">
      {/* 2. Compact App-Style Header: Top-left hamburger, logo & wordmark beside it, top-right Settings */}
      <header className="navbar">
        <div className="navbar-content">
          <div className="header-left">
            {/* Top-Left: Hamburger Menu Trigger */}
            <button
              type="button"
              className="hamburger-menu-btn"
              onClick={() => setIsDrawerOpen((prev) => !prev)}
              aria-label={isDrawerOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isDrawerOpen}
              aria-controls="workspace-drawer"
            >
              <span className="hamburger-bars" aria-hidden="true">
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
              </span>
              <span className="hamburger-label">{isDrawerOpen ? "Close" : "Menu"}</span>
            </button>

            {/* Immediately Beside It: CoverWise Logo & Wordmark */}
            <a
              href="#home"
              className="brand-wrapper"
              onClick={(e) => {
                e.preventDefault();
                handleNavigateToSection("home", false);
              }}
              title="CoverWise Home Dashboard"
            >
              <div className="brand-logo" aria-hidden="true">CW</div>
              <div className="brand-text-block">
                <div className="brand-name">
                  CoverWise<span className="brand-dot">.</span>
                </div>
                <div className="tagline-badge">
                  Financial Protection Prototype
                </div>
              </div>
            </a>
          </div>

          <div className="header-right">
            {/* Clear Home navigation control */}
            <button
              type="button"
              className="header-home-btn"
              onClick={() => handleNavigateToSection("home", false)}
              title="Go to Home Dashboard"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Home</span>
            </button>

            {/* Live Backend Indicator */}
            <div className="health-badge-wrapper">
              {healthStatus === "connected" && health ? (
                <span className="health-status-badge connected" title="FastAPI Engine Online">
                  <span className="status-dot"></span> Engine Online (v{health.version})
                </span>
              ) : healthStatus === "checking" ? (
                <span className="health-status-badge checking">
                  <span className="status-dot"></span> Checking API...
                </span>
              ) : (
                <button
                  type="button"
                  className="health-status-badge error"
                  onClick={fetchHealth}
                  title="Click to retry backend connection"
                >
                  <span className="status-dot"></span> Offline &bull; Reconnect
                </button>
              )}
            </div>

            {/* Top-Right: Settings Icon */}
            <button
              type="button"
              className="settings-trigger-btn"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Open Settings"
              title="Open Settings & System Info"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Layout: Left Navigation + Main Content Column */}
      <div className={`workspace-layout ${isDrawerOpen ? "drawer-open" : "drawer-closed"}`}>
        {/* Left Navigation Drawer */}
        <NavigationDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          hasResult={!!(result && currentPayload)}
          onNavigateToAssessment={handleScrollToAssessment}
          onNavigateToSection={handleNavigateToSection}
          onOpenSettings={() => setIsSettingsOpen(true)}
          activeSection={activeSection}
        />

        {/* Main Column to the Right of Left Navigation */}
        <div className="workspace-main-column">
          {/* Main Single-Page Workspace */}
          <main className="main-content">
            {/* Navigation Dependency Notice */}
            {navigationNotice && (
              <div className="notice-banner" role="status">
                <span className="notice-icon" aria-hidden="true">ℹ️</span>
                <div className="notice-content">
                  <strong>Module Notice:</strong> {navigationNotice}
                </div>
                <button
                  type="button"
                  className="notice-dismiss-btn"
                  onClick={() => setNavigationNotice(null)}
                  aria-label="Dismiss notice"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Global API Error Alert */}
            {apiError && (
              <div className="error-banner" role="alert">
                <span className="error-icon" aria-hidden="true">⚠️</span>
                <div className="error-body">
                  <strong>Calculation Engine Notice:</strong> {apiError}
                  {healthStatus === "error" && (
                    <div className="error-subtext">
                      Make sure the FastAPI backend is running on port 8000.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 1. Interactive Home Dashboard */}
            <HomeDashboard
              result={result}
              currentPayload={currentPayload}
              onStartAssessment={handleScrollToAssessment}
              onNavigateToSection={handleNavigateToSection}
            />

            {/* 2. Financial Assessment Section (Single-Page In-Place) */}
            <div id="financial-assessment" className="assessment-canvas-wrapper">
              <AssessmentForm onSubmit={handleCalculate} isLoading={isLoading} />
            </div>

            {/* 3. Coverage Results & Advisory Consultation Suite */}
            {result && currentPayload ? (
              <ResultsView
                data={result}
                currentPayload={currentPayload}
                primaryObjective={primaryObjective}
                onEdit={handleScrollToAssessment}
                onRecalculate={handleRecalculate}
                isRecalculating={isRecalculating}
              />
            ) : (
              <div className="results-unlocked-guide">
                <div className="guide-card">
                  <div className="guide-icon-wrapper" aria-hidden="true">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      <polyline points="9 12 11 14 15 10"></polyline>
                    </svg>
                  </div>
                  <div className="guide-meta">
                    <h3 className="guide-title">Detailed Analysis &amp; Advisory Awaits</h3>
                    <p className="guide-text">
                      Submit the financial assessment above or pick one of the 5 realistic scenario presets to immediately generate your Net Needs gap, HLV economic earning benchmark, Policy Lab sliders, personalized product recommendations, and advisor booking.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Editorial Footer */}
          <footer className="editorial-footer">
            <div className="footer-container">
              <div className="footer-top-row">
                <div className="footer-brand-block">
                  <div className="footer-logo">
                    CoverWise<span className="brand-dot">.</span>
                  </div>
                  <p className="footer-mission">
                    Intelligent, transparent life insurance needs assessment &amp; digital advisory prototype.
                  </p>
                </div>
                <div className="footer-meta-block">
                  <div className="footer-badge">Python FastAPI + React TypeScript + SQLite</div>
                  <div className="footer-version">Engine v0.1.0 &bull; Local &amp; Private</div>
                </div>
              </div>

              <div className="footer-disclaimer-strip">
                <p>
                  <strong>Educational Disclaimer:</strong> CoverWise provides financial scenario modeling for consumer financial wellness and literacy. Figures are illustrative mathematical estimates and do not constitute formal insurer quotations or regulated financial advice. Real policy issuance requires verified insurer underwriting and official terms.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Lightweight Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        health={health}
        healthStatus={healthStatus}
        onResetSession={handleResetSession}
      />
    </div>
  );
}

export default App;
