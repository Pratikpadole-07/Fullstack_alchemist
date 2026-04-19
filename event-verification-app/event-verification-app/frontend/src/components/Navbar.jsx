import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const linkStyle = ({ isActive }) => ({
  fontWeight: isActive ? 700 : 500,
  opacity: isActive ? 1 : 0.85,
});

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "rgba(15,20,25,0.85)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div className="container row" style={{ justifyContent: "space-between", padding: "0.85rem 1.25rem" }}>
        <Link to="/dashboard" style={{ fontWeight: 800, color: "var(--text)" }}>
          TrustEvents
        </Link>
        <nav className="row" style={{ gap: "1rem" }}>
          <NavLink to="/dashboard" style={linkStyle}>
            Dashboard
          </NavLink>
          {isAuthenticated && (user?.role === "organizer" || user?.role === "admin") && (
            <NavLink to="/events/new" style={linkStyle}>
              New event
            </NavLink>
          )}
          {user?.role === "admin" && (
            <>
              <NavLink to="/admin/review" style={linkStyle}>
                Admin
              </NavLink>
              <NavLink to="/admin/reports" style={linkStyle}>
                Reports
              </NavLink>
            </>
          )}
          {!isAuthenticated ? (
            <>
              <NavLink to="/login" style={linkStyle}>
                Login
              </NavLink>
              <NavLink to="/signup" style={linkStyle}>
                Sign up
              </NavLink>
            </>
          ) : (
            <button type="button" className="btn secondary" onClick={logout}>
              Log out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
