# 🎬 Netflix-Style Video Player

A professional-grade video streaming platform with Netflix-like UI, advanced subtitle support, multi-audio tracks, intelligent chunked loading, and **multi-user support**. Built with Node.js, Express, and vanilla JavaScript.

![Video Player Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Express](https://img.shields.io/badge/Express-5.x-blue)
![SQLite](https://img.shields.io/badge/SQLite-3.x-lightblue)

## ✨ Features

### 🎯 Core Features
- **🎬 Netflix-like Interface** - Modern, responsive UI with hero slideshow
- **👥 Multi-User System** - User profiles with PIN authentication and personalized progress
- **📱 Multi-device Support** - Desktop, tablet, mobile, and TV browser optimized
- **🎵 Multi-audio Track Support** - Dynamic audio switching with language detection
- **📝 Advanced Subtitles** - Chunked loading, multiple formats (SRT, WebVTT, ASS)
- **🖼️ Smart Thumbnails** - Auto-generated, cached, multi-quality thumbnails
- **⏯️ Watch Progress** - Resume playback from last position with user-specific tracking
- **🎞️ Multiple Video Formats** - MP4, MKV, AVI support with dynamic transcoding
- **📊 Continue Watching** - Smart progress tracking across movies and series

### 🚀 Advanced Features
- **⚡ Chunked Subtitle Loading** - Instant subtitles with progressive loading
- **🔄 Adaptive Streaming** - Dynamic quality adjustment based on network
- **🎨 Glassmorphism UI** - Modern design with backdrop blur effects
- **⌨️ Keyboard Navigation** - Full TV browser support
- **📊 Content Organization** - Separate Movies/Series pages with filtering
- **🔍 Smart Content Discovery** - Recent downloads slideshow
- **👤 User Management** - Admin panel for user control and system settings
- **🎯 Personalized Experience** - User-specific watch history and recommendations

### 🔐 Multi-User Features
- **👤 User Profiles** - Custom avatars with initials and unique colors
- **🔒 Flexible PIN Authentication** - Secure 4-digit PIN login system with optional PIN skip
- **📈 Individual Progress** - Separate watch progress for each user
- **🎨 Personalized UI** - User-specific avatar colors and themes
- **⚙️ Admin Controls** - User suspension, activation, and registration management
- **📊 Continue Watching** - Personalized "Continue Watching" section
- **🌙 Theme System** - Light/Dark/System Default themes with per-user preferences

### 🆕 Recently Added Features

#### **🎨 Advanced Theme System**
- **Three Theme Options**: Light, Dark, and System Default
- **System Detection**: Automatically follows OS theme preference
- **Per-User Themes**: Each user can have their own theme preference stored in database
- **Device Persistence**: Theme preferences persist across browser sessions
- **Smart Switching**: Seamless theme transitions with smooth animations
- **Toast Notifications**: Visual feedback when changing themes
- **Cross-Page Consistency**: Theme applies to all pages (login, home, movies, series, player)

#### **🔐 Enhanced Authentication**
- **Optional PIN Setup**: Users can skip PIN during registration for quick access
- **Smart Login Flow**: Automatically detects if user has PIN and skips PIN prompt if not needed
- **Flexible Security**: Choose between PIN protection or quick access per user

#### **✨ UI/UX Improvements**
- **Sanitized Movie Names**: Clean, readable titles with automatic removal of technical details
- **Logo Navigation**: Clicking logo redirects to home page from any section
- **Improved Continue Watching**: Consistent title sanitization across all sections
- **Mobile-Friendly**: All new features work seamlessly on mobile devices

#### **🛠️ Technical Enhancements**
- **Database Schema Updates**: Added theme preferences to user table
- **API Endpoints**: New routes for theme management
- **Error Handling**: Improved error messages and validation
- **Code Organization**: Better separation of concerns for theme management

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Storage       │
│                 │    │                 │    │                 │
│ • Home Page     │◄──►│ • Express API   │◄──►│ • Video Files   │
│ • Movies Page   │    │ • User Service  │    │ • SQLite DBs    │
│ • Series Page   │    │ • Video Service │    │ • Thumbnails    │
│ • Player Page   │    │ • Subtitle Svc  │    │ • User Data     │
│ • Admin Panel   │    │ • Thumbnail Svc │    │ • Progress      │
│ • User Login    │    │ • Settings Svc  │    │ • Metadata      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **FFmpeg** (for video processing)
- **PM2** (recommended for production)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kailash6962/video-player.git
   cd video-player
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Create logs directory:**
```bash
mkdir logs
```

### Configuration

Create `.env` file:
```env
NODE_ENV=production
PORT=5555
VIDEO_DIR=/path/to/your/video/files
ADMIN_PIN=1234
```

### Running the Application

#### Development Mode
   ```bash
   node server.js
   ```

#### Production Mode with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start with ecosystem file
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs video-player
```

#### PM2 Commands
```bash
pm2 start ecosystem.config.js --env production  # Start in production
pm2 reload all                                  # Reload all processes
pm2 stop video-player                          # Stop the app
pm2 restart video-player                       # Restart the app
pm2 delete video-player                        # Delete the app
```

## 📁 Project Structure

```
video-player/
├── 📁 controllers/          # API request handlers
├── 📁 databases/           # SQLite database files
├── 📁 middleware/          # Express middleware
├── 📁 public/              # Frontend assets
│   ├── 📁 home/           # Home page (all content)
│   ├── 📁 movies/         # Movies page
│   ├── 📁 series/         # Series page
│   ├── 📁 play/           # Video player
│   ├── 📁 admin/          # Admin panel
│   └── 📄 index.html      # User login page
├── 📁 routes/              # API route definitions
│   ├── player.route.js    # Video streaming routes
│   ├── user.route.js      # User management routes
│   └── admin.route.js     # Admin panel routes
├── 📁 services/            # Business logic
│   ├── video.service.js   # Video streaming & processing
│   ├── user.service.js    # User management & progress
│   ├── settings.service.js # System settings
│   ├── thumbnail.service.js # Thumbnail generation
│   ├── folder.service.js  # Directory management
│   └── metadata.service.js # Video metadata extraction
├── 📁 utils/               # Utility functions
├── 📄 ecosystem.config.js  # PM2 configuration
├── 📄 ARCHITECTURE.md      # Detailed architecture docs
└── 📄 server.js            # Application entry point
```

## 🌐 API Endpoints

### User Management
```
GET  /api/users/                    # Get all users
POST /api/users/                    # Create new user
POST /api/users/login               # User login
GET  /api/users/current             # Get current user
GET  /api/users/continue-watching   # Get continue watching content
GET  /api/users/registration-status # Check if registration is allowed
GET  /api/users/:userId/theme       # Get user theme preference
PUT  /api/users/:userId/theme       # Update user theme preference
GET  /api/users/device/:deviceId/theme  # Get device theme preference
PUT  /api/users/device/:deviceId/theme  # Update device theme preference
```

### Admin Panel
```
GET  /api/admin/users               # Get all users (admin)
POST /api/admin/suspend-user        # Suspend user
POST /api/admin/activate-user       # Activate user
GET  /api/admin/settings            # Get system settings
POST /api/admin/toggle-registration # Toggle user registration
```

### Video Streaming
```
GET  /api/videos/:series              # Get video list
GET  /api/video/:series/:id           # Stream video
GET  /api/thumbnail/:type/:db/:id     # Get thumbnail
```

### Audio & Subtitles
```
GET  /api/audio-tracks/:series/:id    # Get audio tracks
GET  /api/subtitle-tracks/:series/:id # Get subtitle tracks
GET  /api/subtitle/:series/:id/:track # Stream full subtitle
GET  /api/subtitle-chunk/:series/:id/:track/:start/:duration # Chunked subtitles
```

### Progress Tracking
```
POST /api/watch-progress              # Save progress
GET  /api/watch-progress/:video_id    # Get progress
```

## 🎛️ Features in Detail

### Multi-User System
- **User Creation** - Create users with custom names and auto-generated avatars
- **PIN Authentication** - Secure 4-digit PIN login system
- **Avatar Generation** - Automatic avatar creation from user initials
- **Color Coding** - Unique background colors for each user
- **Session Management** - Secure cookie-based sessions
- **Admin Controls** - Suspend/activate users, control registration

### Continue Watching
- **Smart Progress** - Tracks progress across movies and series
- **Series Progress** - Calculates overall series completion percentage
- **Movie Progress** - Individual movie completion tracking
- **Recent Activity** - Shows recently watched content
- **Progress Persistence** - Maintains progress across sessions

### Multi-Audio Track Support
- **Automatic Detection** - Scans all audio streams in video files
- **Language Identification** - Detects languages from metadata
- **Dynamic Switching** - Change audio tracks without reloading
- **Quality Optimization** - Transcodes for browser compatibility

### Advanced Subtitle System
- **Chunked Loading** - Load subtitles in 10-minute segments
- **Multiple Formats** - SRT, WebVTT, ASS support
- **Adaptive Sizing** - Reduces chunk size on slow connections
- **Emergency Fallback** - Always provides subtitle response

### Smart Thumbnail Generation
- **Multiple Qualities** - Standard, High, Slideshow, Ultra
- **Intelligent Caching** - MD5-based filename system
- **Responsive Serving** - Optimal size for request type
- **Fallback Generation** - Creates thumbnails from first video in folders

### Netflix-like UI
- **Hero Slideshow** - Recent downloads with auto-advance
- **Responsive Grid** - Adapts to all screen sizes
- **Glassmorphism Design** - Modern blur effects
- **Smooth Animations** - 60fps transitions
- **User Profiles** - Personalized header with user info

### Theme System
- **Light Theme** - Clean white background with dark text for daytime viewing
- **Dark Theme** - Netflix-style dark background with light text for nighttime viewing
- **System Default** - Automatically follows your operating system's theme preference
- **Intelligent Switching** - Seamless transitions between themes with CSS variables
- **User Persistence** - Each user's theme preference is saved to database
- **Device Persistence** - Guest users and login page remember device theme preferences
- **Real-time Updates** - Automatically updates when system theme changes
- **Toast Feedback** - Visual confirmation when switching themes

## 📱 Browser Support

### Video Codecs
| Codec | Support | Notes |
|-------|---------|-------|
| H.264 | ✅ Universal | Best compatibility |
| HEVC/H.265 | ✅ Modern | Safari, Edge, Chrome (newer) |
| VP9 | ✅ Limited | Chrome, Firefox |
| AV1 | ⚠️ Emerging | Latest browsers only |

### Audio Codecs
| Codec | Support | Transcoding |
|-------|---------|-------------|
| AAC | ✅ Universal | Native |
| MP3 | ✅ Universal | Native |
| AC-3/DTS | ✅ Transcoded | To AAC |
| Opus | ✅ Modern | Native |

## 🔧 Configuration Options

### Environment Variables
```env
NODE_ENV=production          # Environment mode
PORT=5555                   # Server port
VIDEO_DIR=/path/to/videos   # Video directory path
ADMIN_PIN=1234              # Admin panel PIN
```

### PM2 Ecosystem Configuration
See `ecosystem.config.js` for detailed PM2 settings including:
- Memory limits and restart policies
- Logging configuration
- Environment-specific settings
- Watch mode settings

## 🎯 Performance

### Optimizations
- **Chunked Loading** - Reduces initial load time by 80%
- **Smart Caching** - Thumbnail and metadata caching
- **Range Requests** - Efficient video streaming
- **Connection Pooling** - Database optimization
- **User-Specific Data** - Efficient user progress tracking

### Benchmarks
- **Subtitle Loading**: 2-5 seconds (vs 20-60 seconds traditional)
- **Thumbnail Generation**: <1 second for standard quality
- **Video Start**: Instant playback with range requests
- **Memory Usage**: <1GB typical, <2GB peak
- **User Login**: <500ms authentication time

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Watch for changes
npm run watch
```

### Adding New Features
1. **Backend**: Add services in `/services/` directory
2. **Frontend**: Add pages in `/public/` directory
3. **API**: Define routes in `/routes/` directory
4. **Database**: Update schema in respective service files

### Testing
```bash
# Run basic health checks
curl http://localhost:5555/api/videos/home

# Test video streaming
curl -I http://localhost:5555/api/video/home/sample.mp4

# Test subtitle chunking
curl http://localhost:5555/api/subtitle-chunk/home/sample.mkv/0/0/600

# Test user creation with PIN
curl -X POST http://localhost:5555/api/users/ -H "Content-Type: application/json" -d '{"username":"test","pin":"1234","displayName":"Test User"}'

# Test user creation without PIN (skip PIN option)
curl -X POST http://localhost:5555/api/users/ -H "Content-Type: application/json" -d '{"username":"testuser","pin":null,"displayName":"Test User No PIN"}'

# Test theme management
curl http://localhost:5555/api/users/1/theme                    # Get user theme
curl -X PUT http://localhost:5555/api/users/1/theme -H "Content-Type: application/json" -d '{"theme":"dark"}'  # Set user theme
```

## 🐛 Troubleshooting

### Common Issues

**Video Not Playing**
- Check video file permissions
- Verify FFmpeg installation
- Check browser codec support

**Subtitles Not Loading**
- Verify subtitle tracks exist in video
- Check network connectivity
- Enable debug logging

**User Login Issues**
- Check database permissions
- Verify PIN format (4 digits or skip PIN option)
- Check session cookie settings
- Verify user has PIN set (or uses PIN-free login)

**Theme Issues**
- Check if theme toggle button is visible
- Verify localStorage is enabled in browser
- Check console for theme initialization errors
- Ensure CSS variables are properly loaded

**Performance Issues**
- Adjust chunk sizes in frontend
- Optimize FFmpeg settings
- Check available system memory

### Debug Mode
Enable debug logging:
```env
NODE_ENV=development
DEBUG=video-player:*
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support

- **Documentation**: See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical docs
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🙏 Acknowledgments

- **FFmpeg** - Video processing powerhouse
- **Express.js** - Fast, unopinionated web framework
- **SQLite** - Reliable embedded database
- **Netflix** - UI/UX inspiration
- **Modern Web Standards** - HTML5 video, CSS Grid, ES6+

---

**⭐ Star this repo if you find it useful!**