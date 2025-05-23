const fs = require('fs');
const path = require('path');
const ffmpeg = require("fluent-ffmpeg");

const VIDEOS_DIR = "/var/lib/qbittorrent/Downloads";

class ThumbnailService {
  async getThumbnail(req, res) {
    const videoId = req.params.id;
    console.log("📢[:10]: videoId: ", videoId);
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
    res.setHeader('Content-Type', 'image/jpeg');
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
      .on('error', () => {
        res.status(500).send('Failed to generate thumbnail');
      })
      .pipe(res, { end: true });
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
