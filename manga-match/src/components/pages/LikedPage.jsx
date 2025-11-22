import React, { useState } from "react";
import { ArrowLeft, Plus, X, Folder } from "lucide-react";
import "../styles/LikedPage.css";

const LikedPage = ({
  likedComics,
  lists,
  onBackClick,
  onCreateList,
  onAddToList,
  onRemoveLike,
}) => {
  const [selectedComic, setSelectedComic] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [showCreateList, setShowCreateList] = useState(false);

  // Function to handle list toggling
  const handleListToggle = async (comicId, listName, isCurrentlyInList) => {
    try {
      if (isCurrentlyInList) {
        // Remove from list
        await onAddToList(comicId, listName, true); // Pass true for remove
        // Local state update handled by parent via setLists
      } else {
        // Add to list
        await onAddToList(comicId, listName);
      }
    } catch (error) {
      console.error("Error toggling list:", error);
    }
  };

  // Function to create new list
  const handleCreateNewList = async () => {
  if (newListName.trim()) {
    try {
      await onCreateList(newListName.trim());
      setNewListName('');
      setShowCreateList(false);
      
      // The list should now appear in the modal since parent component
      // will refresh the lists from the database
    } catch (error) {
      console.error('Error creating list:', error);
    }
  }
};

  // Function to get comic title by ID
  const getComicTitle = (comicId) => {
    const comic = likedComics.find((c) => c.id === comicId);
    return comic ? comic.title : "Comic";
  };

  // Function to get comic data by ID
  const getComicData = (comicId) => {
    return likedComics.find((c) => c.id === comicId);
  };

  // Render component
  return (
    <div className="liked-page">
      {/* Header */}
      <div className="page-header">
        <button onClick={onBackClick} className="back-button">
          <ArrowLeft size={20} />
          Back to Discovery
        </button>
      </div>

      {/* Comics Grid */}
      {likedComics.length > 0 ? (
        <div className="liked-comics-grid">
          {likedComics.map((comic, index) => (
            <div key={comic.id || `comic-${index}`} className="liked-comic-card">
              <img
                src={comic.coverImage}
                alt={comic.title}
                className="liked-comic-cover"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/200x300?text=No+Image";
                }}
              />

              <div className="liked-comic-info">
                <h3>{comic.title}</h3>

                <div className="comic-meta">
                  {comic.rating && (
                    <span className="rating">★ {comic.rating}</span>
                  )}
                  {comic.chapters && (
                    <span className="chapters">{comic.chapters} ch</span>
                  )}
                </div>

                <div className="genres">
                  {comic.genres &&
                    comic.genres.slice(0, 2).map((genre) => (
                      <span key={genre} className="genre-tag">
                        {genre}
                      </span>
                    ))}
                </div>

                <p className="comic-description">{comic.description}</p>

                <div className="comic-actions">
                  <button
                    className="manage-list-btn"
                    onClick={() => setSelectedComic(comic.id)}
                  >
                    <Folder size={16} />
                    Manage Lists
                  </button>

                  <button
                    className="remove-like-btn"
                    onClick={() => onRemoveLike(comic.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-liked">
          <div className="empty-icon">
            <span>♥</span>
          </div>
          <h3>No liked comics yet</h3>
          <p>Start swiping to discover and like comics!</p>
        </div>
      )}

      {/* List Management Modal */}
      {selectedComic && (
        <div className="modal-overlay" onClick={() => setSelectedComic(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Lists</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedComic(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              <div className="selected-comic-info">
                <img
                  src={getComicData(selectedComic)?.coverImage}
                  alt={getComicTitle(selectedComic)}
                  className="selected-comic-cover"
                />
                <div className="selected-comic-details">
                  <h4>{getComicTitle(selectedComic)}</h4>
                  <p>Choose which lists to add this comic to:</p>
                </div>
              </div>

              <div className="lists-section">
                <div className="section-header">
                  <h4>Your Lists</h4>
                  <button
                    className="add-list-btn"
                    onClick={() => setShowCreateList(true)}
                  >
                    <Plus size={16} />
                    New List
                  </button>
                </div>

                {Object.keys(lists).length > 0 ? (
                  <div className="lists-checkboxes">
                    {Object.entries(lists).map(([listName, comicIds]) => {
                      const isInList = comicIds.includes(selectedComic);
                      return (
                        <label key={listName} className="list-checkbox-item">
                          <input
                            type="checkbox"
                            checked={isInList}
                            onChange={() =>
                              handleListToggle(
                                selectedComic,
                                listName,
                                isInList
                              )
                            }
                          />
                          <span className="checkmark"></span>
                          <div className="list-info">
                            <span className="list-name">{listName}</span>
                            <span className="list-count">
                              {comicIds.length}{" "}
                              {comicIds.length === 1 ? "comic" : "comics"}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-lists-message">
                    <Folder size={32} />
                    <p>No lists created yet</p>
                  </div>
                )}
              </div>

              {/* Create New List Section */}
              {showCreateList && (
                <div className="create-list-section">
                  <h4>Create New List</h4>
                  <div className="create-list-input">
                    <input
                      type="text"
                      placeholder="Enter list name..."
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleCreateNewList();
                        }
                      }}
                    />
                    <div className="create-list-actions">
                      <button
                        onClick={handleCreateNewList}
                        disabled={!newListName.trim()}
                        className="create-btn"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateList(false);
                          setNewListName("");
                        }}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LikedPage;
