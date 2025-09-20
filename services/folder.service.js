const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const VIDEOS_DIR = process.env.VIDEO_DIR;
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.avi', '.webm'];

class FolderService {
  async getAllFolders(req = null) {
    const folders = fs.readdirSync(VIDEOS_DIR).filter(folder =>
      fs.statSync(path.join(VIDEOS_DIR, folder)).isDirectory() &&
      folder !== process.env.THUMBNAIL_DIR.split('/').pop() &&
      fs.readdirSync(path.join(VIDEOS_DIR, folder)).length > 0
    );
    const results = await Promise.all(
      folders.map(async (folder) => {
        const safeName = folder.replace(/[^a-zA-Z0-9_-]/g, '');
        const dbPath = path.join(__dirname, '..', 'databases', `${safeName}.sqlite3`);
        let lastOpened = null;
        let lastOpenedNumber = null;
        let watchedEpisodes = 0;
        if (fs.existsSync(dbPath)) {
          // Get user-specific progress information
          const userId = req?.cookies?.user_id || 'guest';
          const result = await new Promise((resolve) => {
            const db = new sqlite3.Database(dbPath);

            // Check if the database has user_id column
            db.all("PRAGMA table_info(video_metadata)", (err, columns) => {
              if (err) {
                db.close();
                return resolve({});
              }

              const hasUserId = columns && columns.some(col => col.name === 'user_id');

              let query, params;
              if (hasUserId) {
                // Use user-specific query with progress calculation
                query = `SELECT 
                    (SELECT last_opened FROM video_metadata WHERE user_id = ? AND last_opened IS NOT NULL ORDER BY datetime(last_opened) DESC LIMIT 1) as last_opened,
                    (SELECT COUNT(*) FROM video_metadata WHERE user_id = ? AND last_opened IS NOT NULL) as lastOpenedNumber,
                    (SELECT COUNT(*) FROM video_metadata WHERE user_id = ? AND current_time IS NOT NULL AND current_time != '' AND current_time > 0) as watchedEpisodes
                `;
                params = [userId, userId, userId];
              } else {
                // Fallback to original query for old databases
                query = `SELECT 
                    (SELECT last_opened FROM video_metadata WHERE last_opened IS NOT NULL ORDER BY datetime(last_opened) DESC LIMIT 1) as last_opened,
                    (SELECT COUNT(*) FROM video_metadata WHERE last_opened IS NOT NULL) as lastOpenedNumber,
                    (SELECT COUNT(*) FROM video_metadata WHERE current_time IS NOT NULL AND current_time != '' AND current_time > 0) as watchedEpisodes
                `;
                params = [];
              }

              db.get(query, params, (err, row) => {
                db.close();
                if (err) return resolve({});
                resolve(row || {});
              });
            });
          });
          lastOpened = result.last_opened || null;
          lastOpenedNumber = result.lastOpenedNumber || null;
          watchedEpisodes = result.watchedEpisodes || 0;
        }
        const folderPath = path.join(VIDEOS_DIR, folder);
        const files = fs.readdirSync(folderPath);
        const videoFiles = files.filter(file =>
          VIDEO_EXTENSIONS.includes(path.extname(file).toLowerCase())
        );

        // Get the most recent file modification date in this folder
        let mostRecentFileDate = null;
        if (videoFiles.length > 0) {
          const fileDates = videoFiles.map(file => {
            const filePath = path.join(folderPath, file);
            const stats = fs.statSync(filePath);
            return stats.mtime;
          });
          mostRecentFileDate = new Date(Math.max(...fileDates.map(date => date.getTime())));
        }

        // Get folder modification date
        const folderStats = fs.statSync(folderPath);

        // Calculate overall progress percentage
        const overallProgress = videoFiles.length > 0 ? 
          Math.round((watchedEpisodes / videoFiles.length) * 100) : 0;

        return {
          name: folder,
          videoCount: videoFiles.length,
          lastOpened,
          lastOpenedNumber,
          watchedEpisodes,
          overallProgress,
          modifiedDate: folderStats.mtime, // Folder modification date
          mostRecentFileDate, // Most recent file in the folder
          createdDate: folderStats.birthtime // Folder creation date
        };
      })
    );
    return results;
  }
}

module.exports = FolderService;
