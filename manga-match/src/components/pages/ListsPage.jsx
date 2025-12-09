import React, { useState, useEffect } from 'react';
import { ArrowLeft, Folder, BookOpen, ChevronRight, X, Edit2, Trash2, Plus, AlertCircle } from 'lucide-react';
import { api } from '../../api';
import '../styles/ListsPage.css';

const ListsPage = ({ lists, comics, onBackClick, onUpdateLists }) => {
  const [selectedList, setSelectedList] = useState(null);
  const [listComics, setListComics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewComicsData, setPreviewComicsData] = useState({});
  const [editingList, setEditingList] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingListName, setEditingListName] = useState('');

  // Load preview comics data for all lists
  useEffect(() => {
    const loadPreviewComics = async () => {
      try {
        const allComicIds = new Set();
        Object.values(lists || {}).forEach(comicIds => {
          if (comicIds && Array.isArray(comicIds)) {
            comicIds.forEach(id => allComicIds.add(id));
          }
        });

        if (allComicIds.size > 0) {
          const comicIdsArray = Array.from(allComicIds);
          const aniListIds = comicIdsArray.map(id => parseInt(id)).filter(id => !isNaN(id));
          
          if (aniListIds.length > 0) {
            const comicsData = await api.getComicsBatch(aniListIds);
            const comicsMap = {};
            comicsData.forEach(comic => {
              if (comic && comic.id) {
                comicsMap[comic.id] = comic;
              }
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
    // First check preview data
    if (previewComicsData && previewComicsData[id]) {
      return previewComicsData[id];
    }
    // Then check comics prop with null check
    if (comics && Array.isArray(comics)) {
      const currentComic = comics.find(comic => comic && comic.id === id);
      return currentComic || null;
    }
    return null;
  };

  // Function to get preview comics for a list
  const getPreviewComics = (comicIds) => {
    if (!comicIds || !Array.isArray(comicIds)) {
      return [];
    }
    
    return comicIds
      .map(id => getComicById(id))
      .filter(comic => comic && comic.coverImage)
      .slice(0, 3);
  };

  // Remove comic from list
  const handleRemoveFromList = async (comicId) => {
    try {
      if (!selectedList || !comicId) {
        console.error('Missing list name or comic ID');
        return;
      }
      
      // Convert comicId to string for consistency
      const comicIdStr = comicId.toString();
      
      console.log(`Removing comic ${comicIdStr} from list "${selectedList}"`);
      
      // 1. Update database first
      const response = await api.removeFromList(selectedList, comicIdStr);
      
      if (!response.success) {
        console.error('API error:', response.error);
        return;
      }
      
      // 2. Update local state for immediate UI feedback
      const updatedListComics = listComics.filter(comic => comic && comic.id.toString() !== comicIdStr);
      setListComics(updatedListComics);
      
      // 3. Update lists object to keep count in sync
      if (onUpdateLists && lists && lists[selectedList]) {
        const updatedLists = { ...lists };
        
        // Remove comic from the selected list
        updatedLists[selectedList] = updatedLists[selectedList].filter(id => 
          id && id.toString() !== comicIdStr
        );
        
        // 4. Update preview data to remove the comic
        const newPreviewData = { ...previewComicsData };
        delete newPreviewData[comicId];
        delete newPreviewData[comicIdStr];
        setPreviewComicsData(newPreviewData);
        
        // 5. Call parent callback to update global state
        onUpdateLists(updatedLists);
      }
      
      console.log(`Successfully removed comic ${comicIdStr} from ${selectedList}`);
      
    } catch (error) {
      console.error('Error removing comic from list:', error);
      setErrorMessage('Failed to remove comic. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Rename list
  const handleRenameList = async (oldName, newName) => {
    try {
      if (!newName || newName.trim() === '') {
        setErrorMessage('List name cannot be empty');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }
      
      if (newName === oldName) {
        setEditingList(null);
        setEditingListName('');
        return;
      }
      
      // Check if list with new name already exists
      if (lists && lists[newName.trim()]) {
        setErrorMessage('List with this name already exists');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }
      
      const response = await api.renameList(oldName, newName.trim());
      
      if (response.success) {
        // Update local state
        if (onUpdateLists) {
          const updatedLists = { ...lists };
          updatedLists[newName.trim()] = updatedLists[oldName];
          delete updatedLists[oldName];
          onUpdateLists(updatedLists);
          
          // If currently viewing this list, update selected list
          if (selectedList === oldName) {
            setSelectedList(newName.trim());
          }
        }
        
        setEditingList(null);
        setEditingListName('');
      }
    } catch (error) {
      console.error('Error renaming list:', error);
      setErrorMessage(error.message || 'Failed to rename list');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Delete list
  const handleDeleteList = async (listName) => {
    if (!window.confirm(`Are you sure you want to delete "${listName}"? This will remove all comics from this list.`)) {
      return;
    }
    
    try {
      const response = await api.deleteList(listName);
      
      if (response.success) {
        // Update local state
        if (onUpdateLists) {
          const updatedLists = { ...lists };
          delete updatedLists[listName];
          onUpdateLists(updatedLists);
          
          // If currently viewing this list, go back to lists overview
          if (selectedList === listName) {
            setSelectedList(null);
            setListComics([]);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      setErrorMessage(error.message || 'Failed to delete list');
      setTimeout(() => setErrorMessage(''), 3000);
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
            setListComics(comicsData || []);
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

  const safeLists = lists || {};

  // If a list is selected, show its contents
  if (selectedList) {
    return (
      <div className="lists-page">
        <div className="page-header">
          <div className="header-actions">
            <button 
              onClick={() => {
                setSelectedList(null);
                setEditingList(null);
              }}
              className="back-button"
            >
              <ArrowLeft size={20} />
              All Lists
            </button>
            <div className="list-actions">
              <button 
                className="action-btn edit-btn"
                onClick={() => {
                  setEditingList(selectedList);
                  setEditingListName(selectedList);
                }}
                title="Rename list"
              >
                <Edit2 size={16} />
              </button>
              <button 
                className="action-btn delete-btn"
                onClick={() => handleDeleteList(selectedList)}
                title="Delete list"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          {editingList === selectedList ? (
            <div className="edit-list-form">
              <input
                type="text"
                value={editingListName}
                onChange={(e) => setEditingListName(e.target.value)}
                placeholder="Enter new list name"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleRenameList(selectedList, editingListName)}
              />
              <div className="edit-form-actions">
                <button 
                  onClick={() => handleRenameList(selectedList, editingListName)}
                  className="save-btn"
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    setEditingList(null);
                    setEditingListName('');
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <h2 className="list-title">{selectedList}</h2>
          )}
          
          {listComics.length > 0 && (
            <p className="list-stats">{listComics.length} comic{listComics.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        {errorMessage && (
          <div className="error-message">
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="loading">Loading comics...</div>
        ) : listComics.length > 0 ? (
          <div className="list-comics-grid">
            {listComics.map(comic => (
              <div key={comic.id} className="list-comic-card">
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
        <div className="header-main">
          <button onClick={onBackClick} className="back-button">
            <ArrowLeft size={20} />
            Back to Discovery
          </button>
        </div>
        
      </div>

      {errorMessage && (
        <div className="error-message">
          <AlertCircle size={16} />
          {errorMessage}
        </div>
      )}

      <div className="lists-overview">
        {Object.entries(safeLists).map(([listName, comicIds]) => {
          const previewComics = getPreviewComics(comicIds || []);
          const totalComics = comicIds ? comicIds.length : 0;
          
          return (
            <div 
              key={listName} 
              className="list-item"
              onClick={() => !editingList && setSelectedList(listName)}
            >
              <div className="list-item-header">
                <Folder size={20} />
                <div className="list-item-info">
                  <div className="list-title-row">
                    {editingList === listName ? (
                      <input
                        type="text"
                        value={editingListName}
                        onChange={(e) => setEditingListName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameList(listName, editingListName);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="edit-input-inline"
                      />
                    ) : (
                      <h3>{listName}</h3>
                    )}
                    <span className="count-badge">{totalComics}</span>
                  </div>
                  <p>{totalComics} comic{totalComics !== 1 ? 's' : ''}</p>
                </div>
                <div className="list-actions">
                  {editingList !== listName && (
                    <>
                      <button 
                        className="action-btn edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingList(listName);
                          setEditingListName(listName);
                        }}
                        title="Rename list"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(listName);
                        }}
                        title="Delete list"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  {editingList !== listName && <ChevronRight size={20} className="chevron" />}
                  {editingList === listName && (
                    <div className="inline-edit-actions">
                      <button 
                        className="action-btn save-btn-inline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameList(listName, editingListName);
                        }}
                        title="Save"
                      >
                        ✓
                      </button>
                      <button 
                        className="action-btn cancel-btn-inline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingList(null);
                          setEditingListName('');
                        }}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
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
                  {(comicIds || []).slice(0, 3).map((comicId, index) => (
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