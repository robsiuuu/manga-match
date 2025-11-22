import React, { useState, useEffect } from 'react';
import { ArrowLeft, Folder, BookOpen, ChevronRight, X } from 'lucide-react';
import { api } from '../../api';
import '../styles/ListsPage.css';

const ListsPage = ({ lists, comics, onBackClick, onUpdateLists }) => {
  const [selectedList, setSelectedList] = useState(null);
  const [listComics, setListComics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewComicsData, setPreviewComicsData] = useState({});

  // Load preview comics data for all lists
  useEffect(() => {
    const loadPreviewComics = async () => {
      try {
        // Get all unique comic IDs from all lists
        const allComicIds = new Set();
        Object.values(lists || {}).forEach(comicIds => {
          comicIds.forEach(id => allComicIds.add(id));
        });

        if (allComicIds.size > 0) {
          const comicIdsArray = Array.from(allComicIds);
          
          // Convert to integers for AniList API
          const aniListIds = comicIdsArray.map(id => parseInt(id)).filter(id => !isNaN(id));
          
          if (aniListIds.length > 0) {
            const comicsData = await api.getComicsBatch(aniListIds);
            
            // Create a map for quick lookup
            const comicsMap = {};
            comicsData.forEach(comic => {
              comicsMap[comic.id] = comic;
            });
            setPreviewComicsData(comicsMap);
          }
        }
      } catch (error) {
        console.error('Error loading preview comics:', error);
      }
    };

    if (lists && Object.keys(lists).length > 0) {
      loadPreviewComics();
    }
  }, [lists]);

  // Function to get comic data by ID
  const getComicById = (id) => {
    if (previewComicsData[id]) {
      return previewComicsData[id];
    }
    const currentComic = comics.find(comic => comic.id === id);
    return currentComic || null;
  };

  // Function to get preview comics for a list
  const getPreviewComics = (comicIds) => {
    return comicIds
      .map(id => getComicById(id))
      .filter(comic => comic && comic.coverImage)
      .slice(0, 3);
  };

  // Remove comic from list using your Neon database endpoint
  const handleRemoveFromList = async (comicId) => {
    try {
      // Use the remove endpoint for your Neon database
      await api.removeFromList(selectedList, comicId);
      
      // Update local state
      const updatedListComics = listComics.filter(comic => comic.id !== comicId);
      setListComics(updatedListComics);
      
      // Update parent component
      if (onUpdateLists) {
        const updatedLists = { ...lists };
        updatedLists[selectedList] = updatedLists[selectedList].filter(id => id !== comicId);
        onUpdateLists(updatedLists);
      }
    } catch (error) {
      console.error('Error removing comic from list:', error);
    }
  };

  // Load comic details when a list is selected
  useEffect(() => {
    const loadListComics = async () => {
      if (selectedList && lists && lists[selectedList]) {
        setLoading(true);
        try {
          const comicIds = lists[selectedList];
          const aniListIds = comicIds.map(id => parseInt(id)).filter(id => !isNaN(id));
          
          if (aniListIds.length > 0) {
            const comicsData = await api.getComicsBatch(aniListIds);
            setListComics(comicsData);
          } else {
            setListComics([]);
          }
        } catch (error) {
          console.error('Error loading list comics:', error);
          setListComics([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadListComics();
  }, [selectedList, lists]);

  // Safe access to lists
  const safeLists = lists || {};

  // If a list is selected, show its contents
  if (selectedList) {
    return (
      <div className="lists-page">
        <div className="page-header">
          <button 
            onClick={() => setSelectedList(null)}
            className="back-button"
          >
            <ArrowLeft size={20} />
            Back to Lists
          </button>
          <h2 className="list-title">{selectedList}</h2>
        </div>

        {loading ? (
          <div className="loading">Loading comics...</div>
        ) : listComics.length > 0 ? (
          <div className="list-comics-grid">
            {listComics.map(comic => (
              <div key={comic.id} className="list-comic-card">
                {/* Remove Button */}
                <button 
                  className="remove-from-list-btn"
                  onClick={() => handleRemoveFromList(comic.id)}
                  title="Remove from list"
                >
                  <X size={16} />
                </button>

                <img 
                  src={comic.coverImage} 
                  alt={comic.title}
                  className="list-comic-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x300?text=No+Image';
                  }}
                />
                <div className="list-comic-info">
                  <h3>{comic.title}</h3>
                  <div className="comic-meta">
                    {comic.rating && comic.rating !== 'N/A' && (
                      <span className="rating">★ {comic.rating}</span>
                    )}
                    {comic.chapters && comic.chapters !== '?' && (
                      <span className="chapters">{comic.chapters} ch</span>
                    )}
                  </div>
                  {comic.genres && comic.genres.length > 0 && (
                    <div className="genres">
                      {comic.genres.slice(0, 2).map((genre) => (
                        <span key={genre} className="genre-tag">{genre}</span>
                      ))}
                    </div>
                  )}
                  <p className="comic-description">
                    {comic.description || 'No description available'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-list">
            <BookOpen size={48} />
            <h3>No comics in this list yet</h3>
            <p>Add some comics from your liked page to get started!</p>
          </div>
        )}
      </div>
    );
  }

  // Main lists overview
  return (
    <div className="lists-page">
      <div className="page-header">
        <button onClick={onBackClick} className="back-button">
          <ArrowLeft size={20} />
          Back to Discovery
        </button>
      </div>

      <div className="lists-overview">
        {Object.entries(safeLists).map(([listName, comicIds]) => {
          const previewComics = getPreviewComics(comicIds);
          const totalComics = comicIds.length;
          
          return (
            <div 
              key={listName} 
              className="list-item"
              onClick={() => setSelectedList(listName)}
            >
              <div className="list-item-header">
                <Folder size={20} />
                <div className="list-item-info">
                  <h3>{listName}</h3>
                  <p>{totalComics} comic{totalComics !== 1 ? 's' : ''}</p>
                </div>
                <ChevronRight size={20} className="chevron" />
              </div>
              
              {/* Preview of comics in this list */}
              {previewComics.length > 0 ? (
                <div className="list-preview">
                  {previewComics.map((comic) => (
                    <img 
                      key={comic.id}
                      src={comic.coverImage} 
                      alt={comic.title}
                      className="preview-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/60x80?text=No+Image';
                        e.target.className = 'preview-cover placeholder';
                      }}
                    />
                  ))}
                  {totalComics > 3 && (
                    <div className="preview-more">+{totalComics - 3} more</div>
                  )}
                </div>
              ) : totalComics > 0 ? (
                // Show loading placeholders
                <div className="list-preview">
                  {comicIds.slice(0, 3).map((comicId, index) => (
                    <div key={index} className="preview-cover placeholder">
                      <BookOpen size={16} />
                    </div>
                  ))}
                  {totalComics > 3 && (
                    <div className="preview-more">+{totalComics - 3} more</div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}

        {Object.keys(safeLists).length === 0 && (
          <div className="empty-lists">
            <Folder size={64} />
            <h3>No lists yet</h3>
            <p>Create your first list from the Liked page!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListsPage;