import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import passport config
import passport from './auth/passport.js';
import { initDB } from './models/database.js';
import apiRouter from './routes/index.js';
import authRouter from './auth/authRoute.js';

// Load environment variables
dotenv.config();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration with proper headers
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_BASE_URL || 'https://your-service-name.onrender.com'] 
    : 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));

// Add security headers to fix Cross-Origin-Opener-Policy
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', 
    process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_BASE_URL || 'https://your-service-name.onrender.com'
      : 'http://localhost:5173'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// Session configuration for production
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-session-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
};

// Use PostgreSQL session store in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  sessionConfig.cookie.secure = true;
  
  try {
    const pgSession = (await import('connect-pg-simple')).default;
    const { Pool } = await import('pg');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    sessionConfig.store = new (pgSession(session))({
      pool: pool,
      createTableIfMissing: true
    });
    
    console.log('✅ PostgreSQL session store configured');
  } catch (error) {
    console.error('❌ Failed to configure PostgreSQL session store:', error.message);
  }
}

app.use(session(sessionConfig));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Parse JSON
app.use(express.json());

// Initialize database
initDB();

// ============ ANILIST PROXY ROUTES ============
// Add these BEFORE your health check route

// Get comics from AniList through backend proxy
app.post('/api/anilist/comics', async (req, res) => {
  try {
    const randomPage = Math.floor(Math.random() * 50) + 1;
    
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
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

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`);
    }

    const data = await response.json();
    const media = data.data?.Page?.media || [];
    
    // Transform the data
    const transformed = media.map(item => ({
      id: item.id,
      title: item.title.english || item.title.romaji,
      coverImage: item.coverImage.large,
      rating: item.averageScore ? (item.averageScore / 20).toFixed(1) : "N/A",
      chapters: item.chapters || "?",
      status: item.status,
      format: item.format || "MANGA",
      genres: item.genres || [],
      description: item.description
        ? item.description.replace(/<[^>]*>/g, "").substring(0, 150) + "..."
        : "No description available",
    }));
    
    // Shuffle the array
    const shuffled = [...transformed];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    res.json(shuffled);
  } catch (error) {
    console.error('❌ AniList proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comics',
      message: error.message 
    });
  }
});

// Batch fetch comics
app.post('/api/anilist/batch', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json([]);
    }
    
    // Convert to integers and filter out invalid IDs
    const validIds = ids
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);
    
    if (validIds.length === 0) {
      return res.json([]);
    }
    
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
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
        variables: { ids: validIds },
      }),
    });

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`);
    }

    const data = await response.json();
    const media = data.data?.Page?.media || [];
    
    // Transform the data
    const transformed = media.map(item => ({
      id: item.id,
      title: item.title.english || item.title.romaji,
      coverImage: item.coverImage.large,
      rating: item.averageScore ? (item.averageScore / 20).toFixed(1) : "N/A",
      chapters: item.chapters || "?",
      status: item.status,
      format: item.format || "MANGA",
      genres: item.genres || [],
      description: item.description
        ? item.description.replace(/<[^>]*>/g, "").substring(0, 150) + "..."
        : "No description available",
    }));
    
    res.json(transformed);
  } catch (error) {
    console.error('❌ AniList batch proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comics batch',
      message: error.message 
    });
  }
});

// ============ END ANILIST PROXY ROUTES ============

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    node_version: process.version
  });
});

// Debug endpoint
app.get('/debug/user', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.user,
    sessionId: req.sessionID
  });
});

// Auth routes
app.use('/auth', authRouter);

// API routes (your existing likes, lists routes)
app.use('/api', apiRouter);

// ============ SERVE FRONTEND IN PRODUCTION ============
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, 'manga-match', 'dist');
  console.log(`📁 Serving frontend from: ${frontendPath}`);
  
  // Serve static files from frontend build
  app.use(express.static(frontendPath));
  
  // Handle React routing - return index.html for all non-API routes
  app.get('*', (req, res, next) => {
    // Skip API and auth routes
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      return next();
    }
    
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
    // In production, if not API/auth route, serve index.html for SPA routing
    const frontendPath = path.join(__dirname, 'manga-match', 'dist');
    return res.sendFile(path.join(frontendPath, 'index.html'));
  }
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origin: ${corsOptions.origin}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`📁 Serving frontend from: manga-match/dist`);
  }
  console.log(`🎯 AniList proxy available at: /api/anilist/comics`);
});