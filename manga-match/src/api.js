// Use Vite's environment variable for production
const BACKEND_URL = import.meta.env.PROD 
  ? ''  // Empty string for same origin in production
  : 'http://localhost:3001';

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Fallback mock data for when AniList fails
const getMockComics = () => {
  const mockComics = [
    {
      id: 1,
      title: "One Piece",
      coverImage: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx13-5pFWB2e0n2n8.jpg",
      rating: "8.7",
      chapters: "1100+",
      status: "RELEASING",
      genres: ["Action", "Adventure", "Comedy", "Drama", "Fantasy"],
      description: "Follow Monkey D. Luffy and his pirate crew as they search for the world's ultimate treasure..."
    },
    {
      id: 2,
      title: "Naruto",
      coverImage: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx44-nWcJgLvAM6pV.jpg",
      rating: "8.2",
      chapters: "700",
      status: "FINISHED",
      genres: ["Action", "Adventure", "Fantasy"],
      description: "Naruto Uzumaki, a young ninja who seeks recognition from his peers and dreams of becoming the Hokage..."
    },
    {
      id: 3,
      title: "Bleach",
      coverImage: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx51-c4TGro2T71cE.jpg",
      rating: "7.8",
      chapters: "686",
      status: "FINISHED",
      genres: ["Action", "Adventure", "Supernatural"],
      description: "High school student Ichigo Kurosaki gains the powers of a Soul Reaper and must defend humans from evil spirits..."
    },
    {
      id: 4,
      title: "Demon Slayer",
      coverImage: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx101922-wYSikHVxDuMA.jpg",
      rating: "8.4",
      chapters: "205",
      status: "FINISHED",
      genres: ["Action", "Historical", "Supernatural"],
      description: "After his family is slaughtered, Tanjiro Kamado becomes a demon slayer to cure his sister..."
    },
    {
      id: 5,
      title: "Jujutsu Kaisen",
      coverImage: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx113138-CQCqF4vBvGX7.jpg",
      rating: "8.5",
      chapters: "247+",
      status: "RELEASING",
      genres: ["Action", "Fantasy", "Supernatural"],
      description: "Yuji Itadori swallows a cursed object and becomes host to a powerful curse, entering the world of jujutsu sorcerers..."
    }
  ];
  return shuffleArray(mockComics);
};

export const api = {
  // Get comics from AniList through backend proxy
  getComics: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/anilist/comics`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch comics: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Comics fetch error, using mock data:", error);
      return getMockComics();
    }
  },

  // Like comic
  likeComic: async (comicId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/likes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        credentials: 'include',
        body: JSON.stringify({ comicId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to like comics');
        }
        throw new Error(`Failed to like comic: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Like error:", error);
      throw error;
    }
  },

  // Get liked comics
  getLikedComics: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/likes`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return [];
        }
        throw new Error(`Failed to fetch liked comics: ${response.status}`);
      }
      
      const data = await response.json();
      return data.likedComics || data.data || [];
    } catch (error) {
      console.error("❌ Get likes error:", error);
      return [];
    }
  },

  // Unlike comic
  unlikeComic: async (comicId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/likes`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json" 
        },
        credentials: 'include',
        body: JSON.stringify({ comicId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to unlike comics');
        }
        throw new Error(`Failed to unlike comic: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Unlike error:", error);
      throw error;
    }
  },

  // Get lists
  getLists: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/lists`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return {};
        }
        throw new Error(`Failed to fetch lists: ${response.status}`);
      }
      
      const data = await response.json();
      return data.lists || data.data || {};
    } catch (error) {
      console.error("❌ Get lists error:", error);
      return {};
    }
  },

  // Create list
  createList: async (listName) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/lists`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        credentials: 'include',
        body: JSON.stringify({ listName }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to create lists');
        }
        throw new Error(`Failed to create list: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("❌ Create list error:", error);
      throw error;
    }
  },

  // Add comic to list
  addToList: async (listName, comicId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/lists/${listName}/add`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        credentials: 'include',
        body: JSON.stringify({ comicId }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to add to lists');
        }
        throw new Error(`Failed to add to list: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("❌ Add to list error:", error);
      throw error;
    }
  },

  // Remove comic from list
  removeFromList: async (listName, comicId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/lists/${listName}/remove`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        credentials: 'include',
        body: JSON.stringify({ comicId }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to remove from lists');
        }
        throw new Error(`Failed to remove from list: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("❌ Remove from list error:", error);
      throw error;
    }
  },

  // Get comics batch through backend proxy
  getComicsBatch: async (ids) => {
    try {
      if (!ids || ids.length === 0) return [];

      const response = await fetch(`${BACKEND_URL}/api/anilist/batch`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        credentials: 'include',
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch batch: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Batch fetch error, using mock data:", error);
      const mockComics = getMockComics();
      return mockComics.filter(comic => ids.includes(comic.id.toString()));
    }
  },

  // Check auth status
  checkAuthStatus: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // Fix picture URL if needed
        if (userData.picture) {
          if (userData.picture.startsWith('//')) {
            userData.picture = 'https:' + userData.picture;
          }
        }
        
        return { isAuthenticated: true, user: userData };
      } else if (response.status === 401) {
        return { isAuthenticated: false, user: null };
      } else {
        console.error('Auth check failed with status:', response.status);
        return { isAuthenticated: false, user: null };
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      return { isAuthenticated: false, user: null };
    }
  },

  // Login with Google
  loginWithGoogle: () => {
    window.location.href = `${BACKEND_URL}/auth/google`;
  },

  // Logout
  logout: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ Logout error:', error);
      return false;
    }
  },
};