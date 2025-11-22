import { useState } from 'react';
import { BookOpen, X, Heart } from 'lucide-react';
import '../styles/SwipeInterface.css';
import '../styles/ComicCard.css';

const SwipeInterface = ({ onLike, onDislike, comics }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [filteredComics] = useState(comics);

  // Handle like/dislike actions
  const handleAction = (action) => {
    if (isAnimating || currentIndex >= filteredComics.length) return;
    
    setIsAnimating(true);
    
    const currentComicId = filteredComics[currentIndex].id;
    if (action === 'like') {
      onLike(currentComicId);
    } else {
      onDislike(currentComicId);
    }
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  // Current comic to display
  const currentComic = filteredComics[currentIndex];

  // If no comics left to show
  if (!currentComic) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <BookOpen size={40} />
        </div>
        <div className="empty-text">
          <p className="empty-title">No more comics to show!</p>
          <p className="empty-subtitle">Try randomizing for new recommendations.</p>
        </div>
        <button 
          onClick={() => setCurrentIndex(0)}
          className="reset-button"
        >
          Show All Comics
        </button>
      </div>
    );
  }

  // Helpers for status badge
  const getStatusColor = (status) => {
    switch (status) {
      case 'RELEASING': return 'status-ongoing';
      case 'FINISHED': return 'status-completed';
      default: return 'status-upcoming';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'RELEASING': return 'Ongoing';
      case 'FINISHED': return 'Completed';
      default: return 'Upcoming';
    }
  };

  // Safe data access
  const safeTitle = typeof currentComic.title === 'string' 
    ? currentComic.title 
    : currentComic.title?.romaji || currentComic.title?.english || 'Unknown Title';
  
  const safeGenres = currentComic.genres || [];
  const safeRating = currentComic.rating || 'N/A';
  const safeChapters = currentComic.chapters || '?';
  const safeDescription = currentComic.description || 'No description available';

  // Main render
  return (
    <div className="swipe-interface">

      {/* Comic Card with Side Action Arrows */}
      <div className="swipe-container">
        <div className="comic-card">
          {/* Side Action Arrows */}
          <button
            onClick={() => handleAction('dislike')}
            disabled={isAnimating}
            className="side-action-arrow dislike-arrow"
          >
            <X size={24} />
          </button>

          <button
            onClick={() => handleAction('like')}
            disabled={isAnimating}
            className="side-action-arrow like-arrow"
          >
            <Heart size={24} />
          </button>

          {/* Clean Comic Cover - No title or genres on image */}
          <div 
            className="comic-cover"
            style={{
              backgroundImage: `url(${currentComic.coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <div className="cover-overlay" />
            
            {/* Status Badge */}
            <div>
              <span className={`status-tag ${getStatusColor(currentComic.status)}`}>
                {getStatusText(currentComic.status)}
              </span>
            </div>

          </div>
          
          {/* Comic Info - Now includes title and genres */}
          <div className="comic-info">
            <div className="comic-header">
              <h2 className="comic-title">{safeTitle}</h2>
              
              {/* Genres */}
              {safeGenres.length > 0 && (
                <div className="genres">
                  {safeGenres.slice(0, 3).map((genre) => (
                    <span key={genre} className="genre-tag">
                      {genre}
                    </span>
                  ))}
                  {safeGenres.length > 3 && (
                    <span className="genre-more">
                      +{safeGenres.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="comic-meta">
              <div className="rating">
                <span className="star">★</span>
                <span className="rating-value">{safeRating}</span>
              </div>
              <div className="chapters">
                <BookOpen size={16} />
                <span>{safeChapters} ch</span>
              </div>
            </div>
            
            <p className="comic-description">
              {safeDescription.length > 120 
                ? `${safeDescription.substring(0, 120)}...` 
                : safeDescription
              }
            </p>
          </div>
        </div>
      </div>

      {/* Action Hint */}
      <p className="action-hint">
        Click the X or Heart to Dislike or Like the comic
      </p>
      
    </div>
  );
};

export default SwipeInterface;