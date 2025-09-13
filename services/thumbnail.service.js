const fs = require('fs');
const path = require('path');
const ffmpeg = require("fluent-ffmpeg");
const crypto = require('crypto');
const { resolveActualFolderName } = require("../utils/folderUtils");

const VIDEOS_DIR = process.env.VIDEO_DIR;

class ThumbnailService {
  async getThumbnail(req, res) {
    const videoId = req.params.id;
    const type = req.params.type;
    const db = req.params.db === "home" ? "" : req.params.db || "";
    const quality = req.query.quality || 'standard'; // Get quality from query parameter
    
    console.log('🖼️ Thumbnail request:', { videoId, type, db, quality });
    
    // Handle special characters in folder names by finding the actual folder
    const actualFolderName = resolveActualFolderName(db);
    console.log('🖼️ Actual folder name:', actualFolderName);
    
    let videoPath;
    if (type === "file") {
      videoPath = path.join(VIDEOS_DIR, actualFolderName, videoId);
    } else if (type === "folder") {
      // For folders, get the first video file in the folder
      const folderPath = path.join(VIDEOS_DIR, actualFolderName);
      videoPath = this.getFirstFile(folderPath);
    } else {
      videoPath = this.getFirstFile(path.join(VIDEOS_DIR, actualFolderName));
    }
    
    console.log('🖼️ Video path:', videoPath);
    
    if (!videoPath || !fs.existsSync(videoPath)) {
      console.log('🖼️ Video not found:', videoPath);
      return res.status(404).send('Video not found');
    }

    // Create a hash-based filename to avoid "filename too long" errors
    const uniqueString = `${type}_${actualFolderName || 'home'}_${videoId}_${quality}`;
    const hash = crypto.createHash('md5').update(uniqueString).digest('hex');
    
    const thumbDir = path.join(process.env.THUMBNAIL_DIR, 'thumbnails', quality);
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }
    
    // Use hash-based filename with descriptive prefix
    const thumbFilename = `${type}_${hash}_${quality}.jpeg`;
    const thumbPath = path.join(thumbDir, thumbFilename);
    
    console.log('🖼️ Thumbnail path:', thumbPath);
    
    // Get quality settings
    const qualitySettings = this.getQualitySettings(quality);
    console.log('🖼️ Quality settings:', qualitySettings);

    // If thumbnail exists, send it
    if (fs.existsSync(thumbPath)) {
      console.log('🖼️ Serving existing thumbnail');
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      return fs.createReadStream(thumbPath).pipe(res);
    }

    // If not, create thumbnail and save, then send
    console.log('🖼️ Generating thumbnail with FFmpeg...');
    ffmpeg()
      .input(videoPath)
      .inputOptions([`-ss ${qualitySettings.seekTime}`])
      .outputOptions([
        '-vframes 1',
        '-f image2',
        `-s ${qualitySettings.size}`,
        `-q:v ${qualitySettings.quality}`,
        ...qualitySettings.extraOptions
      ])
      .format('mjpeg')
      .save(thumbPath)
      .on('end', () => {
        console.log('🖼️ Thumbnail generated successfully');
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        fs.createReadStream(thumbPath).pipe(res);
      })
      .on('error', (e) => {
        console.log("🖼️ Failed to generate thumbnail:", e);
        res.status(500).send('Failed to generate thumbnail');
      });
  }

  getQualitySettings(quality) {
    const settings = {
      'standard': {
        size: '320x240',
        quality: 5,
        seekTime: '00:01:00',
        extraOptions: []
      },
      'high': {
        size: '640x480',
        quality: 3,
        seekTime: '00:01:00',
        extraOptions: ['-preset fast']
      },
      'slideshow': {
        size: '1280x720',
        quality: 2,
        seekTime: '00:01:30',
        extraOptions: [
          '-preset slow',
          '-tune film',
          '-pix_fmt yuvj420p'
        ]
      },
      'ultra': {
        size: '1920x1080',
        quality: 1,
        seekTime: '00:02:00',
        extraOptions: [
          '-preset veryslow',
          '-tune film',
          '-pix_fmt yuvj420p',
          '-vf scale=1920:1080:flags=lanczos'
        ]
      }
    };

    return settings[quality] || settings['standard'];
  }

  getFirstFile(dirPath) {
    try {
      console.log('🖼️ Looking for first video file in:', dirPath);
      const files = fs.readdirSync(dirPath);
      console.log('🖼️ Files found:', files.slice(0, 5)); // Log first 5 files
      
      const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.avi', '.webm'];
      const videoFile = files.find(file => {
        const ext = path.extname(file).toLowerCase();
        return VIDEO_EXTENSIONS.includes(ext);
      });
      
      const result = videoFile ? path.join(dirPath, videoFile) : null;
      console.log('🖼️ Selected video file:', result);
      return result;
    } catch (error) {
      console.log('🖼️ Error reading directory:', error);
      return null;
    }
  }
}

module.exports = ThumbnailService;
