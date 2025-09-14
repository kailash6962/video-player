const sqlite3 = require('sqlite3').verbose();

class SettingsService {
    constructor() {
        this.initDatabase().catch(err => {
            console.log('Warning: Settings database initialization failed:', err.message);
        });
    }

    async initDatabase() {
        const db = new sqlite3.Database('./databases/home.db');
        
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                // Create settings table if it doesn't exist
                db.run(`
                    CREATE TABLE IF NOT EXISTS system_settings (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        console.log('Settings table creation error:', err.message);
                        reject(err);
                        return;
                    }
                });
                
                // Insert default settings if they don't exist
                db.run(`
                    INSERT OR IGNORE INTO system_settings (key, value)
                    VALUES ('allowRegistration', 'true')
                `, (err) => {
                    if (err) {
                        console.log('Default settings creation error:', err.message);
                    }
                });
                
                // Create index for better performance
                db.run('CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(key)', () => {});
                
                console.log('Settings database initialized successfully');
                db.close();
                resolve();
            });
        });
    }

    async getSetting(key) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            
            db.get(`
                SELECT value FROM system_settings 
                WHERE key = ?
            `, [key], (err, row) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.value : null);
                }
            });
        });
    }

    async setSetting(key, value) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            
            db.run(`
                INSERT OR REPLACE INTO system_settings (key, value, updated_at)
                VALUES (?, ?, datetime('now'))
            `, [key, value], function(err) {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    async getAllSettings() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./databases/home.db');
            
            db.all(`
                SELECT key, value FROM system_settings
            `, (err, rows) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    const settings = {};
                    rows.forEach(row => {
                        settings[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
                    });
                    resolve(settings);
                }
            });
        });
    }

    async isRegistrationAllowed() {
        try {
            const value = await this.getSetting('allowRegistration');
            return value === 'true' || value === true;
        } catch (error) {
            console.error('Error checking registration setting:', error);
            return true; // Default to allowed if error
        }
    }

    async setRegistrationAllowed(allowed) {
        try {
            await this.setSetting('allowRegistration', allowed.toString());
            return true;
        } catch (error) {
            console.error('Error setting registration permission:', error);
            return false;
        }
    }
}

module.exports = new SettingsService();
