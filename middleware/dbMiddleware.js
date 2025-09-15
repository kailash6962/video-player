const path = require('path');
const sqlite3 = require('sqlite3').verbose();

function dbMiddleware(req, res, next) {
  // Database middleware called
  const dbName = req.headers['x-db-name'] || req.params.series || "home";

  if (!dbName || typeof dbName !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid x-db-name header' });
  }

  const safeName = dbName.replace(/[^a-zA-Z0-9_-]/g, ''); // sanitize
  const dbPath = path.join(__dirname, '..', 'databases', `${safeName}.sqlite3`);

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      // Could not open database, handled silently
      return res.status(500).json({ error: 'Database connection failed' });
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS video_metadata (
        video_id TEXT NOT NULL,
        user_id TEXT DEFAULT 'guest',
        current_time REAL DEFAULT 0,
        last_opened TEXT,
        size INTEGER,
        length REAL, -- Video duration in seconds (real)
        active INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, video_id)
      )
    `, (createErr) => {
      if (createErr) {
        // DB schema creation failed, handled silently
        return res.status(500).json({ error: 'DB schema error' });
      }
      
      // Create indexes for better performance
      db.run('CREATE INDEX IF NOT EXISTS idx_video_metadata_user_id ON video_metadata(user_id)', () => {});
      db.run('CREATE INDEX IF NOT EXISTS idx_video_metadata_last_opened ON video_metadata(user_id, last_opened DESC)', () => {});
      db.run('CREATE INDEX IF NOT EXISTS idx_video_metadata_active ON video_metadata(user_id, active)', () => {});
      
      req.db = db;
      req.dbPath = dbPath;
      next();
    });
  });

  res.on('finish', () => {
    req.db.close((err) => {
      // Failed to close DB, handled silently
    });
  });
}
module.exports = dbMiddleware;