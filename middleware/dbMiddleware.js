const path = require('path');
const sqlite3 = require('sqlite3').verbose();

function dbMiddleware(req, res, next) {
  const dbName = req.headers['x-db-name'] || req.params.series || "home";
  console.log("📢[:6]: req.params.series: ", req.params.series);

  if (!dbName || typeof dbName !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid x-db-name header' });
  }

  const safeName = dbName.replace(/[^a-zA-Z0-9_-]/g, ''); // sanitize
  const dbPath = path.join(__dirname, '..', 'databases', `${safeName}.sqlite3`);

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Could not open database', err);
      return res.status(500).json({ error: 'Database connection failed' });
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS video_metadata (
        video_id TEXT PRIMARY KEY UNIQUE,
        current_time REAL,
        last_opened TEXT,
        size INTEGER,
        length TEXT,
        active BOOLEAN
      )
    `, (createErr) => {
      if (createErr) {
        console.error('DB schema creation failed', createErr);
        return res.status(500).json({ error: 'DB schema error' });
      }
      req.db = db;
      req.dbPath = dbPath;
      next();
    });
  });
}
module.exports = dbMiddleware;