# MangaMatch 🎯

A manga discovery app that helps you find your next favorite comic! Swipe through recommendations, like your favorites, and organize them into custom lists.

Video: https://uncg-my.sharepoint.com/:v:/g/personal/rrsiu_uncg_edu/IQCMVuUhaX2GSJ5TvDewb3WyAbx74xQPVRzCd4vF5l7QKkc?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=ROcwFP

## Features

- 🎴 **Like/Dislike Interface** - Manga cards with interactions for manga discovery
- ❤️ **Like System** - Save comics you're interested in
- 📁 **Custom Lists** - Organize liked comics into personal collections
- 🎲 **Random Discovery** - Get new recommendations with one click
- 📊 **AniList Integration** - Powered by the AniList GraphQL API
- 💾 **Neon PostgreSQL** - Persistent data storage for your collections

## Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **PostgreSQL** - Database (Neon)
- **CORS** - Cross-origin resource sharing

### APIs
- **AniList GraphQL API** - Comic data source
- **Custom REST API** - User data management

## Prerequisites

Before running this project, make sure you have:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Neon](https://neon.tech/) PostgreSQL database account

## Installation

### 1. Get Files
```bash
download the zip files from main
and extract
open in VS code
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd MangaMatch

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Edit the `.env` file with your Neon database credentials:
```env
DATABASE_URL=postgresql://username:password@ep-cool-cloud-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
PORT=3001
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd manga-match

# Install dependencies
npm install
```

## Running the Application

### Development Mode

#### What I do: Separate Terminals
```bash
# Terminal 1 - Backend
cd MangaMatch
npm run dev

# Terminal 2 - Frontend
cd manga-match
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## API Endpoints

### Comics
- `GET /api/comics` - Get random comic recommendations
- `GET /api/comics/batch` - Get specific comics by IDs

### User Data
- `GET /api/likes/:userId` - Get user's liked comics
- `POST /api/likes` - Like a comic
- `DELETE /api/likes` - Unlike a comic

### Lists
- `GET /api/lists/:userId` - Get user's lists
- `POST /api/lists` - Create a new list
- `POST /api/lists/:listName/add` - Add comic to list
- `POST /api/lists/:listName/remove` - Remove comic from list

## Database Schema

### user_likes
- `user_id` (string) - User identifier
- `comic_id` (integer) - AniList media ID
- `created_at` (timestamp) - When the like was created

### lists
- `user_id` (string) - User identifier  
- `list_name` (string) - Name of the list
- `created_at` (timestamp) - When the list was created

### list_items
- `list_id` (integer) - Reference to lists table
- `comic_id` (integer) - AniList media ID
- `created_at` (timestamp) - When item was added

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=your_neon_postgresql_connection_string
PORT=3001
```

### Frontend
No environment variables needed for basic functionality.

## Usage

1. **Discover Comics**: Swipe through random manga recommendations
2. **Like Comics**: Click the heart to save comics you're interested in
3. **Manage Lists**: Organize liked comics into custom lists
4. **Find New Reads**: Use the randomize button for fresh recommendations

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure backend is running on port 3001
2. **Database Connection**: Verify your Neon DATABASE_URL in .env
3. **AniList API Limits**: Avoid making too many rapid requests
4. **Port Conflicts**: Change ports in package.json if 3001/5173 are occupied

### Debug Tips

- Check browser console for frontend errors
- Check backend terminal for API errors
- Ensure all environment variables are set correctly

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [AniList](https://anilist.co/) for the comprehensive manga database
- [Neon](https://neon.tech/) for serverless PostgreSQL
- [Lucide](https://lucide.dev/) for beautiful icons

---

**Happy Manga Discovery!** 📚✨
