import React from "react";
import type { CalculationResponse, CalculationRequest } from "../types";
import { formatCurrency } from "../utils/validation";

interface HomeDashboardProps {
  result: CalculationResponse | null;
  currentPayload: CalculationRequest | null;
  onStartAssessment: () => void;
  onNavigateToSection: (sectionId: string, requiresResult?: boolean) => void;
}

interface QuickAccessItem {
  id: string;
  name: string;
  description: string;
  targetId: string;
  requiresResult: boolean;
  icon: React.ReactNode;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  result,
  currentPayload,
  onStartAssessment,
  onNavigateToSection,
}) => {
  const hasResult = !!(result && currentPayload);

  const quickAccessItems: QuickAccessItem[] = [
    {
      id: "assessment",
      name: "Financial Assessment",
      description: "Household ledger, income support & 5 scenario presets",
      targetId: "financial-assessment",
      requiresResult: false,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          <path d="M9 14l2 2 4-4"></path>
        </svg>
      ),
    },
    {
      id: "results",
      name: "Coverage Results",
      description: "Net Needs gap analysis & Human Life Value benchmark",
      targetId: "coverage-results",
      requiresResult: true,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
    },
    {
      id: "policy-lab",
      name: "Coverage Controls / Policy Lab",
      description: "Simulate coverage, tenure, budget & live actuarial pricing",
      targetId: "policy-lab-section",
      requiresResult: true,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="4" y1="21" x2="4" y2="14"></line>
          <line x1="4" y1="10" x2="4" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12" y2="3"></line>
          <line x1="20" y1="21" x2="20" y2="16"></line>
          <line x1="20" y1="12" x2="20" y2="3"></line>
          <line x1="1" y1="14" x2="7" y2="14"></line>
          <line x1="9" y1="8" x2="15" y2="8"></line>
          <line x1="17" y1="16" x2="23" y2="16"></line>
        </svg>
      ),
    },
    {
      id: "recommendations",
      name: "Policy Recommendations",
      description: "Term, Whole Life, Endowment & ULIP suitability breakdown",
      targetId: "recommendations-section",
      requiresResult: true,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="7"></circle>
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
      ),
    },
    {
      id: "advisory",
      name: "Educational Advisory",
      description: "Risk diagnostic dossier, priority checklist & document guide",
      targetId: "advisory-section",
      requiresResult: true,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ),
    },
    {
      id: "booking",
      name: "Consultation Booking",
      description: "Schedule advisor session with unique ID (SQLite persisted)",
      targetId: "appointment-booking",
      requiresResult: true,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
    },
  ];

  const handleShortcutClick = (item: QuickAccessItem) => {
    onNavigateToSection(item.targetId, item.requiresResult);
  };

  return (
    <section className="home-dashboard" id="home">
      {/* 1. Welcome Hero Section */}
      <div className="welcome-hero">
        <div className="welcome-hero-content">
          <div className="hero-kicker-badge">
            <span className="kicker-spark">✦</span> Financial Wellness &amp; Protection Prototype
          </div>
          <h1 className="welcome-hero-headline">
            Protect what matters. Plan with confidence.
          </h1>
          <p className="welcome-hero-description">
            Understand your family&apos;s life insurance needs, explore coverage options, and make informed decisions in one place.
          </p>

          <div className="welcome-hero-actions">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={onStartAssessment}
            >
              Start My Assessment
              <span className="btn-arrow" aria-hidden="true">&darr;</span>
            </button>
            <button
              type="button"
              className="btn-hero-secondary"
              onClick={() => onNavigateToSection("prototype-intro", false)}
            >
              Explore CoverWise
              <span className="btn-arrow-right" aria-hidden="true">&rarr;</span>
            </button>
          </div>

          <div className="hero-feature-tags">
            <span className="feature-tag">
              <span className="tag-check">✓</span> Balance Sheet Net Needs
            </span>
            <span className="feature-tag">
              <span className="tag-check">✓</span> Human Life Value Benchmark
            </span>
            <span className="feature-tag">
              <span className="tag-check">✓</span> 0-Dependents Safeguard
            </span>
            <span className="feature-tag">
              <span className="tag-check">✓</span> Actuarial Benchmark Pricing
            </span>
          </div>
        </div>
      </div>

      {/* 2. How CoverWise Works (Visual 4-Stage Journey) */}
      <div className="how-it-works-section" id="how-it-works">
        <div className="section-masthead">
          <span className="section-kicker">Guided Workflow</span>
          <h2 className="section-title">How CoverWise Works</h2>
          <p className="section-subtitle">
            A clear, transparent four-stage journey from household numbers to verified financial protection.
          </p>
        </div>

        <div className="workflow-steps-grid">
          <div className="workflow-step-card">
            <div className="step-number-badge">1</div>
            <h3 className="step-title">Assess</h3>
            <p className="step-description">
              Enter your debts, milestone goals, family dependents, and living income support needs into our clean balance-sheet ledger.
            </p>
          </div>

          <div className="workflow-connector" aria-hidden="true">&rarr;</div>

          <div className="workflow-step-card">
            <div className="step-number-badge">2</div>
            <h3 className="step-title">Understand</h3>
            <p className="step-description">
              Compare your exact balance-sheet Net Needs against your economic Human Life Value (HLV) earning benchmark.
            </p>
          </div>

          <div className="workflow-connector" aria-hidden="true">&rarr;</div>

          <div className="workflow-step-card">
            <div className="step-number-badge">3</div>
            <h3 className="step-title">Explore</h3>
            <p className="step-description">
              Stress-test coverage amounts, tenure lengths, and annual budgets in the Policy Lab with live actuarial pricing.
            </p>
          </div>

          <div className="workflow-connector" aria-hidden="true">&rarr;</div>

          <div className="workflow-step-card">
            <div className="step-number-badge">4</div>
            <h3 className="step-title">Get Guidance</h3>
            <p className="step-description">
              Review unbiased policy recommendations, an actionable advisory dossier, and request an advisor session.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Prototype Introduction */}
      <div className="prototype-intro-section" id="prototype-intro">
        <div className="section-masthead">
          <span className="section-kicker">Platform Foundations</span>
          <h2 className="section-title">What is CoverWise?</h2>
          <p className="section-subtitle">
            An independent, mathematical life insurance assessment prototype engineered to eliminate confusion and commission bias.
          </p>
        </div>

        <div className="intro-cards-grid">
          <div className="intro-card">
            <div className="intro-card-icon" aria-hidden="true">💡</div>
            <h3 className="intro-card-title">The Problem We Solve</h3>
            <p className="intro-card-text">
              Most families are either drastically underinsured or paying heavy premiums for low-return investment-insurance hybrids. CoverWise replaces sales pressure with clear, transparent balance-sheet math.
            </p>
          </div>

          <div className="intro-card">
            <div className="intro-card-icon" aria-hidden="true">⚖️</div>
            <h3 className="intro-card-title">Dual Valuation Engine</h3>
            <p className="intro-card-text">
              We calculate both your <strong>Net Needs</strong> (debts + goals + income PV minus liquid assets) and your <strong>Human Life Value</strong> (lifetime earning capacity benchmark) so you see the complete picture.
            </p>
          </div>

          <div className="intro-card">
            <div className="intro-card-icon" aria-hidden="true">🧪</div>
            <h3 className="intro-card-title">Interactive Policy Lab</h3>
            <p className="intro-card-text">
              Test &apos;what-if&apos; scenarios in real time. Adjust your coverage, retirement age, and budget to see instant actuarial benchmark pricing without fabricating commercial insurer quotes.
            </p>
          </div>

          <div className="intro-card">
            <div className="intro-card-icon" aria-hidden="true">📋</div>
            <h3 className="intro-card-title">Educational Advisory &amp; Booking</h3>
            <p className="intro-card-text">
              Receive a diagnostic risk dossier, priority checklist, and key questions for licensed agents. You can also request a consultation persisted securely to our local SQLite database.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Interactive Quick Access */}
      <div className="quick-access-section" id="quick-access">
        <div className="section-masthead">
          <span className="section-kicker">Direct Navigation</span>
          <h2 className="section-title">Interactive Quick Access</h2>
          <p className="section-subtitle">
            Quickly jump to any of the six functional modules in the CoverWise prototype.
          </p>
        </div>

        <div className="quick-access-grid">
          {quickAccessItems.map((item) => {
            const isLocked = item.requiresResult && !hasResult;
            return (
              <button
                key={item.id}
                type="button"
                className={`quick-access-card ${isLocked ? "card-locked" : "card-active"}`}
                onClick={() => handleShortcutClick(item)}
                aria-label={`Jump to ${item.name}`}
              >
                <div className="card-top-row">
                  <div className="card-icon-wrapper" aria-hidden="true">
                    {item.icon}
                  </div>
                  <span className={`card-status-pill ${isLocked ? "pill-pending" : "pill-ready"}`}>
                    {isLocked ? "Requires Assessment" : "Ready"}
                  </span>
                </div>

                <h3 className="card-name">{item.name}</h3>
                <p className="card-desc">{item.description}</p>

                <div className="card-action-cue">
                  <span>{isLocked ? "Complete assessment first" : "Jump to section"}</span>
                  <span className="cue-arrow" aria-hidden="true">&rarr;</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Coverage Overview */}
      <div className="coverage-overview-section" id="coverage-overview">
        <div className="section-masthead">
          <span className="section-kicker">Live Protection Snapshot</span>
          <h2 className="section-title">Coverage Overview</h2>
          <p className="section-subtitle">
            {hasResult
              ? "Calculated results based on your active household balance sheet."
              : "Complete your assessment to view your calculated financial protection gap."}
          </p>
        </div>

        {hasResult && result ? (
          /* Live Results Snapshot */
          <div className="coverage-overview-card active-results">
            <div className="overview-headline-row">
              <div>
                <span className="overview-tag">Active Assessment Data</span>
                <h3 className="overview-metric-title">Recommended Life Cover Need</h3>
              </div>
              <button
                type="button"
                className="btn-text-link"
                onClick={() => onNavigateToSection("coverage-results", true)}
              >
                View Detailed Ledger &rarr;
              </button>
            </div>

            <div className="overview-stats-grid">
              <div className="stat-box primary-stat">
                <span className="stat-label">Net Needs Recommended Cover</span>
                <span className="stat-value">
                  {formatCurrency(result.net_needs.recommended_cover)}
                </span>
                <span className="stat-caption">
                  {result.net_needs.is_clamped_to_zero
                    ? "Fully covered by existing liquid assets & insurance"
                    : "Exact gap needed to secure debts, goals & living support"}
                </span>
              </div>

              <div className="stat-box">
                <span className="stat-label">Human Life Value (HLV) Benchmark</span>
                <span className="stat-value">
                  {formatCurrency(result.human_life_value.hlv_estimate)}
                </span>
                <span className="stat-caption">
                  Economic earning capacity over {result.human_life_value.remaining_earning_years} working years
                </span>
              </div>

              <div className="stat-box">
                <span className="stat-label">Total Obligations vs Resources</span>
                <span className="stat-value">
                  {formatCurrency(result.net_needs.total_obligations)}
                </span>
                <span className="stat-caption">
                  Backed by {formatCurrency(result.net_needs.total_resources)} in liquid resources
                </span>
              </div>
            </div>

            <div className="overview-footer-cta">
              <button
                type="button"
                className="btn-hero-primary"
                onClick={() => onNavigateToSection("coverage-results", true)}
              >
                Inspect Full Results &amp; Charts &darr;
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onNavigateToSection("policy-lab-section", true)}
              >
                Open Policy Lab Sliders &rarr;
              </button>
            </div>
          </div>
        ) : (
          /* Meaningful Empty State */
          <div className="coverage-overview-card empty-state">
            <div className="empty-state-visual" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="M12 8v4"></path>
                <path d="M12 16h.01"></path>
              </svg>
            </div>

            <h3 className="empty-state-title">No Assessment Calculated Yet</h3>
            <p className="empty-state-description">
              Your personalized Net Needs balance sheet, Human Life Value benchmark, and insurance gap metrics will be displayed here as soon as you run an assessment.
            </p>

            <div className="empty-state-callout">
              <span className="callout-icon" aria-hidden="true">⏱️</span>
              <span>
                <strong>Quick &amp; Private:</strong> Takes under 2 minutes. No phone number or personal details required to calculate your true coverage.
              </span>
            </div>

            <div className="empty-state-action">
              <button
                type="button"
                className="btn-hero-primary"
                onClick={onStartAssessment}
              >
                Start Financial Assessment Below &darr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Continue Your Journey Section */}
      <div className="continue-journey-section">
        <div className="journey-prompt-card">
          <div className="journey-text-block">
            <span className="journey-stage-tag">Next Step</span>
            <h3 className="journey-title">
              {hasResult
                ? "Assessment Active: Explore Policy Scenarios or Book Advisory"
                : "Ready to Find Your True Life Cover Need?"}
            </h3>
            <p className="journey-subtitle">
              {hasResult
                ? "You have active calculation results. Test tenure and budget sliders in the Policy Lab or schedule an educational consultation."
                : "Scroll down to fill in your household numbers or choose one of the five realistic pre-configured test scenarios."}
            </p>
          </div>

          <div className="journey-buttons-row">
            {hasResult ? (
              <>
                <button
                  type="button"
                  className="btn-hero-primary"
                  onClick={() => onNavigateToSection("policy-lab-section", true)}
                >
                  Explore Policy Lab &rarr;
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onNavigateToSection("advisory-section", true)}
                >
                  Review Advisory Dossier &rarr;
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-hero-primary"
                onClick={onStartAssessment}
              >
                Scroll to Assessment Form &darr;
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
