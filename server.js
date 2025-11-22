import express from 'express';
import cors from 'cors';
import { initDB } from './models/database.js';
import apiRouter from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Initialize database on startup
initDB();

// Use routes
app.use('/api', apiRouter);


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/likes/:userId`);
  console.log(`   POST http://localhost:${PORT}/api/likes`);
  console.log(`   DELETE http://localhost:${PORT}/api/likes`);
  console.log(`   GET  http://localhost:${PORT}/api/lists/:userId`);
  console.log(`   POST http://localhost:${PORT}/api/lists`);
  console.log(`   POST http://localhost:${PORT}/api/lists/:listName/add`);
  console.log(`   POST http://localhost:${PORT}/api/lists/:listName/remove`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
});