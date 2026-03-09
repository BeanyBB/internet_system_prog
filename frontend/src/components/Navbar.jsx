import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  async function handleLogoutClick() {
    await onLogout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="navbar-title">Chirp</div>

      <nav className="navbar-links">
        {user ? (
          <>
            <span className="welcome-text">@{user.username}</span>
            <Link to="/feed" className="nav-link">
              Feed
            </Link>
            <Link to="/search" className="nav-link">
              Search
            </Link>
            <Link to="/profile" className="nav-link">
              Profile
            </Link>
            <Link to="/settings" className="nav-link">
              Settings
            </Link>
            <button type="button" onClick={handleLogoutClick} className="nav-button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/signup" className="nav-link">
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
