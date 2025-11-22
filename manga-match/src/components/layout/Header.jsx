import { Heart, Menu, Folder, Shuffle } from "lucide-react";
import '../styles/Header.css';

export const Header = ({ likedCount = 0, onLikedClick, onListsClick, onRandomize }) => {

  // Handle randomize button click
  const handleRandomize = () => {
    if (onRandomize) {
      onRandomize();
    }
  };

  // Render header component
  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
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
          <button className="nav-button" onClick={onLikedClick}>
            <Heart size={20} />
            <span>Liked</span>
            {likedCount > 0 && (
              <span className="liked-badge">{likedCount}</span>
            )}
          </button>

          <button className="nav-button" onClick={onListsClick}>
            <Folder size={20} />
            <span>Your Lists</span>
          </button>

          <button className="nav-button" onClick={handleRandomize}>
            <Shuffle size={20} />
            <span>Find Next Read</span>
          </button>

          <button className="nav-button">
            <span>Login</span>
          </button>

        </div>
      </div>
    </header>
  );
};

export default Header;