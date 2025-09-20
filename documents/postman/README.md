# 📚 Video Player API Documentation

This folder contains comprehensive API documentation and testing resources for the Netflix-style Video Player application.

## 📁 Files

### `Video-Player-API.postman_collection.json`
Complete Postman collection with all API endpoints, organized by functionality.

## 🚀 Getting Started with Postman

### 1. Import the Collection
1. Open Postman
2. Click **Import** button
3. Select `Video-Player-API.postman_collection.json`
4. The collection will be imported with all endpoints organized in folders

### 2. Set Environment Variables
The collection uses a `{{base_url}}` variable. Set this up:

1. In Postman, go to **Environments**
2. Create a new environment called "Video Player"
3. Add variable:
   - **Key**: `base_url`
   - **Value**: `http://localhost:5555` (or your server URL)
4. Select this environment when testing

### 3. Authentication Setup
Most endpoints require user authentication via cookies. To test authenticated endpoints:

1. First, run **"User Login with PIN"** or **"User Login without PIN"**
2. The login response will set a `user_id` cookie automatically
3. Subsequent requests will use this cookie for authentication

## 📋 API Categories

### 🔐 User Management
- **Get All Users** - List all users for selection
- **Create User with PIN** - Register user with 4-digit PIN
- **Create User without PIN** - Register user with skip PIN option
- **User Login** - Login with/without PIN
- **Get Current User** - Get logged-in user info
- **User Logout** - Clear session
- **Check Registration Status** - Check if registration is enabled

### 📊 User Progress & Stats
- **Get Continue Watching** - User's continue watching content
- **Get User Stats** - User viewing statistics
- **Update Watch Progress** - Save video progress
- **Set Active Video** - Mark video as currently playing

### 🎬 Video Streaming
- **Get Videos List** - List videos in a folder/series
- **Stream Video** - Stream video with range requests
- **Get All Folders** - List all available folders
- **Get Video Metadata** - Video information and metadata

### 🎵 Audio & Subtitles
- **Get Audio Quality Info** - Audio quality details
- **Get Audio Tracks** - Available audio tracks
- **Get Subtitle Tracks** - Available subtitle tracks
- **Stream Full Subtitle** - Complete subtitle file
- **Stream Subtitle Chunk** - 10-minute subtitle segments

### 📈 Watch Progress
- **Save Watch Progress** - Store viewing progress
- **Get Watch Progress** - Retrieve progress for specific video

### 🖼️ Thumbnails
- **Get Thumbnail** - Video thumbnails in multiple qualities

### ⚙️ Admin Panel
- **Get All Users (Admin)** - All users including suspended
- **Suspend User** - Suspend user account (requires admin PIN)
- **Activate User** - Reactivate suspended user
- **Get System Settings** - System configuration
- **Toggle User Registration** - Enable/disable registration

### 🎨 Theme Management (Future)
- **Get User Theme** - User's theme preference
- **Update User Theme** - Change user theme
- **Get Device Theme** - Device theme preference
- **Update Device Theme** - Change device theme

## 🔧 Testing Tips

### Authentication Flow
```
1. POST /api/users/login (with user_id and pin)
2. Use returned cookie for subsequent requests
3. POST /api/users/logout when done
```

### Video Streaming
```
1. GET /api/videos/home (get video list)
2. GET /api/video/home/movie.mp4 (stream video)
3. POST /api/watch-progress (save progress)
```

### Admin Functions
```
1. Use admin PIN (default: "0000" or check ADMIN_PIN env var)
2. All admin endpoints require PIN verification
3. Admin can suspend/activate users and change settings
```

## 📝 Sample Request Bodies

### Create User with PIN
```json
{
    "username": "john_doe",
    "pin": "1234",
    "display_name": "John Doe"
}
```

### Create User without PIN
```json
{
    "username": "jane_guest",
    "pin": null,
    "display_name": "Jane Guest"
}
```

### User Login
```json
{
    "user_id": 1,
    "pin": "1234"
}
```

### Update Watch Progress
```json
{
    "video_id": "movie_sample.mp4",
    "current_time": 1800,
    "duration": 7200,
    "user_id": 1
}
```

### Admin Actions
```json
{
    "userId": 2,
    "pin": "0000"
}
```

## 🌐 Environment Configuration

### Local Development
- **Base URL**: `http://localhost:5555`
- **Admin PIN**: `0000` (default)

### Production
- **Base URL**: Your production server URL
- **Admin PIN**: Set via `ADMIN_PIN` environment variable

## 🚨 Error Responses

Common error responses you might encounter:

### 400 Bad Request
```json
{
    "error": "Username and display name are required"
}
```

### 401 Unauthorized
```json
{
    "error": "Invalid PIN"
}
```

### 403 Forbidden
```json
{
    "error": "User registration is currently disabled"
}
```

### 404 Not Found
```json
{
    "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
    "error": "Failed to create user"
}
```

## 🔍 Advanced Testing

### Range Requests for Video Streaming
Add `Range` header for partial content:
```
Range: bytes=0-1023
```

### Subtitle Chunking
Test chunked subtitle loading:
```
GET /api/subtitle-chunk/home/movie.mp4/0/0/600
```
- `0` = track index
- `0` = start time (seconds)
- `600` = duration (10 minutes)

### Theme System Testing (Future)
When theme endpoints are implemented:
```json
{
    "theme": "light"  // or "dark" or "system"
}
```

## 📖 Additional Resources

- **Main README**: `../README.md` - Complete application documentation
- **Architecture**: `../ARCHITECTURE.md` - Technical architecture details
- **API Source**: `../routes/` - Route implementations
- **Services**: `../services/` - Business logic

## 🤝 Contributing

When adding new endpoints:
1. Update this Postman collection
2. Add request/response examples
3. Update this README with new categories
4. Test all endpoints thoroughly

---

**💡 Pro Tip**: Use Postman's **Collection Runner** to run all endpoints in sequence for comprehensive API testing!
