const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const VIDEOS_DIR = "/var/lib/qbittorrent/Downloads";
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.avi', '.webm'];

class FolderService {
  async getAllFolders() {
    const folders = fs.readdirSync(VIDEOS_DIR).filter(folder =>
      fs.statSync(path.join(VIDEOS_DIR, folder)).isDirectory()
    );
    const results = await Promise.all(
      folders.map(async (folder) => {
        const safeName = folder.replace(/[^a-zA-Z0-9_-]/g, '');
        const dbPath = path.join(__dirname, '..', 'databases', `${safeName}.sqlite3`);
        let lastOpened = null;
        let lastOpenedNumber = null;
        if (fs.existsSync(dbPath)) {
          // Get the latest last_opened value and the count of rows with last_opened
          const result = await new Promise((resolve) => {
            const db = new sqlite3.Database(dbPath);
            db.get(
              `SELECT 
                  (SELECT last_opened FROM video_metadata WHERE last_opened IS NOT NULL ORDER BY datetime(last_opened) DESC LIMIT 1) as last_opened,
                  (SELECT COUNT(*) FROM video_metadata WHERE last_opened IS NOT NULL) as lastOpenedNumber
              `,
              [],
              (err, row) => {
                db.close();
                if (err) return resolve({});
                resolve(row || {});
              }
            );
          });
          lastOpened = result.last_opened || null;
          lastOpenedNumber = result.lastOpenedNumber || null;
        }
        const folderPath = path.join(VIDEOS_DIR, folder);
        const files = fs.readdirSync(folderPath);
        const videoCount = files.filter(file =>
          VIDEO_EXTENSIONS.includes(path.extname(file).toLowerCase())
        ).length;
        return {
          name: folder,
          videoCount,
          lastOpened,
          lastOpenedNumber
        };
      })
    );
    return results;
  }
}

module.exports = FolderService;
