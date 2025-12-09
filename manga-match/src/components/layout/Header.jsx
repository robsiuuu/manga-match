import { Heart, Folder, Shuffle, User, LogOut } from "lucide-react";
import "../styles/Header.css";

export const Header = ({
  user = null,
  onLogout,
  onGoogleLogin,
  likedCount = 0,
  onLikedClick,
  onListsClick,
  onRandomize,
  currentView = "discover",
}) => {
  // Handle randomize button click
  const handleRandomize = () => {
    if (onRandomize) {
      onRandomize();
    }
  };

  // Handle lists button click with authentication check
  const handleListsClick = () => {
    if (onListsClick) {
      onListsClick();
    }
  };

  // Make logo clickable to refresh discover page
  const handleLogoClick = () => {
    window.location.reload(); // Refresh to go back to discover
  };

  // Render header component
  return (
    <header className="header">
      <div className="header-container">
        {/* Logo - Clickable */}
        <div
          className="logo"
          onClick={handleLogoClick}
          style={{ cursor: "pointer" }}
        >
          <img
            src="/MangaMatch-logo.png"
            alt="MangaMatch"
            className="logo-image"
          />
          <div className="logo-text">
            <h1>MangaMatch</h1>
            <p>Discover your next favorite comic</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="navigation">
          <button
            className={`nav-button ${currentView === "liked" ? "active" : ""}`}
            onClick={onLikedClick}
          >
            <Heart size={20} />
            <span>Liked</span>
            {likedCount > 0 && (
              <span className="liked-badge">{likedCount}</span>
            )}
          </button>

          <button
            className={`nav-button ${currentView === "lists" ? "active" : ""}`}
            onClick={handleListsClick}
          >
            <Folder size={20} />
            <span>Your Lists</span>
          </button>

          <button className="nav-button" onClick={handleRandomize}>
            <Shuffle size={20} />
            <span>Find Next Read</span>
          </button>

          {/* User/Auth Section - FIXED LOGIC */}
          <div className="user-section">
            {/* Show sign in button for guests OR no user */}
            {user?.isGuest || !user ? (
              <button
                className="login-button"
                onClick={onGoogleLogin}
                title="Sign in with Google"
              >
                <User size={18} />
                <span>Sign in</span>
              </button>
            ) : (
              /* Show user info for authenticated users */
              <div className="user-info">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="user-avatar"
                    onError={(e) => {
                      // Fallback if image fails to load
                      console.log(
                        "Profile image failed to load:",
                        user.picture
                      );
                      e.target.style.display = "none";
                      // Show fallback instead
                    }}
                  />
                ) : (
                  <div className="user-avatar-fallback">
                    <User size={20} />
                  </div>
                )}
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className="user-status">Signed in</span>
                </div>
                {onLogout && (
                  <button
                    className="logout-btn"
                    onClick={onLogout}
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
