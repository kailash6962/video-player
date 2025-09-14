const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

class UserService {
    constructor() {
        this.initDatabase().catch(err => {
            console.log('Warning: Database initialization failed, using fallback mode:', err.message);
        });
    }

    async initDatabase() {
        const db = new sqlite3.Database('./databases/home.db');
        
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                // Create users table if it doesn't exist
                db.run(`
                    CREATE TABLE IF NOT EXISTS users (
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
                `, (err) => {
                    if (err) console.log('Users table creation error:', err.message);
                });
                
                // Add color columns if they don't exist (for existing databases)
                db.run(`ALTER TABLE users ADD COLUMN avatar_bg_color TEXT DEFAULT '#ff0000'`, (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.log('Error adding avatar_bg_color column:', err.message);
                    }
                });
                db.run(`ALTER TABLE users ADD COLUMN avatar_text_color TEXT DEFAULT '#ffffff'`, (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.log('Error adding avatar_text_color column:', err.message);
                    }
                });
                
                // Ensure video_metadata table has the correct multi-user schema
                db.run(`
                    CREATE TABLE IF NOT EXISTS video_metadata (
                        video_id TEXT NOT NULL,
                        user_id TEXT DEFAULT 'guest',
                        current_time REAL DEFAULT 0,
                        last_opened TEXT,
                        size INTEGER,
                        length TEXT,
                        active INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (user_id, video_id)
                    )
                `, (err) => {
                    if (err) {
                        console.log('Video metadata table creation/update error:', err.message);
                    } else {
                        console.log('Video metadata table ready with multi-user schema');
                    }
                });
                
                // Create indexes for better performance (ignore errors if they exist)
                db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)', () => {});
                
                // Update existing users with colors if they don't have them
                this.updateUsersWithColors(db, () => {
                    console.log('User database initialized successfully');
                    db.close();
                    resolve();
                });
            });
        });
    }

    updateUsersWithColors(db, callback) {
        // Get all users that don't have colors set (are using defaults)
        db.all(`
            SELECT id, username, display_name 
            FROM users 
            WHERE avatar_bg_color = '#ff0000' AND avatar_text_color = '#ffffff'
        `, (err, users) => {
            if (err || !users || users.length === 0) {
                return callback();
            }
            
            console.log(`Updating ${users.length} users with unique colors...`);
            
            let completed = 0;
            users.forEach(user => {
                const colors = this.generateAvatarColor(user.username);
                console.log(`- ${user.display_name} (${user.username}): ${colors.bg}`);
                
                db.run(
                    'UPDATE users SET avatar_bg_color = ?, avatar_text_color = ? WHERE id = ?',
                    [colors.bg, colors.text, user.id],
                    (updateErr) => {
                        completed++;
                        if (updateErr) {
                            console.error(`Error updating user ${user.username}:`, updateErr);
                        }
                        
                        if (completed === users.length) {
                            console.log('✅ All users updated with unique colors!');
                            callback();
                        }
                    }
                );
            });
        });
    }

    generateAvatar(displayName) {
        if (!displayName) return 'U';
        
        const words = displayName.trim().split(/\s+/);
        
        if (words.length === 1) {
            // Single word - use first letter
            return words[0].charAt(0).toUpperCase();
        } else {
            // Multiple words - use first letter of first and last word
            const firstInitial = words[0].charAt(0).toUpperCase();
            const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
            return firstInitial + lastInitial;
        }
    }

    generateAvatarColor(username) {
        // Generate a unique color based on username
        const colors = [
            { bg: '#ff0000', text: '#ffffff' }, // Red
            { bg: '#ff6b35', text: '#ffffff' }, // Orange Red
            { bg: '#f7931e', text: '#ffffff' }, // Orange
            { bg: '#ffd700', text: '#000000' }, // Gold
            { bg: '#9acd32', text: '#000000' }, // Yellow Green
            { bg: '#32cd32', text: '#ffffff' }, // Lime Green
            { bg: '#00ced1', text: '#ffffff' }, // Dark Turquoise
            { bg: '#1e90ff', text: '#ffffff' }, // Dodger Blue
            { bg: '#4169e1', text: '#ffffff' }, // Royal Blue
            { bg: '#8a2be2', text: '#ffffff' }, // Blue Violet
            { bg: '#da70d6', text: '#ffffff' }, // Orchid
            { bg: '#ff1493', text: '#ffffff' }, // Deep Pink
            { bg: '#dc143c', text: '#ffffff' }, // Crimson
            { bg: '#b22222', text: '#ffffff' }, // Fire Brick
            { bg: '#ff4500', text: '#ffffff' }, // Orange Red
            { bg: '#ff8c00', text: '#ffffff' }, // Dark Orange
            { bg: '#ffa500', text: '#000000' }, // Orange
            { bg: '#ffb347', text: '#000000' }, // Peach
            { bg: '#20b2aa', text: '#ffffff' }, // Light Sea Green
            { bg: '#48d1cc', text: '#000000' }, // Medium Turquoise
            { bg: '#40e0d0', text: '#000000' }, // Turquoise
            { bg: '#00bfff', text: '#ffffff' }, // Deep Sky Blue
            { bg: '#87ceeb', text: '#000000' }, // Sky Blue
            { bg: '#6495ed', text: '#ffffff' }, // Cornflower Blue
            { bg: '#7b68ee', text: '#ffffff' }, // Medium Slate Blue
            { bg: '#9370db', text: '#ffffff' }, // Medium Purple
            { bg: '#ba55d3', text: '#ffffff' }, // Medium Orchid
            { bg: '#ee82ee', text: '#000000' }, // Violet
            { bg: '#ff69b4', text: '#ffffff' }, // Hot Pink
            { bg: '#ff6347', text: '#ffffff' }  // Tomato
        ];
        
        // Create a hash from the username
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            const char = username.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Use absolute value and modulo to get a color index
        const colorIndex = Math.abs(hash) % colors.length;
        return colors[colorIndex];
    }

    hashPin(pin) {
        return crypto.createHash('sha256').update(pin + 'vidstream_tv_salt').digest('hex');
    }

    async getAllUsers() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            
            db.all(`
                SELECT id, username, display_name, avatar_emoji, avatar_bg_color, avatar_text_color, last_login, is_active
                FROM users 
                WHERE is_active = 1
                ORDER BY last_login DESC, created_at ASC
            `, (err, users) => {
                db.close();
                if (err) reject(err);
                else resolve(users || []);
            });
        });
    }

    async createUser(username, pin, displayName) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            const pinHash = this.hashPin(pin);
            
            // Generate avatar from name initials
            const avatarEmoji = this.generateAvatar(displayName);
            
            // Generate unique color based on username
            const avatarColor = this.generateAvatarColor(username);
            
            db.run(`
                INSERT INTO users (username, pin_hash, display_name, avatar_emoji, avatar_bg_color, avatar_text_color)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [username, pinHash, displayName, avatarEmoji, avatarColor.bg, avatarColor.text], function(err) {
                db.close();
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async loginUser(userId, pin) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            const pinHash = this.hashPin(pin);
            
            db.get(`
                SELECT * FROM users 
                WHERE id = ? AND pin_hash = ? AND is_active = 1
            `, [userId, pinHash], (err, user) => {
                if (err) {
                    db.close();
                    reject(err);
                    return;
                }
                
                if (!user) {
                    db.close();
                    reject(new Error('Invalid PIN'));
                    return;
                }
                
                // Update last login
                db.run(`
                    UPDATE users 
                    SET last_login = datetime('now') 
                    WHERE id = ?
                `, [userId], (err) => {
                    db.close();
                    if (err) reject(err);
                    else resolve(user);
                });
            });
        });
    }

    async getUserById(userId) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            
            db.get(`
                SELECT id, username, display_name, avatar_emoji, avatar_bg_color, avatar_text_color, last_login
                FROM users 
                WHERE id = ? AND is_active = 1
            `, [userId], (err, user) => {
                db.close();
                if (err) reject(err);
                else resolve(user);
            });
        });
    }

    async getUserProgress(userId, videoId) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            
            db.get(`
                SELECT * FROM video_metadata 
                WHERE user_id = ? AND video_id = ?
            `, [userId, videoId], (err, progress) => {
                db.close();
                if (err) reject(err);
                else resolve(progress);
            });
        });
    }

    async updateUserProgress(userId, videoId, currentTime, size = 0) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            
            db.run(`
                INSERT OR REPLACE INTO video_metadata 
                (user_id, video_id, current_time, size, last_opened, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, datetime('now'), 0, 
                    COALESCE((SELECT created_at FROM video_metadata WHERE user_id = ? AND video_id = ?), datetime('now')),
                    datetime('now'))
            `, [userId, videoId, currentTime, size, userId, videoId], (err) => {
                db.close();
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async getUserContinueWatching(userId, limit = 10) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            
            db.all(`
                SELECT video_id, current_time, last_opened, size
                FROM video_metadata 
                WHERE user_id = ? AND current_time > 0
                ORDER BY last_opened DESC
                LIMIT ?
            `, [userId, limit], (err, videos) => {
                db.close();
                if (err) reject(err);
                else resolve(videos || []);
            });
        });
    }

    async setActiveVideo(userId, videoId) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            
            db.serialize(() => {
                // Clear all active flags for this user
                db.run(`
                    UPDATE video_metadata 
                    SET active = 0 
                    WHERE user_id = ?
                `, [userId]);
                
                // Set new active video
                db.run(`
                    UPDATE video_metadata 
                    SET active = 1 
                    WHERE user_id = ? AND video_id = ?
                `, [userId, videoId], (err) => {
                    db.close();
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    async getUserStats(userId) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            
            db.get(`
                SELECT 
                    COUNT(*) as total_videos,
                    COUNT(CASE WHEN current_time > 0 THEN 1 END) as watched_videos,
                    AVG(current_time) as avg_watch_time,
                    MAX(current_time) as max_watch_time,
                    MAX(last_opened) as last_activity
                FROM video_metadata 
                WHERE user_id = ?
            `, [userId], (err, stats) => {
                db.close();
                if (err) reject(err);
                else resolve(stats);
            });
        });
    }

    async getAllUsersIncludingSuspended() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            
            db.all(`
                SELECT id, username, display_name, avatar_emoji, avatar_bg_color, avatar_text_color, 
                       created_at, last_login, is_active
                FROM users 
                ORDER BY created_at DESC
            `, (err, users) => {
                db.close();
                if (err) reject(err);
                else resolve(users || []);
            });
        });
    }

    async suspendUser(userId) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            
            db.run(`
                UPDATE users 
                SET is_active = 0 
                WHERE id = ?
            `, [userId], function(err) {
                db.close();
                if (err) {
                    console.error('Error suspending user:', err);
                    reject(err);
                } else {
                    console.log(`User ${userId} suspended`);
                    resolve(this.changes > 0);
                }
            });
        });
    }

    async activateUser(userId) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            
            db.run(`
                UPDATE users 
                SET is_active = 1 
                WHERE id = ?
            `, [userId], function(err) {
                db.close();
                if (err) {
                    console.error('Error activating user:', err);
                    reject(err);
                } else {
                    console.log(`User ${userId} activated`);
                    resolve(this.changes > 0);
                }
            });
        });
    }
}

module.exports = new UserService();
