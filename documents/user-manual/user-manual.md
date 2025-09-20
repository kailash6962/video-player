# 📖 User Manual

## Netflix-Style Video Player - Complete User Guide

Welcome to your personal Netflix-style video streaming platform! This comprehensive guide will help you make the most of all features and capabilities.

---

## 📋 Table of Contents

- [Getting Started](#-getting-started)
- [User Management](#-user-management)
- [Video Playback](#-video-playback)
- [Theme System](#-theme-system)
- [Continue Watching](#-continue-watching)
- [Admin Panel](#-admin-panel)
- [Mobile Experience](#-mobile-experience)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Troubleshooting](#-troubleshooting)
- [Tips & Tricks](#-tips--tricks)

---

## 🚀 Getting Started

### First Time Access

1. **Open your browser** and navigate to your video player URL
   - Local: `http://localhost:5555`
   - Network: `http://your-server-ip:5555`

2. **User Selection Screen**
   - You'll see the main login screen with available users
   - If this is your first time, you'll need to create a user account

### Creating Your First User Account

1. **Click "Add New User"** button (+ icon)
2. **Enter User Information:**
   - **Username**: Your login identifier (must be unique)
   - **Display Name**: Your full name shown in the interface
   - **PIN**: 4-digit security PIN (optional - you can skip this)

3. **PIN Options:**
   - **Set PIN**: Enter a 4-digit number for secure access
   - **Skip PIN**: Click "Skip PIN" for quick access without security

4. **Avatar Generation**: Your avatar will be automatically created with:
   - Your initials
   - A unique color scheme
   - Consistent appearance across all pages

### Logging In

#### With PIN Protection:
1. Click on your user card
2. Enter your 4-digit PIN using the on-screen keypad
3. Click "Login" or press the checkmark

#### Without PIN (Skip PIN users):
1. Simply click on your user card
2. You'll be logged in immediately

---

## 👥 User Management

### User Profiles

Each user gets their own:
- **Personal Avatar**: Unique color and initials
- **Watch Progress**: Individual viewing history
- **Theme Preference**: Personal light/dark mode settings
- **Continue Watching**: Personalized recommendations

### Managing Multiple Users

#### Adding New Users:
1. From any page, click the user menu (top right)
2. Select "Switch User" 
3. Click "Add New User" on the selection screen
4. Follow the registration process

#### Switching Between Users:
1. Click your avatar/name in the top right
2. Select "Switch User"
3. Choose a different user or add a new one

### User Settings

#### Changing Your Theme:
1. Click the theme toggle button (🌙/☀️) in the header
2. Cycles through: System → Light → Dark
3. Your preference is automatically saved

#### Account Security:
- PIN-protected accounts require PIN for login
- No-PIN accounts allow instant access
- Admin can suspend/activate accounts

---

## 🎬 Video Playback

### Browsing Content

#### Home Page:
- **Hero Slideshow**: Featured recent content with auto-advance
- **Continue Watching**: Pick up where you left off
- **All Content**: Browse by Movies, Series, and other categories

#### Movies Page:
- Grid view of all movie content
- Hover for quick preview and details
- Click to start watching

#### Series Page:
- Organized by TV series and multi-episode content
- Episode tracking and progress
- Automatic next episode suggestions

### Playing Videos

#### Starting Playback:
1. **Click any video thumbnail** to start playing
2. **Video Player Features:**
   - Full Netflix-style interface
   - Automatic quality selection
   - Progressive loading for instant start

#### Video Player Controls:

**Basic Controls:**
- **Play/Pause**: Click video or press Spacebar
- **Volume**: Click speaker icon or use volume slider
- **Progress**: Click progress bar to jump to specific time
- **Fullscreen**: Click fullscreen icon or press F

**Advanced Controls:**
- **Audio Tracks**: Switch between available language tracks
- **Subtitles**: Enable/disable and select subtitle languages
- **Quality**: Automatic quality adjustment based on connection
- **Speed**: Playback speed control (0.5x to 2x)

#### Multi-Audio Support:
1. **Click the audio track button** (🎵) during playback
2. **Select from available languages:**
   - English, Spanish, French, etc.
   - Shows codec and channel information
3. **Seamless switching** without interrupting playback

#### Subtitle System:
1. **Click the subtitle button** (CC) during playback
2. **Choose subtitle track:**
   - Multiple languages available
   - Automatic format detection (SRT, WebVTT, ASS)
3. **Chunked Loading**: Subtitles load in 10-minute segments for faster performance

### Video Quality & Performance

#### Automatic Quality:
- **Adaptive Streaming**: Quality adjusts based on your connection
- **Range Requests**: Videos start playing immediately
- **Progressive Download**: No waiting for full download

#### Supported Formats:
- **Video**: MP4, MKV, AVI, MOV, WebM
- **Audio**: AAC, MP3, AC-3, DTS (transcoded to browser-compatible formats)
- **Subtitles**: SRT, WebVTT, ASS

---

## 🎨 Theme System

### Theme Options

#### Light Theme:
- Clean white background
- Dark text for easy daytime reading
- Optimal for bright environments

#### Dark Theme:
- Netflix-style dark background
- Light text for comfortable night viewing
- Reduces eye strain in low light

#### System Default:
- Automatically follows your device's theme setting
- Changes when you switch your OS theme
- Perfect for users who change themes regularly

### Changing Themes

#### Quick Theme Toggle:
1. **Click the theme button** in the top header (🌙/☀️/⚙️)
2. **Cycles through options**: System → Light → Dark → System
3. **Visual confirmation**: Small toast notification shows current theme
4. **Automatic saving**: Your preference is remembered

#### Theme Persistence:
- **Logged-in users**: Theme saved to your user profile
- **Guest/Login page**: Theme saved to your device
- **Cross-device sync**: Your theme follows you when logged in

### Theme Indicators

- **🌙 Moon Icon**: Dark theme active
- **☀️ Sun Icon**: Light theme active  
- **⚙️ System Icon**: Following system theme
- **Toast Notification**: Shows "Light Theme", "Dark Theme", or "System Default (Light/Dark)"

---

## 📺 Continue Watching

### How It Works

#### Automatic Progress Tracking:
- **Every 10 seconds**: Your progress is automatically saved
- **Cross-session**: Pick up exactly where you left off
- **Per-user tracking**: Each user has their own progress

#### Continue Watching Section:
- **Recent videos**: Shows your most recently watched content
- **Progress indicators**: Visual progress bars show completion
- **Smart sorting**: Most recent activity appears first

### Managing Your Watch List

#### Resume Watching:
1. **Go to Home, Movies, or Series page**
2. **Find "Continue Watching" section**
3. **Click any video** to resume from your last position
4. **Automatic positioning**: Video starts exactly where you stopped

#### Progress Information:
- **Percentage complete**: Shows how much you've watched
- **Time remaining**: Calculates remaining watch time
- **Last watched**: Shows when you last viewed the content

### Series Progress

#### Episode Tracking:
- **Individual episodes**: Each episode tracks separately
- **Series overview**: Shows overall series progress
- **Next episode**: Automatic suggestions for next episode

---

## ⚙️ Admin Panel

*Note: Admin features require admin PIN access*

### Accessing Admin Panel

1. **Navigate to**: `http://your-server:5555/admin`
2. **Enter Admin PIN**: Default is "0000" (check with your administrator)
3. **Admin Dashboard**: Access all administrative functions

### User Management

#### View All Users:
- **User list**: See all registered users
- **User status**: Active/suspended status
- **Registration dates**: When users joined
- **Last activity**: Recent login information

#### User Actions:
- **Suspend User**: Temporarily disable user account
- **Activate User**: Re-enable suspended accounts
- **View Statistics**: User activity and watch time

### System Settings

#### Registration Control:
- **Enable/Disable**: Control new user registrations
- **Security**: Prevent unauthorized account creation
- **User limits**: Manage total user count

#### System Information:
- **Server status**: System health and performance
- **Database info**: Storage usage and statistics
- **Video library**: Content statistics and metrics

---

## 📱 Mobile Experience

### Mobile-Optimized Interface

#### Responsive Design:
- **Touch-friendly**: Large buttons and touch targets
- **Swipe gestures**: Navigate with finger gestures
- **Portrait/landscape**: Automatic orientation handling

#### Mobile Navigation:
- **Hamburger menu**: Collapsible navigation for small screens
- **Touch controls**: Optimized video player controls
- **Mobile keyboard**: On-screen PIN entry

### Mobile Video Playback

#### Touch Controls:
- **Tap to play/pause**: Single tap on video
- **Double-tap**: Jump forward/backward 10 seconds
- **Pinch to zoom**: Zoom video (where supported)
- **Swipe for volume/brightness**: Gesture controls

#### Mobile-Specific Features:
- **Automatic quality**: Optimized for mobile data connections
- **Battery optimization**: Efficient video decoding
- **Background play**: Continue audio when switching apps (where supported)

---

## ⌨️ Keyboard Shortcuts

### Video Player Shortcuts

| Key | Action |
|-----|--------|
| **Spacebar** | Play/Pause |
| **F** | Toggle Fullscreen |
| **M** | Mute/Unmute |
| **↑/↓** | Volume Up/Down |
| **←/→** | Seek Backward/Forward (10s) |
| **Shift + ←/→** | Seek Backward/Forward (5s) |
| **0-9** | Jump to 0%-90% of video |
| **Home** | Jump to beginning |
| **End** | Jump to end |
| **Esc** | Exit fullscreen |

### Interface Shortcuts

| Key | Action |
|-----|--------|
| **Ctrl + F** | Search (when available) |
| **Tab** | Navigate between elements |
| **Enter** | Select/Activate |
| **Esc** | Close modals/menus |

### PIN Entry Shortcuts

| Key | Action |
|-----|--------|
| **0-9** | Enter PIN digits |
| **Backspace** | Delete last digit |
| **Enter** | Submit PIN |
| **Esc** | Cancel PIN entry |

---

## 🔧 Troubleshooting

### Common Issues

#### Video Won't Play:
**Possible Causes:**
- Unsupported video format
- Network connectivity issues
- Browser compatibility

**Solutions:**
1. **Check format**: Ensure video is MP4, MKV, or AVI
2. **Refresh page**: Try reloading the browser
3. **Clear cache**: Clear browser cache and cookies
4. **Try different browser**: Test with Chrome, Firefox, or Safari
5. **Check network**: Ensure stable internet connection

#### Slow Loading:
**Possible Causes:**
- Slow internet connection
- Large video files
- Server performance

**Solutions:**
1. **Check connection**: Test your internet speed
2. **Lower quality**: Let automatic quality adjustment work
3. **Close other apps**: Free up bandwidth
4. **Try wired connection**: Use Ethernet instead of Wi-Fi

#### Subtitles Not Showing:
**Possible Causes:**
- No subtitle tracks in video
- Subtitle format not supported
- Loading issues

**Solutions:**
1. **Check availability**: Click CC button to see available tracks
2. **Try different track**: Select different subtitle language
3. **Refresh video**: Restart the video player
4. **Check format**: Ensure subtitles are SRT, WebVTT, or ASS

#### Login Issues:
**Possible Causes:**
- Incorrect PIN
- User account suspended
- Browser issues

**Solutions:**
1. **Check PIN**: Ensure correct 4-digit PIN
2. **Try different user**: Test with another account
3. **Contact admin**: If account is suspended
4. **Clear cookies**: Reset browser cookies

#### Theme Not Changing:
**Possible Causes:**
- Browser cache issues
- JavaScript disabled
- Theme system error

**Solutions:**
1. **Refresh page**: Reload browser completely
2. **Enable JavaScript**: Ensure JS is enabled
3. **Clear cache**: Clear browser cache
4. **Try incognito**: Test in private browsing mode

### Browser-Specific Issues

#### Chrome:
- **Hardware acceleration**: Enable in chrome://settings/system
- **Clear data**: Use Chrome's clear browsing data
- **Extensions**: Disable ad blockers temporarily

#### Firefox:
- **Media settings**: Check media.autoplay settings
- **Clear data**: Use Firefox's clear data feature
- **Safe mode**: Try Firefox safe mode

#### Safari:
- **Auto-play**: Check auto-play settings
- **Cross-site tracking**: Disable prevention temporarily
- **Clear website data**: Clear Safari website data

---

## 💡 Tips & Tricks

### Optimizing Your Experience

#### For Best Performance:
1. **Use wired internet**: Ethernet connection for 4K content
2. **Close unnecessary tabs**: Free up browser memory
3. **Update browser**: Keep browser up to date
4. **Enable hardware acceleration**: Use GPU for video decoding

#### Content Organization:
1. **Organize folders**: Keep videos in organized directories
2. **Consistent naming**: Use clear, descriptive file names
3. **Series structure**: Group episodes in series folders
4. **Remove duplicates**: Clean up duplicate video files

#### User Management:
1. **Unique usernames**: Use memorable, unique usernames
2. **Strong PINs**: Use 4-digit PINs that aren't easily guessed
3. **Regular cleanup**: Remove unused user accounts
4. **Theme consistency**: Choose themes that work for your environment

### Advanced Features

#### Multi-Audio Content:
- **Language learning**: Use different audio tracks for language practice
- **Accessibility**: Switch to descriptive audio tracks when available
- **Quality comparison**: Compare different audio encodings

#### Subtitle Features:
- **Language learning**: Use subtitles in different languages
- **Accessibility**: Enable subtitles for hearing accessibility
- **Reading practice**: Use subtitles to improve reading skills

#### Theme Automation:
- **System theme**: Let your OS control light/dark switching
- **Time-based**: Manually switch themes based on time of day
- **Environment**: Use light themes in bright rooms, dark in dim rooms

### Keyboard Power User Tips:

#### Quick Navigation:
- **Tab through interface**: Use Tab key for keyboard-only navigation
- **Arrow keys**: Navigate menus and selections
- **Enter to select**: Activate buttons and links

#### Video Control Mastery:
- **Precise seeking**: Use Shift + arrows for 5-second jumps
- **Percentage jumps**: Use number keys to jump to specific percentages
- **Quick mute**: Press M for instant mute/unmute

### Mobile Optimization:

#### Data Saving:
- **Wi-Fi only**: Watch high-quality content on Wi-Fi
- **Mobile data**: Let quality auto-adjust for cellular
- **Preloading**: Start videos on Wi-Fi, continue on mobile

#### Battery Life:
- **Lower brightness**: Reduce screen brightness while watching
- **Close apps**: Close other apps to save battery
- **Airplane mode**: Use airplane mode + Wi-Fi for better battery

---

## 🆘 Getting Help

### Self-Help Resources

#### Documentation:
- **Installation Guide**: Setup and configuration help
- **System Requirements**: Hardware and software needs
- **API Documentation**: For developers and advanced users

#### Troubleshooting Steps:
1. **Check system requirements**: Ensure your system meets minimums
2. **Update software**: Keep browser and system updated
3. **Clear cache**: Reset browser cache and cookies
4. **Test different content**: Try different videos to isolate issues
5. **Check logs**: Look for error messages in browser console

### Contact Support

#### Before Contacting Support:
- **Note error messages**: Copy exact error text
- **Browser information**: Note browser type and version
- **System information**: OS version and device type
- **Steps to reproduce**: Document what you were doing when issue occurred

#### Support Channels:
- **GitHub Issues**: Technical bugs and feature requests
- **Community Forum**: User discussions and tips
- **Email Support**: Direct technical assistance
- **Documentation**: Comprehensive guides and references

### Reporting Issues

#### Information to Include:
1. **User account**: Username (not PIN!)
2. **Video details**: File name and format
3. **Browser**: Type, version, and extensions
4. **Error messages**: Exact text of any errors
5. **Steps**: What you were doing when issue occurred

---

## 🎉 Enjoying Your Video Player

### Making the Most of Your Experience

#### Content Discovery:
- **Explore all sections**: Check Movies, Series, and other categories
- **Use continue watching**: Pick up where you left off
- **Try different themes**: Find your preferred viewing mode

#### Social Features:
- **Multiple users**: Create accounts for family members
- **Individual progress**: Everyone gets their own watch history
- **Shared library**: Access the same content across all users

#### Customization:
- **Theme preferences**: Set your preferred light/dark mode
- **Audio preferences**: Choose your preferred language tracks
- **Subtitle preferences**: Enable subtitles in your preferred language

### Welcome to Your Personal Streaming Platform!

You now have access to a powerful, Netflix-style video streaming platform with:
- ✅ **Multi-user support** with individual progress tracking
- ✅ **Advanced video playback** with multi-audio and subtitle support
- ✅ **Beautiful themes** that adapt to your preferences
- ✅ **Continue watching** functionality to never lose your place
- ✅ **Mobile-optimized** experience for any device
- ✅ **Admin controls** for managing users and settings

**Enjoy your personalized streaming experience!** 🍿📺

---

*Last updated: September 2025 | Version 1.0.0*
