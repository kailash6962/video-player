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
    const { video_id, current_time } = req.body;
    if (!video_id || current_time === undefined) {
      return res.status(400).json({ error: 'Missing video_id or current_time' });
    }
    const sql = `
      INSERT INTO video_metadata (video_id, current_time)
      VALUES (?, ?)
      ON CONFLICT(video_id) DO UPDATE SET current_time = excluded.current_time;
    `;
    req.db.run(sql, [video_id, current_time], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    });
  }

  getWatchProgress(req) {
    const video_id = req.params.video_id;
    return new Promise((resolve, reject) => {
      req.db.get(`SELECT * FROM video_metadata WHERE video_id = ?`, [video_id], (err, row) => {
        if (err) reject(err);
        else resolve({ current_time: row?.current_time || 0 });
      });
    });
  }
}

module.exports = MetadataService;
