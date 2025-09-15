# Video Player - Architecture & Code Structure

## 🏗️ Project Architecture

This is a **Netflix-like video streaming platform** with **multi-user support** built with Node.js, Express, and vanilla JavaScript. The application features advanced video streaming, subtitle support, thumbnail generation, user management, and a modern UI.

## 📁 Directory Structure

```
video-player/
├── 📁 controllers/
│   └── player.controller.js       # API request handlers
├── 📁 databases/                  # SQLite database files
│   ├── home.db                   # Main user database
│   ├── home.sqlite3              # Movies database
│   └── *.sqlite3                 # Series-specific databases
├── 📁 middleware/
│   └── dbMiddleware.js           # Database connection middleware
├── 📁 public/                    # Frontend assets
│   ├── 📁 home/                  # Home page (all content)
│   │   ├── index.html
│   │   └── home.js
│   ├── 📁 movies/                # Movies page
│   │   ├── index.html
│   │   └── movies.js
│   ├── 📁 series/                # Series page
│   │   ├── index.html
│   │   └── series.js
│   ├── 📁 play/                  # Video player page
│   │   ├── index.html
│   │   └── play.js
│   ├── 📁 admin/                 # Admin panel
│   │   ├── index.html
│   │   └── admin.js
│   ├── 📄 index.html             # User login page
│   ├── common.js                 # Shared JavaScript utilities
│   └── style.css                 # Global CSS styles
├── 📁 routes/
│   ├── player.route.js           # Video streaming routes
│   ├── user.route.js             # User management routes
│   └── admin.route.js            # Admin panel routes
├── 📁 services/                  # Business logic layer
│   ├── video.service.js          # Video streaming & processing
│   ├── user.service.js           # User management & progress tracking
│   ├── settings.service.js       # System settings management
│   ├── thumbnail.service.js      # Thumbnail generation
│   ├── folder.service.js         # Directory management
│   └── metadata.service.js       # Video metadata extraction
├── 📁 utils/                     # Utility functions
│   ├── audioUtils.js             # Audio processing utilities
│   ├── subtitleUtils.js          # Subtitle processing utilities
│   └── folderUtils.js            # File system utilities
├── 📁 videos/                    # Video files directory (configurable)
├── 📄 ecosystem.config.js        # PM2 configuration
├── 📄 server.js                  # Express server entry point
└── 📄 package.json               # Dependencies and scripts
```

## 🔧 Core Components

### Backend Services

#### **user.service.js** - User Management Core
- **User authentication** with PIN-based login
- **User creation** with auto-generated avatars and colors
- **Progress tracking** across movies and series
- **Continue watching** functionality
- **Admin user management** (suspend/activate)
- **Session management** with secure cookies

#### **video.service.js** - Video Processing Core
- **Video streaming** with range requests
- **Audio track** detection and switching
- **Subtitle extraction** with chunked loading
- **Dynamic quality** adjustment
- **Multiple codec support** (H.264, HEVC, VP9)
- **User-specific progress** saving

#### **settings.service.js** - System Settings
- **Registration control** (enable/disable user creation)
- **System configuration** management
- **Admin settings** persistence
- **Environment variable** integration

#### **thumbnail.service.js** - Thumbnail Generation
- **Multi-quality thumbnails** (standard, high, slideshow, ultra)
- **Smart caching** with MD5-based filenames
- **FFmpeg integration** for video frame extraction
- **Responsive image sizing**

#### **folder.service.js** - Content Management
- **Recursive directory scanning**
- **Video file detection** (.mp4, .mkv, .avi, etc.)
- **Metadata extraction** and caching
- **Watch progress tracking** with user context

#### **metadata.service.js** - Progress Management
- **Watch progress** saving and retrieval
- **User-specific** progress tracking
- **Database operations** for video metadata
- **Progress persistence** across sessions

### Frontend Pages

#### **User Login Page** (`/`)
- **User selection** interface with avatars
- **PIN authentication** system
- **User creation** with name input
- **Registration control** (admin-configurable)
- **Modern glassmorphism** design

#### **Home Page** (`/home/`)
- **Netflix-like interface** with hero slideshow
- **Recent downloads** slideshow (sorted by file date)
- **Continue Watching** section with user-specific progress
- **Grid layout** for all content
- **User profile** in header
- **Responsive design** for all screen sizes

#### **Movies Page** (`/movies/`)
- **Filtered content** (movies only)
- **Movie-specific slideshow**
- **Continue Watching** movies section
- **Same Netflix-like design**

#### **Series Page** (`/series/`)
- **Filtered content** (TV series only)
- **Series-specific slideshow**
- **Continue Watching** series section
- **Episode management**

#### **Play Page** (`/play/`)
- **Advanced video player** with custom controls
- **Multi-audio track** support with dropdown
- **Chunked subtitle loading** for fast response
- **User-specific progress** saving and resume
- **Netflix-style UI** with detailed information panel
- **Progress tracking** with accurate time calculation

#### **Admin Panel** (`/admin/`)
- **User management** (list, suspend, activate)
- **System settings** (registration control)
- **Admin authentication** with PIN
- **Real-time user** status updates

### API Endpoints

#### User Management
```
GET  /api/users/                    # Get all users
POST /api/users/                    # Create new user
POST /api/users/login               # User login
GET  /api/users/current             # Get current user
GET  /api/users/continue-watching   # Get continue watching content
GET  /api/users/registration-status # Check if registration is allowed
```

#### Admin Panel
```
GET  /api/admin/users               # Get all users (admin)
POST /api/admin/suspend-user        # Suspend user
POST /api/admin/activate-user       # Activate user
GET  /api/admin/settings            # Get system settings
POST /api/admin/toggle-registration # Toggle user registration
```

#### Video Streaming
```
GET /api/videos/:series              # Get video list for series
GET /api/video/:series/:id           # Stream video file
GET /api/thumbnail/:type/:db/:id     # Get video thumbnail
```

#### Audio & Subtitles
```
GET /api/audio-tracks/:series/:id    # Get available audio tracks
GET /api/subtitle-tracks/:series/:id # Get available subtitle tracks
GET /api/subtitle/:series/:id/:track # Stream subtitle file (full)
GET /api/subtitle-chunk/:series/:id/:track/:start/:duration # Stream subtitle chunk
```

#### Progress Tracking
```
POST /api/watch-progress             # Save watch progress
GET /api/watch-progress/:video_id    # Get watch progress
```

## 🎬 Advanced Features

### Multi-User System
- **User Profiles** with custom avatars generated from initials
- **Unique Color Coding** for each user (background and text colors)
- **PIN Authentication** with secure 4-digit PIN system
- **Session Management** using HTTP-only cookies
- **User-Specific Progress** tracking across all content
- **Admin Controls** for user management and system settings

### Continue Watching
- **Smart Progress Calculation** for both movies and series
- **Series Progress** based on episode completion percentage
- **Movie Progress** based on actual watch time vs. total duration
- **Recent Activity** tracking with last opened timestamps
- **Progress Persistence** across user sessions
- **Filtered Display** (movies on movies page, series on series page)

### Multi-Audio Track Support
- **Automatic detection** of audio streams
- **Language identification** with fallback mapping
- **Dynamic transcoding** based on browser compatibility
- **Quality optimization** for different source types

### Chunked Subtitle Loading
- **Progressive loading** in 10-minute chunks
- **Adaptive sizing** (reduces to 5min/3min on failures)
- **Multiple fallback layers**:
  1. Direct SRT conversion (fastest)
  2. Chunked FFmpeg extraction
  3. Emergency fallback (always works)
- **Preloading system** (loads next chunk 2 minutes early)

### Smart Thumbnail System
- **Dynamic quality selection** based on usage
- **Efficient caching** with MD5 filenames
- **Multiple sizes**: 320x240, 480x360, 640x480, 1280x720
- **Fallback generation** for folders (uses first video)

### Netflix-like UI
- **Hero slideshow** with recent content
- **Glassmorphism design** with backdrop blur
- **Responsive grid layouts**
- **Smooth animations** and transitions
- **Keyboard navigation** for TV browsers
- **User profile integration** in headers

## 🗄️ Database Schema

### User Database (home.db)
```sql
-- Users table
users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  pin_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '👤',
  avatar_bg_color TEXT DEFAULT '#ff0000',
  avatar_text_color TEXT DEFAULT '#ffffff',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active BOOLEAN DEFAULT 1
)

-- System settings table
system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Video Metadata Databases (*.sqlite3)
```sql
-- Video metadata table (per database)
video_metadata (
  video_id TEXT NOT NULL,
  user_id TEXT DEFAULT 'guest',
  current_time REAL DEFAULT 0,
  last_opened TEXT,
  size INTEGER,
  length REAL, -- Video duration in seconds
  active INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, video_id)
)
```

### Database Organization
- **home.db** - User accounts and system settings
- **home.sqlite3** - Movies metadata and progress
- **series_name.sqlite3** - Individual series metadata and progress
- **Composite Primary Keys** - (user_id, video_id) for multi-user support

## 🔄 Data Flow

### User Authentication
1. **Client** submits PIN on login page
2. **user.service.js** validates PIN against hashed values
3. **Session cookie** set with user ID
4. **User data** returned with avatar and preferences
5. **Redirect** to appropriate page

### Video Streaming
1. **Client** requests video via `/api/video/:series/:id`
2. **Controller** validates request and user session
3. **video.service.js** resolves file path and checks existence
4. **Progress tracking** saves current position for user
5. **FFmpeg streaming** with range request support
6. **Dynamic transcoding** based on client capabilities

### Continue Watching
1. **Client** requests continue watching content
2. **user.service.js** queries all video databases for user
3. **Progress calculation** for movies and series
4. **Series progress** calculated from episode completion
5. **Filtered results** based on page type (movies/series)
6. **Sorted by** last opened timestamp

### Subtitle Loading
1. **Client** requests subtitles via chunked API
2. **Service** detects subtitle format (SRT, WebVTT, ASS)
3. **Multi-layer approach**:
   - Try direct SRT conversion
   - Fallback to chunked extraction
   - Emergency fallback if all else fails
4. **Progressive loading** with smart preloading

### Thumbnail Generation
1. **Request** comes for missing thumbnail
2. **Service** checks cache by MD5 hash
3. **FFmpeg extraction** at specific timestamp
4. **Quality optimization** and caching
5. **Responsive delivery** based on request type

## 🚀 Performance Optimizations

### Backend
- **Efficient FFmpeg usage** with optimized flags
- **Smart caching** with hash-based filenames
- **Connection pooling** for database operations
- **Range request support** for large files
- **User-specific queries** with proper indexing

### Frontend
- **Chunked loading** for immediate response
- **Image lazy loading** for better performance
- **Debounced API calls** to prevent spam
- **Memory-efficient** subtitle chunk management
- **User session** persistence

### Database
- **SQLite indexes** on frequently queried columns
- **Prepared statements** for security and performance
- **Connection reuse** across requests
- **Batch operations** for metadata updates
- **Composite primary keys** for efficient user-specific queries

## 🎯 Browser Compatibility

### Video Codecs
- **H.264/AVC** - Universal support
- **HEVC/H.265** - Modern browsers
- **VP9** - Chrome, Firefox support
- **AV1** - Latest browsers

### Audio Codecs
- **AAC** - Universal support
- **MP3** - Legacy support
- **Opus** - Modern browsers
- **AC-3/DTS** - Transcoded to AAC

### Subtitle Formats
- **WebVTT** - Native browser support
- **SRT** - Converted to WebVTT
- **ASS/SSA** - Advanced subtitle support

## 🔐 Security Features

- **Path validation** to prevent directory traversal
- **Input sanitization** for all API endpoints
- **CORS configuration** for cross-origin requests
- **PIN hashing** with SHA256 for secure authentication
- **Session management** with HTTP-only cookies
- **Admin PIN protection** for sensitive operations
- **User data isolation** with proper database design

## 📱 Responsive Design

- **Mobile-first** CSS with progressive enhancement
- **TV browser optimization** with keyboard navigation
- **Tablet-specific** layouts and touch controls
- **4K display support** with high-DPI assets
- **User profile** integration across all screen sizes

## 🎨 UI/UX Features

### User Experience
- **Personalized avatars** with unique color schemes
- **Continue watching** with accurate progress tracking
- **Smooth transitions** between user sessions
- **Intuitive navigation** with clear user feedback
- **Admin controls** for system management

### Visual Design
- **Glassmorphism effects** with backdrop blur
- **Dynamic color schemes** per user
- **Responsive grid layouts** for all content types
- **Smooth animations** and micro-interactions
- **Netflix-inspired** interface design

This architecture provides a scalable, maintainable, and feature-rich video streaming platform with comprehensive multi-user support that rivals commercial solutions like Netflix or Plex.