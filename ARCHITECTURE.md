# Video Player - Architecture & Code Structure

## 🏗️ Project Architecture

This is a **Netflix-like video streaming platform** built with Node.js, Express, and vanilla JavaScript. The application features advanced video streaming, subtitle support, thumbnail generation, and a modern UI.

## 📁 Directory Structure

```
video-player/
├── 📁 controllers/
│   └── player.controller.js       # API request handlers
├── 📁 databases/                  # SQLite database files
│   ├── home.db                   # Main video metadata database
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
│   ├── common.js                 # Shared JavaScript utilities
│   └── style.css                 # Global CSS styles
├── 📁 routes/
│   └── player.route.js           # API route definitions
├── 📁 services/                  # Business logic layer
│   ├── video.service.js          # Video streaming & processing
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

#### **video.service.js** - Video Processing Core
- **Video streaming** with range requests
- **Audio track** detection and switching
- **Subtitle extraction** with chunked loading
- **Dynamic quality** adjustment
- **Multiple codec support** (H.264, HEVC, VP9)

#### **thumbnail.service.js** - Thumbnail Generation
- **Multi-quality thumbnails** (standard, high, slideshow, ultra)
- **Smart caching** with MD5-based filenames
- **FFmpeg integration** for video frame extraction
- **Responsive image sizing**

#### **folder.service.js** - Content Management
- **Recursive directory scanning**
- **Video file detection** (.mp4, .mkv, .avi, etc.)
- **Metadata extraction** and caching
- **Watch progress tracking**

### Frontend Pages

#### **Home Page** (`/home/`)
- **Netflix-like interface** with hero slideshow
- **Recent downloads** slideshow (sorted by file date)
- **Grid layout** for all content
- **Responsive design** for all screen sizes

#### **Movies Page** (`/movies/`)
- **Filtered content** (movies only)
- **Movie-specific slideshow**
- **Same Netflix-like design**

#### **Series Page** (`/series/`)
- **Filtered content** (TV series only)
- **Series-specific slideshow**
- **Episode management**

#### **Play Page** (`/play/`)
- **Advanced video player** with custom controls
- **Multi-audio track** support with dropdown
- **Chunked subtitle loading** for fast response
- **Watch progress** saving and resume
- **Netflix-style UI** with detailed information panel

### API Endpoints

```
GET /api/videos/:series              # Get video list for series
GET /api/video/:series/:id           # Stream video file
GET /api/thumbnail/:type/:db/:id     # Get video thumbnail
GET /api/audio-tracks/:series/:id    # Get available audio tracks
GET /api/subtitle-tracks/:series/:id # Get available subtitle tracks
GET /api/subtitle/:series/:id/:track # Stream subtitle file (full)
GET /api/subtitle-chunk/:series/:id/:track/:start/:duration # Stream subtitle chunk
POST /api/watch-progress             # Save watch progress
GET /api/watch-progress/:video_id    # Get watch progress
```

## 🎬 Advanced Features

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

## 🗄️ Database Schema

### Main Database (home.db)
```sql
-- Videos table
videos (
  id INTEGER PRIMARY KEY,
  title TEXT,
  path TEXT,
  duration REAL,
  size INTEGER,
  created_at DATETIME
)

-- Watch progress table
watch_progress (
  id INTEGER PRIMARY KEY,
  video_id TEXT,
  current_time REAL,
  duration REAL,
  last_watched DATETIME
)
```

### Series Databases (*.sqlite3)
- Individual databases for each series
- Same schema as main database
- Isolated progress tracking per series

## 🔄 Data Flow

### Video Streaming
1. **Client** requests video via `/api/video/:series/:id`
2. **Controller** validates request and calls service
3. **video.service.js** resolves file path and checks existence
4. **FFmpeg streaming** with range request support
5. **Dynamic transcoding** based on client capabilities

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

### Frontend
- **Chunked loading** for immediate response
- **Image lazy loading** for better performance
- **Debounced API calls** to prevent spam
- **Memory-efficient** subtitle chunk management

### Database
- **SQLite indexes** on frequently queried columns
- **Prepared statements** for security and performance
- **Connection reuse** across requests
- **Batch operations** for metadata updates

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
- **Rate limiting** (can be added with middleware)

## 📱 Responsive Design

- **Mobile-first** CSS with progressive enhancement
- **TV browser optimization** with keyboard navigation
- **Tablet-specific** layouts and touch controls
- **4K display support** with high-DPI assets

This architecture provides a scalable, maintainable, and feature-rich video streaming platform that rivals commercial solutions like Netflix or Plex.
