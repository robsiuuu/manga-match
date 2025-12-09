const ANILIST_API_URL = "https://graphql.anilist.co";
const BACKEND_URL = "http://localhost:3001";

// Helper functions
const transformAniListData = (media) => ({
  id: media.id,
  title: media.title.english || media.title.romaji,
  coverImage: media.coverImage.large,
  rating: media.averageScore ? (media.averageScore / 20).toFixed(1) : "N/A",
  chapters: media.chapters || "?",
  status: media.status,
  format: media.format || "MANGA",
  genres: media.genres || [],
  description: media.description
    ? media.description.replace(/<[^>]*>/g, "").substring(0, 150) + "..."
    : "No description available",
});

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const api = {
  // Get comics from AniList
  getComics: async () => {
    try {
      const randomPage = Math.floor(Math.random() * 50) + 1;
      
      const response = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query ($page: Int, $perPage: Int) {
              Page(page: $page, perPage: $perPage) {
                media(type: MANGA, sort: POPULARITY_DESC) {
                  id
                  title { romaji english }
                  coverImage { large }
                  description
                  averageScore
                  chapters
                  status
                  format
                  genres
                }
              }
            }
          `,
          variables: { page: randomPage, perPage: 50 },
        }),
      });

      const data = await response.json();
      const media = data.data?.Page?.media || [];
      const transformed = shuffleArray(media).map(transformAniListData);
      
      return transformed;
    } catch (error) {
      console.error("❌ AniList error:", error);
      throw error;
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
          return { liked: [], saved: [], reading: [] };
        }
        throw new Error(`Failed to fetch lists: ${response.status}`);
      }
      
      const data = await response.json();
      return data.lists || data.data || {};
    } catch (error) {
      console.error("❌ Get lists error:", error);
      return { liked: [], saved: [], reading: [] };
    }
  },

  // Create list - ADD THIS FUNCTION
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

  // Add comic to list - ADD THIS FUNCTION
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

  // Remove comic from list - ADD THIS FUNCTION
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

  // Get comics batch
  getComicsBatch: async (ids) => {
    try {
      if (!ids || ids.length === 0) return [];

      const response = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query ($ids: [Int]) {
              Page {
                media(id_in: $ids, type: MANGA) {
                  id
                  title { romaji english native }
                  coverImage { large extraLarge color }
                  description
                  averageScore
                  chapters
                  status
                  format
                  genres
                }
              }
            }
          `,
          variables: { ids: ids.map(id => parseInt(id)) },
        }),
      });

      const data = await response.json();
      const media = data.data?.Page?.media || [];
      return media.map(transformAniListData);
    } catch (error) {
      console.error("❌ Batch fetch error:", error);
      return [];
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