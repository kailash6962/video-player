const express = require('express');
const router = express.Router();
const UserService = require('../services/user.service');
const SettingsService = require('../services/settings.service');
const crypto = require('crypto');

// Hash admin PIN
function hashAdminPin(pin) {
    return crypto.createHash('sha256').update(pin + 'vidstream_admin_salt').digest('hex');
}

// Verify admin PIN
function verifyAdminPin(pin) {
    const adminPin = process.env.ADMIN_PIN || '0000'; // Default PIN if not set
    const hashedInput = hashAdminPin(pin);
    const hashedAdmin = hashAdminPin(adminPin);
    return hashedInput === hashedAdmin;
}

// Get all users for admin panel
router.get('/users', async (req, res) => {
    try {
        const users = await UserService.getAllUsers();

        // Include suspended users by modifying the query temporarily
        const allUsers = await UserService.getAllUsersIncludingSuspended();

        res.json(allUsers);
    } catch (error) {
        // Error getting users for admin handled silently
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Suspend user
router.post('/suspend-user', async (req, res) => {
    try {
        const { userId, pin } = req.body;

        if (!userId || !pin) {
            return res.status(400).json({ error: 'User ID and PIN are required' });
        }

        // Verify admin PIN
        if (!verifyAdminPin(pin)) {
            return res.status(401).json({ error: 'Invalid admin PIN' });
        }

        // Suspend the user
        const success = await UserService.suspendUser(userId);

        if (success) {
            res.json({ success: true, message: 'User suspended successfully' });
        } else {
            res.status(400).json({ error: 'Failed to suspend user' });
        }
    } catch (error) {
        // Error suspending user handled silently
        res.status(500).json({ error: 'Failed to suspend user' });
    }
});

// Activate user
router.post('/activate-user', async (req, res) => {
    try {
        const { userId, pin } = req.body;

        if (!userId || !pin) {
            return res.status(400).json({ error: 'User ID and PIN are required' });
        }

        // Verify admin PIN
        if (!verifyAdminPin(pin)) {
            return res.status(401).json({ error: 'Invalid admin PIN' });
        }

        // Activate the user
        const success = await UserService.activateUser(userId);

        if (success) {
            res.json({ success: true, message: 'User activated successfully' });
        } else {
            res.status(400).json({ error: 'Failed to activate user' });
        }
    } catch (error) {
        // Error activating user handled silently
        res.status(500).json({ error: 'Failed to activate user' });
    }
});

// Get system settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await SettingsService.getAllSettings();
        res.json(settings);
    } catch (error) {
        // Error getting settings handled silently
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Toggle user registration
router.post('/toggle-registration', async (req, res) => {
    try {
        const { allowRegistration, pin } = req.body;

        if (typeof allowRegistration !== 'boolean' || !pin) {
            return res.status(400).json({ error: 'Registration setting and PIN are required' });
        }

        // Verify admin PIN
        if (!verifyAdminPin(pin)) {
            return res.status(401).json({ error: 'Invalid admin PIN' });
        }

        // Update the setting
        const success = await SettingsService.setRegistrationAllowed(allowRegistration);

        if (success) {
            const status = allowRegistration ? 'enabled' : 'disabled';
            res.json({ success: true, message: `User registration ${status} successfully` });
        } else {
            res.status(500).json({ error: 'Failed to update registration setting' });
        }
    } catch (error) {
        // Error toggling registration handled silently
        res.status(500).json({ error: 'Failed to update registration setting' });
    }
});

module.exports = router;
