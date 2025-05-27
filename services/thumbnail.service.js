const fs = require('fs');
const path = require('path');
const ffmpeg = require("fluent-ffmpeg");

const VIDEOS_DIR = process.env.VIDEO_DIR;

class ThumbnailService {
  async getThumbnail(req, res) {
    const videoId = req.params.id;
    const type = req.params.type;
    const db = req.params.db === "home" ? "" : req.params.db || "";
    let videoPath;
    if (type === "file") {
      videoPath = path.join(VIDEOS_DIR, db, videoId);
    } else {
      videoPath = this.getFirstFile(path.join(VIDEOS_DIR, db));
    }
    if (!fs.existsSync(videoPath)) {
      return res.status(404).send('Video not found');
    }

    // Ensure the thumbnail directory exists
    const thumbDir = path.join(path.dirname(videoPath), 'thumbnail');
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }
    const thumbPath = path.join(thumbDir, `${videoId}.jpeg`);

    // If thumbnail exists, send it
    if (fs.existsSync(thumbPath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      return fs.createReadStream(thumbPath).pipe(res);
    }

    // If not, create thumbnail and save, then send
    ffmpeg()
      .input(videoPath)
      .inputOptions(['-ss 00:00:59'])
      .outputOptions([
        '-vframes 1',
        '-f image2',
        '-s 260x190',
        '-q:v 5'
      ])
      .format('mjpeg')
      .save(thumbPath)
      .on('end', () => {
        res.setHeader('Content-Type', 'image/jpeg');
        fs.createReadStream(thumbPath).pipe(res);
      })
      .on('error', (e) => {
        console.log("📢[:50]: ", 'Failed to generate thumbnail', e);
        res.status(500).send('Failed to generate thumbnail', e);
      });
  }

  getFirstFile(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);
      const videoFile = files.find(file =>
        file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mkv')
      );
      return videoFile ? path.join(dirPath, videoFile) : null;
    } catch {
      return null;
    }
  }
}

module.exports = ThumbnailService;
