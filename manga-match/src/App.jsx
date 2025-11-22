import { useState, useEffect } from "react";
import Header from "./components/layout/Header";
import SwipeInterface from "./components/layout/SwipeInterface";
import LikedPage from "./components/pages/LikedPage";
import ListsPage from "./components/pages/ListsPage"; // Add this import
import { api } from "./api";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("discover");
  const [comics, setComics] = useState([]);
  const [likedComics, setLikedComics] = useState([]);
  const [likedComicsWithData, setLikedComicsWithData] = useState([]);
  const [lists, setLists] = useState({}); // Add lists state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load full comic data when likedComics changes
  useEffect(() => {
    const loadLikedComicsData = async () => {
      if (likedComics.length > 0) {
        try {
          console.log("🔄 Loading data for liked comic IDs:", likedComics);
          const likedComicsData = await api.getComicsBatch(likedComics);
          console.log("✅ Loaded liked comics data:", likedComicsData);
          setLikedComicsWithData(likedComicsData);
        } catch (error) {
          console.error("❌ Error loading liked comics data:", error);
          setLikedComicsWithData([]);
        }
      } else {
        setLikedComicsWithData([]);
      }
    };

    loadLikedComicsData();
  }, [likedComics]);

  // Load lists from database
  useEffect(() => {
    const loadLists = async () => {
      try {
        const listsData = await api.getLists();
        console.log("📋 Loaded lists:", listsData);
        setLists(listsData);
      } catch (error) {
        console.error("❌ Error loading lists:", error);
        setLists({});
      }
    };

    loadLists();
  }, []);

  // Function to load initial data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // GET request - Load random manga from AniList
      const comicsData = await api.getComics();
      // GET request - Load liked comics from backend
      const likedData = await api.getLikedComics();

      setComics(comicsData);
      setLikedComics(likedData);
      console.log(
        `Loaded ${comicsData.length} comics and ${likedData.length} liked comics`
      );
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("Failed to load manga data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add this state to your App.jsx
  const [swipeKey, setSwipeKey] = useState(0);

  // Update your handleRandomize function:
  const handleRandomize = async () => {
    try {
      console.log("🔄 Randomize function called");
      setLoading(true);

      // GET request - Load new random comics
      const randomComics = await api.getComics();
      console.log(`🎲 Loaded ${randomComics.length} new comics`);

      setComics(randomComics);
      setCurrentPage("discover");
      setSwipeKey((prev) => prev + 1); // This forces SwipeInterface to remount
    } catch (error) {
      console.error("Failed to randomize comics:", error);
      setError("Failed to load new recommendations.");
    } finally {
      setLoading(false);
    }
  };

  // Function to like a comic
  const handleLikeComic = async (comicId) => {
    try {
      // POST request - Submit like to backend
      await api.likeComic(comicId);
      setLikedComics((prev) => [...prev, comicId]);
      console.log(`Liked comic ${comicId}`);
    } catch (error) {
      console.error("Failed to like comic:", error);
    }
  };

  // Function to dislike a comic
  const handleDislikeComic = async (comicId) => {
    try {
      // POST/DELETE request - Remove like from backend
      await api.unlikeComic(comicId);
      setLikedComics((prev) => prev.filter((id) => id !== comicId));
      console.log(`Unliked comic ${comicId}`);
    } catch (error) {
      console.error("Failed to unlike comic:", error);
    }
  };

  // Add list management functions
  const handleCreateList = async (listName) => {
    try {
      await api.createList(listName);
      // Refresh lists from database to get the updated state
      const updatedLists = await api.getLists();
      setLists(updatedLists);
      console.log(`✅ List "${listName}" created and lists refreshed`);
    } catch (error) {
      console.error("Failed to create list:", error);
    }
  };

  // Function to add or remove comic from list
  const handleAddToList = async (comicId, listName, isRemove = false) => {
    try {
      if (isRemove) {
        await api.removeFromList(listName, comicId);
      } else {
        await api.addToList(listName, comicId);
      }

      // Update local state
      setLists((prev) => {
        const newLists = { ...prev };
        if (!newLists[listName]) {
          newLists[listName] = [];
        }

        if (isRemove) {
          newLists[listName] = newLists[listName].filter(
            (id) => id !== comicId
          );
        } else if (!newLists[listName].includes(comicId)) {
          newLists[listName] = [...newLists[listName], comicId];
        }

        return newLists;
      });
    } catch (error) {
      console.error("Failed to update list:", error);
    }
  };

  // Render loading, error, or main app
  if (loading && comics.length === 0) {
    return (
      <div className="loading">
        <div>Loading manga recommendations...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="error">
        <div>{error}</div>
        <button onClick={loadInitialData}>Retry</button>
      </div>
    );
  }

  // Main app render
  return (
    <div className="app">
      <Header
        likedCount={likedComics.length}
        onLikedClick={() => setCurrentPage("liked")}
        onListsClick={() => setCurrentPage("lists")} // Make sure this is here
        onRandomize={handleRandomize}
        currentView={currentPage}
      />

      {currentPage === "discover" ? (
        <SwipeInterface
          key={swipeKey} // Add this line
          onLike={handleLikeComic}
          onDislike={handleDislikeComic}
          comics={comics}
          loading={loading}
        />
      ) : currentPage === "liked" ? (
        <LikedPage
          likedComics={likedComicsWithData}
          lists={lists}
          onBackClick={() => setCurrentPage("discover")}
          onCreateList={handleCreateList}
          onAddToList={handleAddToList}
          onRemoveLike={handleDislikeComic}
        />
      ) : (
        <ListsPage
          lists={lists}
          comics={comics}
          onBackClick={() => setCurrentPage("discover")}
          onUpdateLists={setLists}
        />
      )}
    </div>
  );
}

export default App;
