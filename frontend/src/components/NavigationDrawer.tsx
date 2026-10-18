import React, { useEffect, useRef } from "react";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  hasResult: boolean;
  onNavigateToAssessment: () => void;
  onNavigateToSection: (sectionId: string, requiresResult?: boolean) => void;
  onOpenSettings: () => void;
  activeSection?: string;
}

interface NavDestination {
  id: string;
  label: string;
  sublabel: string;
  targetId: string;
  requiresResult: boolean;
  isSettingsAction?: boolean;
  icon: React.ReactNode;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  hasResult,
  onNavigateToAssessment,
  onNavigateToSection,
  onOpenSettings,
  activeSection,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        document.body.style.overflow = "hidden";
        setTimeout(() => {
          closeButtonRef.current?.focus();
        }, 50);
      } else {
        document.body.style.overflow = "";
      }
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Handle outside click on overlay backdrop (mobile/tablet)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
    }
  };

  const navItems: NavDestination[] = [
    {
      id: "home",
      label: "Home Dashboard",
      sublabel: "Overview, workflow, prototype intro & live snapshot",
      targetId: "home",
      requiresResult: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
    },
    {
      id: "assessment",
      label: "Financial Assessment",
      sublabel: "Household ledger & 5 scenario presets",
      targetId: "financial-assessment",
      requiresResult: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          <path d="M9 14l2 2 4-4"></path>
        </svg>
      ),
    },
    {
      id: "results",
      label: "Coverage Results",
      sublabel: "Net Needs gap & HLV benchmark ledger",
      targetId: "coverage-results",
      requiresResult: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
    },
    {
      id: "policy-lab",
      label: "Coverage Controls / Policy Lab",
      sublabel: "Coverage, tenure & budget simulation",
      targetId: "policy-lab-section",
      requiresResult: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      label: "Policy Recommendations",
      sublabel: "Term, Whole Life, Endowment & ULIP",
      targetId: "recommendations-section",
      requiresResult: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="7"></circle>
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
      ),
    },
    {
      id: "advisory",
      label: "Educational Advisory",
      sublabel: "Diagnostic dossier & document checklist",
      targetId: "advisory-section",
      requiresResult: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      label: "Consultation Booking",
      sublabel: "Schedule advisor session (SQLite persisted)",
      targetId: "appointment-booking",
      requiresResult: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Settings & System Info",
      sublabel: "Engine parameters, database & session reset",
      targetId: "settings",
      requiresResult: false,
      isSettingsAction: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
    },
  ];

  const handleItemClick = (item: NavDestination) => {
    // Only close drawer on mobile/tablet screens to keep desktop navigation visible and usable
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
    }

    if (item.isSettingsAction) {
      onOpenSettings();
      return;
    }

    if (item.id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (item.id === "assessment") {
      onNavigateToAssessment();
      return;
    }

    onNavigateToSection(item.targetId, item.requiresResult);
  };

  if (!isOpen) return null;

  return (
    <div
      className="drawer-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Your workspace navigation menu"
    >
      <div className="drawer-panel" ref={drawerRef}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <span className="drawer-kicker">Navigation</span>
            <h2 className="drawer-heading">Your workspace</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close navigation drawer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Status Callout Strip */}
        <div className="drawer-status-callout">
          <div className="callout-indicator-dot" aria-hidden="true"></div>
          <div className="callout-text">
            {hasResult ? (
              <span><strong>Assessment Active</strong> &bull; Results, Lab &amp; Advisory Unlocked</span>
            ) : (
              <span><strong>Assessment Pending</strong> &bull; Fill inputs below to unlock advisory</span>
            )}
          </div>
        </div>

        {/* Navigation List */}
        <nav className="drawer-nav-list" aria-label="Workspace destinations">
          {navItems.map((item) => {
            const isItemDisabled = item.requiresResult && !hasResult;
            const isSelected = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`drawer-nav-item ${isSelected ? "selected" : ""} ${isItemDisabled ? "state-locked" : ""}`}
                onClick={() => handleItemClick(item)}
              >
                <div className="item-icon-wrapper" aria-hidden="true">
                  {item.icon}
                </div>
                <div className="item-meta">
                  <div className="item-title-row">
                    <span className="item-label">{item.label}</span>
                    {isItemDisabled && (
                      <span className="item-lock-pill">Pending</span>
                    )}
                    {isSelected && (
                      <span className="item-current-pill">Current</span>
                    )}
                  </div>
                  <span className="item-sublabel">{item.sublabel}</span>
                </div>
                <div className="item-arrow-col" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Drawer Footer Disclosures */}
        <div className="drawer-footer">
          <div className="drawer-footer-brand">
            <span className="brand-dot-sm" aria-hidden="true">●</span>
            <strong>CoverWise Engine</strong> &bull; Local &amp; Private
          </div>
          <div className="drawer-footer-note">
            FastAPI REST &bull; SQLite Persisted &bull; Zero External Tracking
          </div>
        </div>
      </div>
    </div>
  );
};
