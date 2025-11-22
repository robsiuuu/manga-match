const ANILIST_API_URL = "https://graphql.anilist.co";
const BACKEND_URL = "http://localhost:3001/api";
const USER_ID = "user123"; // In real app, use actual user ID from auth

// GraphQL query for AniList (external API)
const RANDOM_MEDIA_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: MANGA, sort: POPULARITY_DESC) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
        }
        description
        averageScore
        chapters
        status
        format
        genres
      }
    }
  }
`;

// Helper to transform AniList data to app format
function transformAniListData(media) {
  return {
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
  };
}

// Helper to shuffle an array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// API object with methods
export const api = {
  // GET request to external API (AniList) - For comic discovery
  getComics: async () => {
    try {
      const randomPage = Math.floor(Math.random() * 50) + 1; // More pages for variety
      console.log("🔄 GET: Fetching comics from AniList");

      const response = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: RANDOM_MEDIA_QUERY,
          variables: {
            page: randomPage,
            perPage: 50, // AniList's maximum
          },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      const media = data.data?.Page?.media || [];
      console.log(`📦 Received ${media.length} comics from page ${randomPage}`);

      const shuffledMedia = shuffleArray(media);
      const transformed = shuffledMedia.map(transformAniListData);

      console.log(`✅ GET: Received ${transformed.length} comics from AniList`);
      return transformed;
    } catch (error) {
      console.error("❌ GET Error from AniList:", error);
      throw error;
    }
  },

  // POST request to your backend (Neon DB) - For saving likes
  likeComic: async (comicId) => {
    try {
      console.log(`📤 POST: Saving like for comic ${comicId} to Neon DB`);

      const response = await fetch(`${BACKEND_URL}/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: USER_ID,
          comicId: comicId,
        }),
      });

      if (!response.ok) throw new Error("Failed to like comic");

      const data = await response.json();
      console.log("✅ POST: Like saved to Neon database");

      return data;
    } catch (error) {
      console.error("❌ POST Error saving to Neon:", error);
      throw error;
    }
  },

  // GET request to your backend (Neon DB) - For retrieving likes
  getLikedComics: async () => {
    try {
      console.log("📥 GET: Fetching liked comics from Neon DB");

      const response = await fetch(`${BACKEND_URL}/likes/${USER_ID}`);
      if (!response.ok) throw new Error("Failed to fetch liked comics");

      const data = await response.json();
      console.log(
        `✅ GET: Received ${data.likedComics.length} liked comics from Neon DB`
      );

      return data.likedComics;
    } catch (error) {
      console.error("❌ GET Error from Neon DB:", error);
      throw error;
    }
  },

  // DELETE request to your backend (Neon DB) - For removing likes
  unlikeComic: async (comicId) => {
    try {
      console.log(`🗑️ DELETE: Removing like for comic ${comicId} from Neon DB`);

      const response = await fetch(`${BACKEND_URL}/likes`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: USER_ID,
          comicId: comicId,
        }),
      });

      if (!response.ok) throw new Error("Failed to unlike comic");

      const data = await response.json();
      console.log("✅ DELETE: Like removed from Neon database");

      return data;
    } catch (error) {
      console.error("❌ DELETE Error from Neon DB:", error);
      throw error;
    }
  },

  // Additional endpoints for lists (optional)
  // GET request - Get user's lists from backend
  getLists: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/lists/${USER_ID}`);
      if (!response.ok) throw new Error("Failed to fetch lists");
      const data = await response.json();
      return data.lists || {};
    } catch (error) {
      console.error("Error getting lists:", error);
      return {};
    }
  },

  // Add comic to list
  addToList: async (listName, comicId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/lists/${listName}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: USER_ID,
          comicId: comicId,
        }),
      });

      if (!response.ok) throw new Error("Failed to add to list");
      return await response.json();
    } catch (error) {
      console.error("Error adding to list:", error);
      throw error;
    }
  },

  // GET - Get specific comics by their IDs (for loading liked comics data)
  getComicsBatch: async (ids) => {
    try {
      if (!ids || ids.length === 0) {
        console.log("📥 GET: No comic IDs provided for batch fetch");
        return [];
      }

      console.log(`📥 GET: Fetching ${ids.length} comics by IDs from AniList`);

      const response = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query ($ids: [Int]) {
              Page {
                media(id_in: $ids, type: MANGA) {
                  id
                  title {
                    romaji
                    english
                    native
                  }
                  coverImage {
                    large
                    extraLarge
                    color
                  }
                  description
                  averageScore
                  chapters
                  volumes
                  status
                  format
                  genres
                  tags {
                    name
                  }
                  type
                }
              }
            }
          `,
          variables: {
            ids: ids.map((id) => parseInt(id)),
          },
        }),
      });

      const data = await response.json();
      console.log("📦 Batch API response received");

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      if (!data.data?.Page?.media) {
        console.log("⚠️ No media data in batch response");
        return [];
      }

      const transformed = data.data.Page.media.map(transformAniListData);
      console.log(
        `✅ GET: Successfully loaded ${transformed.length} liked comics data`
      );

      return transformed;
    } catch (error) {
      console.error("❌ GET Error in batch fetch:", error);
      // Return empty array instead of throwing so the app doesn't crash
      return [];
    }
  },

  // Remove comic from list
  removeFromList: async (listName, comicId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/lists/${listName}/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: USER_ID,
          comicId: comicId,
        }),
      });

      if (!response.ok) throw new Error("Failed to remove from list");
      return await response.json();
    } catch (error) {
      console.error("Error removing from list:", error);
      throw error;
    }
  },

  // POST - Create a new list
  createList: async (listName) => {
    try {
      console.log(`📤 POST: Creating list "${listName}"`);

      const response = await fetch(`${BACKEND_URL}/lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: USER_ID,
          listName: listName,
        }),
      });

      if (!response.ok) throw new Error("Failed to create list");

      const data = await response.json();
      console.log("✅ POST: List created in database");

      return data;
    } catch (error) {
      console.error("❌ POST Error creating list:", error);
      throw error;
    }
  },
};
