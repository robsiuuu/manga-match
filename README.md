# MangaMatch 🎯

A manga discovery app that helps you find your next favorite comic! Swipe through recommendations, like your favorites, and organize them into custom lists.

## 📱 Live Demo

**Deployed URL:** https://manga-match.onrender.com

**Video Demo:** [Watch on OneDrive](https://uncg-my.sharepoint.com/:v:/g/personal/rrsiu_uncg_edu/IQCMVuUhaX2GSJ5TvDewb3WyAbx74xQPVRzCd4vF5l7QKkc?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=ROcwFP)

**GitHub Repository:** [https://github.com/robsiuuu/manga-match](https://github.com/robsiuuu/manga-match)

## ✨ Features

- 🎴 **Tinder-style Interface** - "Swipe" through manga cards with interactive discovery
- ❤️ **Like System** - Save comics you're interested in
- 📁 **Custom Lists** - Create, rename, delete, and organize comics into personal collections
- 🎲 **Random Discovery** - Get fresh recommendations with one click
- 🔐 **Google OAuth** - Secure authentication system
- 📊 **AniList Integration** - Powered by the comprehensive AniList GraphQL API
- 💾 **Neon PostgreSQL** - Persistent data storage for user collections
- 📱 **Responsive Design** - Works on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React** - Component-based UI framework
- **Vite** - Fast build tool and dev server
- **CSS Modules** - Component-scoped styling
- **Lucide React** - Beautiful icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **Passport.js** - Authentication middleware
- **Express-Session** - Session management
- **CORS** - Cross-origin resource sharing

### Database & APIs
- **PostgreSQL** - Relational database (hosted on Neon)
- **AniList GraphQL API** - Comprehensive manga database
- **Google OAuth 2.0** - Authentication provider

### Deployment
- **Render** - Full-stack hosting platform
- **Neon** - Serverless PostgreSQL hosting

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Google OAuth credentials
- Neon PostgreSQL database

## 📚 API Documentation

### Authentication
- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - OAuth callback handler
- `GET /auth/me` - Get current user session
- `POST /auth/logout` - Logout user

### Comics
- `POST /api/anilist/comics` - Get random manga recommendations
- `POST /api/anilist/batch` - Batch fetch comics by IDs

### User Data
- `GET /api/likes` - Get user's liked comics
- `POST /api/likes` - Like a comic
- `DELETE /api/likes` - Unlike a comic

### Lists Management
- `GET /api/lists` - Get user's lists with comic counts
- `POST /api/lists` - Create new list
- `POST /api/lists/:listName/add` - Add comic to list
- `POST /api/lists/:listName/remove` - Remove comic from list
- `PUT /api/lists/:listName/rename` - Rename existing list
- `DELETE /api/lists/:listName` - Delete list and its contents

## 🎯 Design Choices

### Frontend Framework: React
- **Component Reusability**: Manga cards, buttons, and list items are reusable components
- **State Management**: React hooks (useState, useEffect) for local state
- **Performance**: Vite provides fast hot module replacement
- **Ecosystem**: Rich library support and active community

### Backend Structure: Express with REST API
- **Simplicity**: Clear routing structure with `/api` prefix
- **Middleware Pattern**: Authentication, CORS, and error handling as middleware
- **Session Management**: Server-side sessions for security
- **Separation of Concerns**: Controllers handle business logic, routes manage endpoints

### Database Schema: PostgreSQL with Neon
- **Relationships**: Clear foreign key relationships for data integrity
- **CASCADE DELETE**: Automatic cleanup of dependent records
- **Indexing**: Optimized for user-based queries
- **Serverless**: Neon provides automatic scaling and zero maintenance

### Authentication: Passport.js with Google OAuth
- **Security**: No password storage, leveraging Google's secure authentication
- **User Experience**: One-click login, no registration forms
- **Session Persistence**: Server-side sessions with secure cookies

## 🧗 Challenges & Solutions

### 1. Cross-Origin Resource Sharing (CORS)
**Challenge**: Frontend (localhost:5173) communicating with backend (localhost:3001) blocked by browser security.
**Solution**: Implemented proper CORS middleware with credentials support and production-ready configuration.

### 2. Session Management with OAuth
**Challenge**: Maintaining user sessions across OAuth flow and subsequent requests.
**Solution**: Used Express-Session with secure cookies and Passport.js serialization.

### 3. Database Schema Evolution
**Challenge**: Adding features (like list renaming) required schema changes without data loss.
**Solution**: Used `CREATE TABLE IF NOT EXISTS` and careful migration approach.

### 4. Real-time State Sync
**Challenge**: Keeping UI in sync with database changes (likes, list updates).
**Solution**: Implemented optimistic updates with rollback on error and proper state management.

### 5. Deployment Configuration
**Challenge**: Configuring Render for full-stack deployment with environment variables.
**Solution**: Created proper build scripts and environment configuration for both development and production.

## 📈 Learning Outcomes

### Full-Stack Development
1. **End-to-End Architecture**: Learned to design complete systems from database to UI
2. **API Design**: Created RESTful APIs with proper status codes and error handling
3. **Authentication Flow**: Implemented OAuth 2.0 with session management
4. **Database Design**: Designed relational schemas with proper constraints and indexes

### Deployment & DevOps
1. **Environment Configuration**: Managed different configurations for development vs production
2. **Server Management**: Configured web servers, CORS, and security headers
3. **Database Hosting**: Used serverless PostgreSQL with connection pooling
4. **Build Process**: Set up build scripts and deployment pipelines

### Problem Solving
1. **Debugging Distributed Systems**: Traced issues across frontend, backend, and database
2. **Performance Optimization**: Implemented batch fetching and database indexing
3. **Security Best Practices**: Implemented secure authentication and input validation
4. **Error Handling**: Created robust error handling for API failures

## 🔮 Future Work

### Planned Features
1. **Advanced Filtering**: Filter manga by genre, rating, publication year
2. **Social Features**: Follow other users, share lists, see popular recommendations
3. **Reading Progress**: Track reading progress and chapter updates
4. **Mobile App**: React Native version for iOS and Android
5. **Notifications**: Email notifications for new chapters in followed series

### Technical Improvements
1. **GraphQL API**: Replace some REST endpoints with GraphQL for more efficient queries
2. **Redis Caching**: Cache frequently accessed manga data
3. **Real-time Updates**: WebSocket notifications for list changes
4. **Progressive Web App**: Offline functionality and app-like experience
5. **Automated Testing**: Comprehensive test suite for frontend and backend

### UI/UX Enhancements
1. **Dark Mode**: Theme toggle for better viewing experience
2. **Accessibility**: Improve screen reader support and keyboard navigation
3. **Animations**: Smooth transitions and micro-interactions
4. **Personalization**: AI-based recommendations based on reading history

## 🙏 Acknowledgments

- [AniList](https://anilist.co/) for their comprehensive manga database API
- [Neon](https://neon.tech/) for serverless PostgreSQL hosting
- [Render](https://render.com/) for easy full-stack deployment
- [Lucide](https://lucide.dev/) for beautiful open-source icons
- The React and Node.js communities for excellent documentation and tools

---

**Happy Manga Discovery!** 📚✨

*Built with ❤️ by Robertson Siu*
