const express = require('express');
const router = express.Router();
const UserService = require('../services/user.service');
const SettingsService = require('../services/settings.service');

function hashPin(pin) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(pin + 'vidstream_tv_salt').digest('hex');
}

// Get all users for selection page
router.get('/', async (req, res) => {
    try {
        const users = await UserService.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Error getting users from database:', error.message);
        res.json([]); // Return empty array if no users exist
    }
});

// Create new user
router.post('/', async (req, res) => {
    try {
        // Check if registration is allowed
        const registrationAllowed = await SettingsService.isRegistrationAllowed();
        if (!registrationAllowed) {
            return res.status(403).json({ error: 'User registration is currently disabled' });
        }
        
        const { username, pin, display_name } = req.body;
        
        if (!username || !pin || !display_name) {
            return res.status(400).json({ error: 'Username, PIN, and display name are required' });
        }
        
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
        }
        
        if (username.trim().length === 0 || display_name.trim().length === 0) {
            return res.status(400).json({ error: 'Username and display name cannot be empty' });
        }
        
        const userId = await UserService.createUser(username.trim(), pin, display_name.trim());
        const user = await UserService.getUserById(userId);
        
        res.json({ 
            success: true, 
            userId,
            user: {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                avatar_emoji: user.avatar_emoji,
                avatar_bg_color: user.avatar_bg_color,
                avatar_text_color: user.avatar_text_color
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Username already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create user' });
        }
    }
});

// Login user with PIN
router.post('/login', async (req, res) => {
    try {
        const { user_id, pin } = req.body;
        
        if (!user_id || !pin) {
            return res.status(400).json({ error: 'User ID and PIN are required' });
        }
        
        const user = await UserService.loginUser(user_id, pin);
        res.json({ 
            success: true, 
            user: {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                avatar_emoji: user.avatar_emoji,
                avatar_bg_color: user.avatar_bg_color,
                avatar_text_color: user.avatar_text_color
            }
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(401).json({ error: 'Invalid PIN' });
    }
});

// Get current user info
router.get('/current', async (req, res) => {
    try {
        const userId = req.cookies.user_id;
        
        if (userId === 'guest') {
            res.json({
                user: {
                    id: 'guest',
                    username: 'guest',
                    display_name: 'Guest',
                    avatar_emoji: '👤'
                }
            });
            return;
        }
        
        if (!userId) {
            return res.status(401).json({ error: 'No user session' });
        }
        
        const user = await UserService.getUserById(userId);
        if (!user) {
            return res.status(401).json({ error: 'Invalid user session' });
        }
        
        res.json({ user });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

// Get user's continue watching
router.get('/continue-watching', async (req, res) => {
    try {
        const userId = req.cookies.user_id || 'guest';
        const limit = parseInt(req.query.limit) || 10;
        
        const videos = await UserService.getUserContinueWatching(userId, limit);
        res.json(videos);
    } catch (error) {
        console.error('Error getting continue watching:', error);
        res.status(500).json({ error: 'Failed to get continue watching' });
    }
});

// Get user stats
router.get('/stats', async (req, res) => {
    try {
        const userId = req.cookies.user_id || 'guest';
        
        if (userId === 'guest') {
            res.json({
                total_videos: 0,
                watched_videos: 0,
                avg_watch_time: 0,
                max_watch_time: 0,
                last_activity: null
            });
            return;
        }
        
        const stats = await UserService.getUserStats(userId);
        res.json(stats);
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({ error: 'Failed to get user stats' });
    }
});

// Update watch progress
router.post('/progress', async (req, res) => {
    try {
        const userId = req.cookies.user_id || 'guest';
        const { video_id, current_time, size } = req.body;
        
        if (!video_id || current_time === undefined) {
            return res.status(400).json({ error: 'Video ID and current time are required' });
        }
        
        await UserService.updateUserProgress(userId, video_id, current_time, size);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Set active video
router.post('/active', async (req, res) => {
    try {
        const userId = req.cookies.user_id || 'guest';
        const { video_id } = req.body;
        
        if (!video_id) {
            return res.status(400).json({ error: 'Video ID is required' });
        }
        
        await UserService.setActiveVideo(userId, video_id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error setting active video:', error);
        res.status(500).json({ error: 'Failed to set active video' });
    }
});

// Logout (clear session)
router.post('/logout', (req, res) => {
    res.clearCookie('user_id');
    res.json({ success: true });
});

// Check if registration is allowed
router.get('/registration-status', async (req, res) => {
    try {
        const registrationAllowed = await SettingsService.isRegistrationAllowed();
        res.json({ allowRegistration: registrationAllowed });
    } catch (error) {
        console.error('Error checking registration status:', error);
        // Default to allowed if error
        res.json({ allowRegistration: true });
    }
});

module.exports = router;
