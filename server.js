// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const ffmpeg = require("fluent-ffmpeg");

const app = express();
const PORT = process.env.PORT || 5555;

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.avi', '.webm'];

const dbMiddleware = require("./middleware/dbMiddleware");

// Use JSON parser middleware
app.use(express.json());
// Enable CORS if needed
app.use(cors());
// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Folder where your video files are stored
const VIDEOS_DIR = "/home/kailash/samplevideos";

function getVideoDetails(file,req) {
    return new Promise((resolve, reject) => {
      req.db.get('SELECT * FROM video_metadata WHERE video_id = ?', [file], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
async function getVideosList(req,series) {
    const vidDir = path.join(VIDEOS_DIR, series);
    const files = fs.readdirSync(vidDir);
    const videoFiles = files.filter(file =>
      file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mkv')
    );
  
    const videos = await Promise.all(videoFiles.map(async (file) => {
      // console.log("📢[:62]: file: ", file);
      
      const videoDetails = await getVideoDetails(file,req);
      console.log("📢[:65]: videoDetails: ", videoDetails);
      const duration = await getVideoDuration(path.join(vidDir, file));
 
      const filePath = path.join(vidDir, file);
      const stats = fs.statSync(filePath);
      return {
        id: file,
        title: path.parse(file).name,
        url: "/video/" + file,
        file,
        active:videoDetails?.active,
        current_time:videoDetails?.current_time || 0,
        size: stats.size,
        duration,
        lastOpened: videoDetails?.last_opened
      };
    }));
  
    return videos;
  }
  
  function getVideoDuration(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) return reject(err);
        const duration = metadata.format.duration; // duration in seconds (float)
        resolve(duration);
      });
    });
  }
// Example route to stream a video (optional)
app.get('/video/:id',dbMiddleware, (req, res) => {
    const videoId = req.params.id;
    const videoPath = path.join(VIDEOS_DIR, videoId);
    console.log("📢[:89]: videoPath: ", videoPath);
    if (fs.existsSync(videoPath)) {
      res.sendFile(videoPath);
    } else {
      res.status(404).send('Video not found');
    }
});
app.get('/api/get-all-folders', (req, res) => {
  try {
    const folders = fs.readdirSync(VIDEOS_DIR).filter(folder => {
      return fs.statSync(path.join(VIDEOS_DIR, folder)).isDirectory();
    });

    const result = folders.map(folder => {
      const folderPath = path.join(VIDEOS_DIR, folder);
      const files = fs.readdirSync(folderPath);
      const videoCount = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return VIDEO_EXTENSIONS.includes(ext);
      }).length;

      return {
        name: folder,
        videoCount
      };
    });

    res.send(result);
  } catch (err) {
    console.error('Error getting folders:', err);
    res.status(500).send({ error: 'Unable to read folders' });
  }
});

app.get('/thumbnail/:type/:db/:id', async (req, res) => {
  // return res.status(404).send('Video not found');

  const videoId = req.params.id;
  const type = req.params.type;
  const db = req.params.db=="home"?"":req.params.db || "";
  let videoPath;
  if(type=="file")
  videoPath = path.join(VIDEOS_DIR+"/"+db, videoId);
  else{
  videoPath = getFirstFile(VIDEOS_DIR+"/"+db);// path.join(VIDEOS_DIR+"/"+db, videoId);
  }
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Video not found');
  }

  res.setHeader('Content-Type', 'image/jpeg');

  ffmpeg()
    .input(videoPath)
    .inputOptions(['-ss 00:00:59']) // ⚡ Seek before input (faster)
    .outputOptions([
      '-vframes 1',       // only one frame
      '-f image2',        // format
      '-s 260x190',        // ⚡ smaller resolution (adjustable)
      '-q:v 5'            // lower = better quality, 2–5 is typical
    ])
    .format('mjpeg')       // JPEG output
    .on('error', (err) => {
      console.error('FFmpeg error:', err.message);
      res.status(500).send('Failed to generate thumbnail');
    })
    .pipe(res, { end: true });
});

const getFirstFile = (dirPath) => {
  try {
    const files = fs.readdirSync(dirPath);
    const videoFile = files.filter(file =>
      file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mkv')
    )[0];
    return dirPath+"/"+videoFile || null;
  } catch (err) {
    console.error('Error reading directory:', err);
    return null;
  }
};

// --- API Endpoints ---
app.get('/api/videos/:series',dbMiddleware, async (req, res) => {
  const series = req.params.series=="home" ? "":req.params.series || "";
  const videos = await getVideosList(req,series);
  res.json(videos);
});

app.get("/api/video/:series/:id",dbMiddleware, async (req, res) => {
  try{
  const videoId = req.params.id;
  const series = req.params.series=="home" ? "":req.params.series || "";
  const videoStartFrom = Number(req.query.start || 0);
  const filePath = path.join(VIDEOS_DIR+"/"+series, videoId);
  if (!fs.existsSync(filePath)) {
      return res.status(404).send("Video not found");
  }
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  req.db.run(
      `INSERT INTO video_metadata (video_id, last_opened, size) VALUES (?, ?, ?) 
      ON CONFLICT(video_id) DO UPDATE SET last_opened = excluded.last_opened, size = excluded.size`,
      [videoId, new Date().toISOString(), fileSize]
  );
  // console.log("📢[:189]: query: ", query);

  // Reset all active flags
  req.db.run(`UPDATE video_metadata SET active = ?`, [0], function (err) {
      if (err) {
          console.error(err);
          return res.status(500).send("Database error");
      }
      req.db.run(`UPDATE video_metadata SET active = ? WHERE video_id = ?`, [1, videoId]);
  });

      ffmpeg.setFfmpegPath("/bin/ffmpeg"); 
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", `inline; filename="${videoId.replace('.mkv', '.mp4')}"`);

      const command =  ffmpeg(filePath)
      .setStartTime(videoStartFrom)
      .format("mp4")
      .videoCodec("libx264")
      .audioCodec("aac")
      // .size("640x360") // or "854x480"
      .outputOptions([
        "-preset veryslow",
        "-movflags +frag_keyframe+empty_moov"
      ])
      .on("start", (cmdLine) => {
        // console.log("FFmpeg started:", cmdLine);
      })
      .on("stderr", (stderr) => {
        // console.log("FFmpeg stderr:", stderr);
      })
      .on("error", (err) => {
        // console.error("FFmpeg error:", err);
        if (!res.headersSent) {
          res.status(500).end("FFmpeg conversion failed.");
        }
      })
      .on("end", () => {
        console.log("FFmpeg finished.");
      });
  
    let ffmpegProc;
  
    // Intercept process once it starts
    command.once("start", () => {
      ffmpegProc = command.ffmpegProc;
    });
  
    // Handle client disconnect
    req.on("close", () => {
      console.log("Client disconnected.");
      if (ffmpegProc) {
        console.log("Killing FFmpeg process...");
        ffmpegProc.kill("SIGKILL");
      }
    });
    // Start piping the video stream
    command.pipe(res, { end: true });
  } catch (e){
    console.error("📢[:175]: e: ", e);
  }
});


// Get video metadata (Last Opened, Size, Length)
app.get('/api/video-metadata/:id',dbMiddleware, (req, res) => {
  const { id } = req.params;
  req.db.get(`SELECT * FROM video_metadata WHERE video_id = ?`, [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(row || {});
  });
});

// 3. Save watch progress (POST body: { video_id, current_time })
app.post('/api/watch-progress',dbMiddleware, (req, res) => {
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
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    });
  });

  function getVideoMetadata(video_id,req) {
    return new Promise((resolve, reject) => {
      req.db.get(`SELECT * FROM video_metadata WHERE video_id = ?`, [video_id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  
  // 4. Get watch progress for a video
  app.get('/api/watch-progress/:video_id',dbMiddleware,async (req, res) => {
    const video_id = req.params.video_id;
  try {
    const row = await getVideoMetadata(video_id,req);
    // const duration = await getVideoDuration(path.join(VIDEOS_DIR, video_id));
    res.json({
      current_time: row?.current_time || 0,
      // duration
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
  });

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
