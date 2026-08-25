import "./Layout.css";

import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import ThemeSelector from "../ThemeSelector/ThemeSelector";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Escape press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Main navigation
  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/trends", label: "Trends", icon: "📈" },
    { to: "/feedback", label: "Feedback Inbox", icon: "📥" },
    { to: "/ask", label: "Ask LOOP", icon: "💬" },
  ];

  // Role-based navigation
  const extraLinks = [
    {
      to: "/ingestion",
      label: "Ingest Feedback",
      icon: "📥",
      roles: ["ADMIN", "ANALYST"],
    },
    {
      to: "/settings/workspace",
      label: "Workspace Settings",
      icon: "⚙️",
      roles: ["ADMIN"],
    },
  ];

  const hasAccess = (item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  };

  const allLinks = [...navLinks, ...extraLinks].filter(hasAccess);

  return (
    <div className="app-container">
      {/* Mobile Header / Navbar */}
      <header className="mobile-header d-lg-none">
        <div className="mobile-header-brand">
          <span className="brand-logo">🌀</span>
          <span className="brand-name">LOOP</span>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`mobile-menu-toggle ${
            isMobileMenuOpen ? "open" : ""
          }`}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label="Toggle navigation menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </header>

      {/* Mobile Drawer Navigation */}
      <div
        id="mobile-navigation"
        className={`mobile-navigation d-lg-none ${
          isMobileMenuOpen ? "show" : ""
        }`}
        ref={mobileMenuRef}
      >
        <nav className="mobile-nav-menu">
          {allLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="link-icon">{link.icon}</span>
              <span className="link-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mobile-nav-footer">
          <div className="mobile-theme-selector-container">
            <span className="footer-label">Theme</span>
            <ThemeSelector />
          </div>

          <div className="mobile-user-info">
            <div className="user-name">
              {user?.name || "User"}
            </div>

            <div className="user-email">
              {user?.email || "email@example.com"}
            </div>

            <div className="user-workspace">
              💼 {user?.workspaceName || "Default Workspace"} (
              {user?.role})
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn-logout w-100"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {isMobileMenuOpen && (
        <div
          className="mobile-nav-backdrop d-lg-none"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="sidebar d-none d-lg-flex">
        <div className="sidebar-brand">
          <span>🌀</span> LOOP
        </div>

        <nav className="sidebar-menu">
          {allLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="link-icon">{link.icon}</span>
              <span className="link-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-theme-selector-container">
            <ThemeSelector />
          </div>

          <div className="sidebar-user">
            <div className="sidebar-user-name">
              {user?.name || "User"}
            </div>

            <div className="sidebar-user-email">
              {user?.email || "email@example.com"}
            </div>

            <div className="sidebar-user-workspace">
              💼 {user?.workspaceName || "Default Workspace"} (
              {user?.role})
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn-logout"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;