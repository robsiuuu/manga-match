// Use Vite's environment variable for production
const BACKEND_URL = import.meta.env.PROD
  ? "" // Empty string for same origin in production
  : "http://localhost:3001";

const ANILIST_API_URL = "https://graphql.anilist.co";

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to transform AniList data
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

// Safe content filter for client-side (extra safety)
const filterSafeContent = (comics) => {
  const EXCLUDED_GENRES = ["Hentai", "Ecchi", "Erotica", "Adult", "Harem"];
  const ADULT_KEYWORDS = [
    "hentai",
    "ecchi",
    "ero",
    "porn",
    "xxx",
    "adult",
    "uncensored",
    "lewd",
  ];

  return comics.filter((comic) => {
    // 1. Check genres
    if (
      comic.genres &&
      comic.genres.some((genre) =>
        EXCLUDED_GENRES.some((excluded) =>
          genre.toLowerCase().includes(excluded.toLowerCase())
        )
      )
    ) {
      return false;
    }

    // 2. Check title for adult keywords
    const title = (comic.title || "").toLowerCase();
    if (ADULT_KEYWORDS.some((keyword) => title.includes(keyword))) {
      return false;
    }

    // 3. Check description (optional)
    if (comic.description) {
      const desc = comic.description.toLowerCase();
      if (ADULT_KEYWORDS.some((keyword) => desc.includes(keyword))) {
        return false;
      }
    }

    return true;
  });
};

// Fallback mock data for when AniList fails
const getMockComics = () => {
  const mockComics = [
    {
      id: 1,
      title: "One Piece",
      coverImage:
        "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx13-5pFWB2e0n2n8.jpg",
      rating: "8.7",
      chapters: "1100+",
      status: "RELEASING",
      genres: ["Action", "Adventure", "Comedy", "Drama", "Fantasy"],
      description:
        "Follow Monkey D. Luffy and his pirate crew as they search for the world's ultimate treasure...",
    },
    {
      id: 2,
      title: "Naruto",
      coverImage:
        "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx44-nWcJgLvAM6pV.jpg",
      rating: "8.2",
      chapters: "700",
      status: "FINISHED",
      genres: ["Action", "Adventure", "Fantasy"],
      description:
        "Naruto Uzumaki, a young ninja who seeks recognition from his peers and dreams of becoming the Hokage...",
    },
    {
      id: 3,
      title: "Bleach",
      coverImage:
        "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx51-c4TGro2T71cE.jpg",
      rating: "7.8",
      chapters: "686",
      status: "FINISHED",
      genres: ["Action", "Adventure", "Supernatural"],
      description:
        "High school student Ichigo Kurosaki gains the powers of a Soul Reaper and must defend humans from evil spirits...",
    },
    {
      id: 4,
      title: "Demon Slayer",
      coverImage:
        "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx101922-wYSikHVxDuMA.jpg",
      rating: "8.4",
      chapters: "205",
      status: "FINISHED",
      genres: ["Action", "Historical", "Supernatural"],
      description:
        "After his family is slaughtered, Tanjiro Kamado becomes a demon slayer to cure his sister...",
    },
    {
      id: 5,
      title: "Jujutsu Kaisen",
      coverImage:
        "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx113138-CQCqF4vBvGX7.jpg",
      rating: "8.5",
      chapters: "247+",
      status: "RELEASING",
      genres: ["Action", "Fantasy", "Supernatural"],
      description:
        "Yuji Itadori swallows a cursed object and becomes host to a powerful curse, entering the world of jujutsu sorcerers...",
    },
  ];
  return shuffleArray(mockComics);
};

export const api = {
  // Get comics from AniList with content filtering
  getComics: async () => {
    try {
      console.log("📚 Fetching comics from AniList...");

      const randomPage = Math.floor(Math.random() * 50) + 1;

      const response = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query ($page: Int, $perPage: Int) {
              Page(page: $page, perPage: $perPage) {
                media(
                  type: MANGA, 
                  sort: POPULARITY_DESC,
                  isAdult: false,
                  genre_not_in: ["Hentai", "Ecchi", "Erotica", "Harem"]
                ) {
                  id
                  title { romaji english }
                  coverImage { large }
                  description
                  averageScore
                  chapters
                  status
                  format
                  genres
                  isAdult
                }
              }
            }
          `,
          variables: { page: randomPage, perPage: 50 },
        }),
      });

      const data = await response.json();
      const media = data.data?.Page?.media || [];

      console.log(`✅ Received ${media.length} comics from AniList`);

      // Filter out any adult content that might have slipped through
      const safeMedia = media.filter((item) => !item.isAdult);

      // Transform data
      const transformed = safeMedia.map(transformAniListData);

      // Apply extra client-side filtering
      const filtered = filterSafeContent(transformed);

      console.log(`🛡️  Filtered to ${filtered.length} safe comics`);

      return shuffleArray(filtered);
    } catch (error) {
      console.error("❌ AniList error, using mock data:", error);
      return getMockComics();
    }
  },

  // Like comic
  likeComic: async (comicId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ comicId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please login to like comics");
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
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
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ comicId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please login to unlike comics");
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
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

  // Rename list
  renameList: async (oldListName, newListName) => {
    try {
      console.log(`✏️ Renaming list "${oldListName}" to "${newListName}"`);

      const response = await fetch(
        `${BACKEND_URL}/api/lists/${oldListName}/rename`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ newListName }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to rename list: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("✅ Rename response:", data);
      return data;
    } catch (error) {
      console.error("❌ Rename list error:", error);
      throw error;
    }
  },

  // Delete list
  deleteList: async (listName) => {
    try {
      console.log(`🗑️ Deleting list "${listName}"`);

      const response = await fetch(`${BACKEND_URL}/api/lists/${listName}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to delete list: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("✅ Delete response:", data);
      return data;
    } catch (error) {
      console.error("❌ Delete list error:", error);
      throw error;
    }
  },

  // Create list
  createList: async (listName) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ listName }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please login to create lists");
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
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ comicId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please login to add to lists");
        }
        throw new Error(`Failed to add to list: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Add to list error:", error);
      throw error;
    }
  },

  // Remove comic from list - FIXED VERSION
  removeFromList: async (listName, comicId) => {
    try {
      console.log(`🗑️ Removing comic ${comicId} from list "${listName}"`);

      // Make sure comicId is a string for the API
      const comicIdStr = comicId.toString();

      const response = await fetch(
        `${BACKEND_URL}/api/lists/${listName}/remove`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ comicId: comicIdStr }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to remove from list: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("✅ Remove response:", data);
      return data;
    } catch (error) {
      console.error("❌ Remove from list error:", error);
      throw error;
    }
  },

  // Get comics batch with content filtering
  getComicsBatch: async (ids) => {
    try {
      if (!ids || ids.length === 0) return [];

      console.log(`📦 Fetching batch of ${ids.length} comics from AniList...`);

      const response = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query ($ids: [Int]) {
              Page {
                media(
                  id_in: $ids, 
                  type: MANGA,
                  isAdult: false,
                  genre_not_in: ["Hentai", "Ecchi", "Erotica"]
                ) {
                  id
                  title { romaji english native }
                  coverImage { large extraLarge color }
                  description
                  averageScore
                  chapters
                  status
                  format
                  genres
                  isAdult
                }
              }
            }
          `,
          variables: { ids: ids.map((id) => parseInt(id)) },
        }),
      });

      const data = await response.json();
      const media = data.data?.Page?.media || [];

      console.log(`✅ Received ${media.length} comics in batch`);

      // Filter out any adult content
      const safeMedia = media.filter((item) => !item.isAdult);

      // Transform data
      const transformed = safeMedia.map(transformAniListData);

      // Apply extra client-side filtering
      const filtered = filterSafeContent(transformed);

      console.log(`🛡️  Filtered to ${filtered.length} safe comics in batch`);
      return filtered;
    } catch (error) {
      console.error("❌ Batch fetch error, using mock data:", error);
      const mockComics = getMockComics();
      return mockComics.filter((comic) => ids.includes(comic.id.toString()));
    }
  },

  // Check auth status
  checkAuthStatus: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();

        // Fix picture URL if needed
        if (userData.picture) {
          if (userData.picture.startsWith("//")) {
            userData.picture = "https:" + userData.picture;
          }
        }

        return { isAuthenticated: true, user: userData };
      } else if (response.status === 401) {
        return { isAuthenticated: false, user: null };
      } else {
        console.error("Auth check failed with status:", response.status);
        return { isAuthenticated: false, user: null };
      }
    } catch (error) {
      console.error("❌ Auth check error:", error);
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
        method: "POST",
        credentials: "include",
      });

      return response.ok;
    } catch (error) {
      console.error("❌ Logout error:", error);
      return false;
    }
  },
};
