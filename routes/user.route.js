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
        // Error getting users from database handled silently
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
        // Error creating user handled silently
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
        // Error logging in user handled silently
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
        // Error getting current user handled silently
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

// Get user's continue watching
router.get('/continue-watching', async (req, res) => {
    // Continue watching request received
    try {
        const userId = req.cookies.user_id || 'guest';
        // Continue watching request received for user
        const limit = parseInt(req.query.limit) || 10;

        const videos = await UserService.getContinueWatching(userId);
        res.json(videos);
    } catch (error) {
        // Error getting continue watching handled silently
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
        // Error getting user stats handled silently
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
        // Error updating progress handled silently
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
        // Error setting active video handled silently
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
        // Error checking registration status handled silently
        // Default to allowed if error
        res.json({ allowRegistration: true });
    }
});

// Get continue watching content
router.get('/continue-watching', async (req, res) => {
    // Continue watching request received
    try {
        const userId = req.cookies.user_id;
        if (!userId) {
            return res.status(401).json({ error: 'No user session' });
        }

        // Set cache control headers to prevent 304 responses
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        const continueWatching = await UserService.getContinueWatching(userId);
        // Continue watching items processed
        res.json(continueWatching);
    } catch (error) {
        // Error getting continue watching handled silently
        res.status(500).json({ error: 'Failed to get continue watching content' });
    }
});

module.exports = router;
