class MetadataService {
  getVideoMetadata(req) {
    const { id } = req.params;
    return new Promise((resolve, reject) => {
      req.db.get(`SELECT * FROM video_metadata WHERE video_id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  saveWatchProgress(req, res) {
    const { video_id, current_time, size } = req.body;
    const userId = req.cookies.user_id || 'guest';
    
    if (!video_id || current_time === undefined) {
      return res.status(400).json({ error: 'Missing video_id or current_time' });
    }
    
    // Use the full schema since all columns exist according to the table check
    const sql = `
      INSERT OR REPLACE INTO video_metadata 
      (user_id, video_id, current_time, size, last_opened, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), 0, 
        COALESCE((SELECT created_at FROM video_metadata WHERE user_id = ? AND video_id = ?), datetime('now')),
        datetime('now'))
    `;
    
    req.db.run(sql, [userId, video_id, current_time, size || 0, userId, video_id], function(err) {
      if (err) {
        console.error('Database error saving progress:', err);
        console.error('SQL attempted:', sql);
        console.error('Parameters:', [userId, video_id, current_time, size || 0, userId, video_id]);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log(`✅ Progress saved for user ${userId}, video ${video_id}, time ${current_time}`);
      res.json({ success: true });
    });
  }

  getWatchProgress(req) {
    const video_id = req.params.video_id;
    const userId = req.cookies.user_id || 'guest';
    console.log("getWatchProgress", video_id, userId);
    return new Promise((resolve, reject) => {
      // Use the full schema since all columns exist
      req.db.get(`
        SELECT * FROM video_metadata 
        WHERE user_id = ? AND video_id = ?
      `, [userId, video_id], (err, row) => {
        console.log("getWatchProgress", row);
        if (err) {
          console.error('Database error getting progress:', err);
          reject(err);
        } else {
          resolve({ 
            current_time: row?.current_time || 0,
            user_id: userId,
            last_opened: row?.last_opened || null
          });
        }
      });
    });
  }
}

module.exports = MetadataService;
