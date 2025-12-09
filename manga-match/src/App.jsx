import { useState, useEffect } from "react";
import Header from "./components/layout/Header";
import SwipeInterface from "./components/layout/SwipeInterface";
import LikedPage from "./components/pages/LikedPage";
import ListsPage from "./components/pages/ListsPage";
import LoginPage from "./components/pages/LoginPage";
import { api } from "./api";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("discover");
  const [comics, setComics] = useState([]);
  const [likedComics, setLikedComics] = useState([]);
  const [likedComicsWithData, setLikedComicsWithData] = useState([]);
  const [lists, setLists] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [swipeKey, setSwipeKey] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // ============ IMPROVED AUTH CHECK ============
  const checkAuthStatus = async () => {
    try {
      const authStatus = await api.checkAuthStatus();

      if (authStatus.isAuthenticated) {
        if (!user || user._id !== authStatus.user._id) {
          console.log("✅ User authenticated:", authStatus.user.name);
          setUser(authStatus.user);

          // Load user data
          const [userLikes, userLists] = await Promise.all([
            api.getLikedComics(),
            api.getLists(),
          ]);

          setLikedComics(userLikes);
          setLists(userLists);
        }
        return true;
      } else {
        if (user !== null) {
          console.log("👋 User logged out");
          setUser(null);
          setLikedComics([]);
          setLists({});
        }
        return false;
      }
    } catch (error) {
      console.error("Auth check error:", error);
      return false;
    }
  };

  // ============ MESSAGE LISTENER FOR OAUTH POPUP ============
  useEffect(() => {
    const handleMessage = async (event) => {
      console.log("📨 Message received from:", event.origin, event.data);

      // Only accept messages from our CLIENT_BASE_URL
      const allowedOrigin = import.meta.env.PROD
        ? window.location.origin // Same origin in production
        : "http://localhost:5173"; // Frontend in development

      if (event.origin !== allowedOrigin) {
        console.log("Blocked message from unauthorized origin:", event.origin);
        return;
      }

      if (event.data?.type === "AUTH_SUCCESS") {
        console.log("✅ AUTH_SUCCESS message received");

        // Close the popup if we can
        try {
          if (event.source && !event.source.closed) {
            event.source.close();
          }
        } catch (e) {
          // Ignore close errors
        }

        // Immediately check auth status
        setLoading(true);
        try {
          const isAuthenticated = await checkAuthStatus();

          if (isAuthenticated) {
            // Refresh comics with user preferences
            const comicsData = await api.getComics();
            setComics(comicsData);

            // Navigate to discover
            setCurrentPage("discover");

            // Show success message
            setShowLoginPrompt(false);

            // Optional: Show a success toast
            alert("Login successful! Welcome to MangaMatch!");
          } else {
            console.log("❌ Auth check failed after OAuth success");
            alert("Login failed. Please try again.");
          }
        } catch (error) {
          console.error("Error after OAuth:", error);
          alert("Error during login. Please try again.");
        } finally {
          setLoading(false);
        }
      }

      if (event.data?.type === "AUTH_ERROR") {
        console.error("❌ Auth error:", event.data.error);
        alert("Login failed: " + (event.data.error || "Unknown error"));
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [user]);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);

        // Check auth status
        await checkAuthStatus();

        // Load comics for discovery
        const comicsData = await api.getComics();
        setComics(comicsData);
      } catch (error) {
        console.error("Initialization error:", error);
        setError("Failed to load app");

        // Reset state on error
        setUser(null);
        setLikedComics([]);
        setLists({});
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Load liked comics data
  useEffect(() => {
    const loadLikedComicsData = async () => {
      if (likedComics.length > 0) {
        try {
          const likedComicsData = await api.getComicsBatch(likedComics);
          setLikedComicsWithData(likedComicsData);
        } catch (error) {
          console.error("Error loading liked comics:", error);
          setLikedComicsWithData([]);
        }
      } else {
        setLikedComicsWithData([]);
      }
    };

    loadLikedComicsData();
  }, [likedComics]);

  // ============ IMPROVED GOOGLE LOGIN ============
  const handleGoogleLogin = () => {
    console.log("Opening Google OAuth...");

    // Generate unique state to prevent CSRF
    const state = Math.random().toString(36).substring(2);

    // Calculate popup position (centered)
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Determine backend URL based on environment
    const backendUrl = import.meta.env.PROD
      ? window.location.origin // Same origin in production
      : "http://localhost:3001";

    // Open popup
    const popup = window.open(
      `${backendUrl}/auth/google?state=${state}&redirect=popup`,
      "google_auth",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      alert("Popup blocked! Please allow popups for this site.");
      return;
    }

    // Check for popup closure as fallback
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        console.log("Popup closed, checking auth status...");

        // Fallback check if message didn't come through
        setTimeout(async () => {
          await checkAuthStatus();
        }, 1500);
      }
    }, 1000);

    // Clean up
    setTimeout(() => {
      clearInterval(checkPopup);
    }, 30000);
  };

  // Logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      await api.logout();

      // Reset all user state
      setUser(null);
      setLikedComics([]);
      setLists({});
      setCurrentPage("discover");

      // Refresh comics for guest mode
      const comicsData = await api.getComics();
      setComics(comicsData);
    } catch (error) {
      console.error("Logout error:", error);
      // Still reset local state
      setUser(null);
      setLikedComics([]);
      setLists({});
    } finally {
      setLoading(false);
    }
  };

  // Guest continue
  const handleGuestContinue = () => {
    setUser(null);
    setLikedComics([]);
    setLists({});
    setCurrentPage("discover");
    setShowLoginPrompt(false);
  };

  // Randomize
  const handleRandomize = async () => {
    try {
      console.log("🔄 Randomize function called");
      setLoading(true);

      const randomComics = await api.getComics();
      console.log(`🎲 Loaded ${randomComics.length} new comics`);

      setComics(randomComics);
      setCurrentPage("discover");
      setSwipeKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to randomize comics:", error);
      setError("Failed to load new recommendations.");
    } finally {
      setLoading(false);
    }
  };

  // Like comic - with improved login prompt
  const handleLikeComic = async (comicId) => {
    try {
      // Check if user is logged in
      if (!user) {
        setShowLoginPrompt(true);
        return;
      }

      await api.likeComic(comicId);
      setLikedComics((prev) => [...prev, comicId]);
    } catch (error) {
      console.error("Like error:", error);

      // If unauthorized, show login prompt
      if (error.response?.status === 401 || error.message.includes("login")) {
        setShowLoginPrompt(true);
      }
    }
  };

  // Dislike comic
  const handleDislikeComic = async (comicId) => {
    try {
      if (!user) {
        setLikedComics((prev) => prev.filter((id) => id !== comicId));
        return;
      }

      await api.unlikeComic(comicId);
      setLikedComics((prev) => prev.filter((id) => id !== comicId));
    } catch (error) {
      console.error("Dislike error:", error);
      setLikedComics((prev) => prev.filter((id) => id !== comicId));
    }
  };

  // Create list
  const handleCreateList = async (listName) => {
    try {
      if (!user) {
        setShowLoginPrompt(true);
        return;
      }

      await api.createList(listName);

      const updatedLists = await api.getLists();
      setLists(updatedLists);
    } catch (error) {
      console.error("Create list error:", error);
      alert(error.message || "Failed to create list");
    }
  };

  // Add to list
  const handleAddToList = async (comicId, listName, isRemove = false) => {
    try {
      if (!user) {
        setShowLoginPrompt(true);
        return;
      }

      if (isRemove) {
        await api.removeFromList(listName, comicId);
      } else {
        await api.addToList(listName, comicId);
      }

      setLists((prev) => {
        const newLists = { ...prev };
        if (!newLists[listName]) newLists[listName] = [];

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
      console.error("List update error:", error);
    }
  };

  // Close login prompt
  const closeLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  // Loading state
  if (loading && comics.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div>Loading MangaMatch...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error">
        <div>{error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Show login page if no user and not on discover page
  if (!user && currentPage !== "discover") {
    return (
      <LoginPage
        onGoogleLogin={handleGoogleLogin}
        onGuestContinue={handleGuestContinue}
      />
    );
  }

  // Main app
  return (
    <div className="app">
      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="login-prompt-modal">
          <div className="login-prompt-content">
            <h3>Login Required</h3>
            <p>Please login to save your likes and create lists!</p>
            <div className="login-prompt-buttons">
              <button onClick={handleGoogleLogin} className="btn-google">
                Login with Google
              </button>
              <button onClick={closeLoginPrompt} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Header
        user={user}
        onLogout={handleLogout}
        onGoogleLogin={handleGoogleLogin}
        likedCount={likedComics.length}
        onLikedClick={() => {
          if (user) {
            setCurrentPage("liked");
          } else {
            setShowLoginPrompt(true);
          }
        }}
        onListsClick={() => {
          if (user) {
            setCurrentPage("lists");
          } else {
            setShowLoginPrompt(true);
          }
        }}
        onRandomize={handleRandomize}
        currentView={currentPage}
      />

      {currentPage === "discover" ? (
        <SwipeInterface
          key={swipeKey}
          onLike={handleLikeComic}
          onDislike={handleDislikeComic}
          comics={comics}
          loading={loading}
        />
      ) : currentPage === "liked" ? (
        <LikedPage
          likedComics={likedComicsWithData}
          lists={lists}
          user={user}
          onBackClick={() => setCurrentPage("discover")}
          onCreateList={handleCreateList}
          onAddToList={handleAddToList}
          onRemoveLike={handleDislikeComic}
          onSignIn={handleGoogleLogin}
        />
      ) : (
        <ListsPage
          lists={lists}
          comics={comics}
          user={user}
          onBackClick={() => setCurrentPage("discover")}
          onUpdateLists={setLists}
          onSignIn={handleGoogleLogin}
        />
      )}
    </div>
  );
}

export default App;
