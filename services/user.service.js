const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

class UserService {
    constructor() {
        this.initDatabase().catch(err => {
            // Database initialization failed, using fallback mode
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
                    // Users table creation error handled silently
                });

                // Add color columns if they don't exist (for existing databases)
                db.run(`ALTER TABLE users ADD COLUMN avatar_bg_color TEXT DEFAULT '#ff0000'`, (err) => {
                    // Error adding avatar_bg_color column handled silently
                });
                db.run(`ALTER TABLE users ADD COLUMN avatar_text_color TEXT DEFAULT '#ffffff'`, (err) => {
                    // Error adding avatar_text_color column handled silently
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
                    // Video metadata table creation/update handled silently
                });

                // Create indexes for better performance (ignore errors if they exist)
                db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)', () => { });

                // Update existing users with colors if they don't have them
                this.updateUsersWithColors(db, () => {
                    // User database initialized successfully
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

            // Updating users with unique colors

            let completed = 0;
            users.forEach(user => {
                const colors = this.generateAvatarColor(user.username);
                // User color assignment handled silently

                db.run(
                    'UPDATE users SET avatar_bg_color = ?, avatar_text_color = ? WHERE id = ?',
                    [colors.bg, colors.text, user.id],
                    (updateErr) => {
                        completed++;
                        // Error updating user handled silently

                        if (completed === users.length) {
                            // All users updated with unique colors
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
            `, [username, pinHash, displayName, avatarEmoji, avatarColor.bg, avatarColor.text], function (err) {
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
            `, [userId], function (err) {
                db.close();
                if (err) {
                    // Error suspending user handled silently
                    reject(err);
                } else {
                    // User suspended successfully
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
            `, [userId], function (err) {
                db.close();
                if (err) {
                    // Error activating user handled silently
                    reject(err);
                } else {
                    // User activated successfully
                    resolve(this.changes > 0);
                }
            });
        });
    }

    async getContinueWatching(userId) {
        // Getting continue watching for user

        // Get all series databases
        const fs = require('fs');
        const path = require('path');
        const databasesDir = path.join(__dirname, '..', 'databases');

        if (!fs.existsSync(databasesDir)) {
            // Databases directory does not exist
            return [];
        }

        const dbFiles = fs.readdirSync(databasesDir)
            .filter(file => file.endsWith('.sqlite3') && file !== 'home.db');

        // Found video databases

        let continueWatching = [];

        if (dbFiles.length === 0) {
            // No video databases found
            return [];
        }

        // Process databases sequentially to handle async operations
        for (const dbFile of dbFiles) {
            const seriesName = dbFile.replace('.sqlite3', '');
            const seriesDbPath = path.join(databasesDir, dbFile);

            // Checking database

            const seriesDb = new sqlite3.Database(seriesDbPath);

            try {
                const videos = await new Promise((resolve, reject) => {
                    seriesDb.all(`
                        SELECT 
                            video_id,
                            "current_time" as watch_time,
                            size,
                            length,
                            last_opened
                        FROM video_metadata 
                        WHERE user_id = ? 
                        AND "current_time" IS NOT NULL 
                        AND "current_time" != ''
                        AND "current_time" > 0
                        ORDER BY last_opened DESC
                    `, [userId], (err, videos) => {
                        if (err) reject(err);
                        else resolve(videos || []);
                    });
                });

                // Found videos with watch progress

                if (videos.length > 0) {
                    // Determine if this is a series or movie based on database name
                    const isSeries = seriesName !== 'home'; // home.sqlite3 = movies, others = series

                    if (isSeries) {
                        // This is a series - create one card with overall progress
                        const VIDEOS_DIR = process.env.VIDEO_DIR;
                        const fs = require('fs');
                        const path = require('path');
                        const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.avi', '.webm'];
                        const { resolveActualFolderName } = require('../utils/folderUtils');

                        let totalVideosInFolder = 0;

                        try {
                            // Resolve the actual folder name (handles special characters)
                            const actualFolderName = resolveActualFolderName(seriesName);
                            // Resolving series folder

                            const folderPath = path.join(VIDEOS_DIR, actualFolderName);
                            // Checking series folder path

                            if (fs.existsSync(folderPath)) {
                                const files = fs.readdirSync(folderPath);
                                // Files in series folder
                                totalVideosInFolder = files.filter(file =>
                                    VIDEO_EXTENSIONS.includes(path.extname(file).toLowerCase())
                                ).length;
                                // Total videos in series calculated
                            } else {
                                // Series folder does not exist
                                totalVideosInFolder = videos.length; // Fallback
                            }
                        } catch (error) {
                            // Error reading series folder handled silently
                            totalVideosInFolder = videos.length; // Fallback
                        }

                        // Simple calculation: count watched episodes
                        const watchedVideos = videos.filter(video => {
                            return video.watch_time && video.watch_time !== '0' && video.watch_time !== '';
                        }).length;

                        // Simple progress: (watched episodes / total episodes) * 100
                        const overallProgress = totalVideosInFolder > 0 ?
                            Math.round((watchedVideos / totalVideosInFolder) * 100) : 0;

                        // Create a single series card
                        const seriesCard = {
                            video_id: seriesName, // Use series name as the ID
                            series: seriesName,
                            current_time: videos[0].watch_time, // Use the most recent
                            last_opened: videos[0].last_opened, // Use the most recent
                            completion_percentage: overallProgress,
                            total_episodes: totalVideosInFolder,
                            watched_episodes: watchedVideos,
                            is_series: true
                        };

                        // Series card created
                        continueWatching.push(seriesCard);
                    } else {
                        // This is a movie (from home.sqlite3) - show individual cards
                        // Process videos sequentially to handle async duration fetching
                        const processedVideos = [];

                        for (const video of videos) {
                            // Processing video for continue watching
                            video.series = 'home'; // Set series to 'home' for movies
                            video.is_series = false;
                            video.current_time = video.watch_time; // Map watch_time to current_time for API response

                            // Calculate actual completion percentage from watch_time and length
                            if (video.watch_time) {
                                try {
                                    // Convert current_time to seconds
                                    let currentSeconds = 0;

                                    // Parse watch_time (could be in HH:MM:SS format or seconds)
                                    if (typeof video.watch_time === 'string' && video.watch_time.includes(':')) {
                                        // HH:MM:SS format - convert to seconds
                                        const timeParts = video.watch_time.split(':');
                                        currentSeconds = (parseInt(timeParts[0]) * 3600) +
                                            (parseInt(timeParts[1]) * 60) +
                                            parseFloat(timeParts[2]);
                                        // Converting watch_time to seconds

                                        // Check if the converted time is reasonable
                                        if (video.length && currentSeconds > video.length * 1.1) {
                                            // Corrupted watch_time detected, resetting to 0
                                            currentSeconds = 0;
                                        }
                                    } else {
                                        // Already in seconds
                                        currentSeconds = parseFloat(video.watch_time) || 0;
                                    }

                                    let totalSeconds = 0;

                                    // Get length from database (should be set when video was first opened)
                                    if (video.length) {
                                        totalSeconds = parseInt(video.length) || 0;
                                    } else {
                                        // No length stored for video
                                        totalSeconds = 0;
                                    }

                                    // Calculate percentage
                                    if (totalSeconds > 0) {
                                        const rawPercentage = (currentSeconds / totalSeconds) * 100;
                                        // Cap at 100% to prevent impossible percentages
                                        video.completion_percentage = Math.min(Math.round(rawPercentage), 100);

                                        if (rawPercentage > 100) {
                                            // Impossible percentage detected, capped at 100%
                                        }
                                    } else {
                                        video.completion_percentage = 0;
                                    }

                                    // Movie progress calculated
                                } catch (error) {
                                    // Error calculating progress handled silently
                                    video.completion_percentage = 0;
                                }
                            } else {
                                video.completion_percentage = 0;
                            }

                            processedVideos.push(video);
                        }

                        // Movies added to continue watching
                        continueWatching = continueWatching.concat(processedVideos);
                    }
                }
            } catch (error) {
                // Error querying database handled silently
            } finally {
                seriesDb.close();
            }
        }

        // Total continue watching items processed
        // Sort by last_opened and limit to 20 items
        continueWatching.sort((a, b) => new Date(b.last_opened) - new Date(a.last_opened));
        return continueWatching.slice(0, 20);
    }
}

module.exports = new UserService();
