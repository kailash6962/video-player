// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const ffmpeg = require("fluent-ffmpeg");


const app = express();
const PORT = process.env.PORT || 5555;

// Use JSON parser middleware
app.use(express.json());
// Enable CORS if needed
app.use(cors());
// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Folder where your video files are stored
const VIDEOS_DIR = "/var/lib/qbittorrent/Downloads/AdolescenceS01";

// --- Database Setup ---
const db = new sqlite3.Database('./db.sqlite3', (err) => {
  if (err) {
    console.error('Could not open database', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create a table to store video metadata
db.run(`
  CREATE TABLE IF NOT EXISTS video_metadata (
    video_id TEXT PRIMARY KEY,
    current_time REAL,
    last_opened TEXT,
    size INTEGER,
    length TEXT,
    active BOOLEAN
  )
`);

function getVideoDetails(file) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM video_metadata WHERE video_id = ?', [file], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
async function getVideosList() {
    const files = fs.readdirSync(VIDEOS_DIR);
    const videoFiles = files.filter(file =>
      file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mkv')
    );
  
    const videos = await Promise.all(videoFiles.map(async (file) => {
      // console.log("📢[:62]: file: ", file);
      
      const videoDetails = await getVideoDetails(file);
      console.log("📢[:65]: videoDetails: ", videoDetails);
      const duration = await getVideoDuration(path.join(VIDEOS_DIR, file));

  
      const filePath = path.join(VIDEOS_DIR, file);
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
        lastOpened: new Date(stats.mtime).toISOString()
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
app.get('/video/:id', (req, res) => {
    const videoId = req.params.id;
    const videoPath = path.join(VIDEOS_DIR, videoId);
    console.log("📢[:89]: videoPath: ", videoPath);
    if (fs.existsSync(videoPath)) {
      res.sendFile(videoPath);
    } else {
      res.status(404).send('Video not found');
    }
});
app.get('/thumbnail/:id', (req, res) => {
    res.setHeader('Content-Type', 'image/jpeg');

    const videoId = req.params.id;
    const videoPath = path.join(VIDEOS_DIR, videoId);

    ffmpeg(videoPath)
    .on('error', (err) => {
      console.error('FFmpeg error:', err.message);
      res.status(500).send('Failed to generate thumbnail');
    })
    .on('end', () => {
      console.log('Thumbnail stream complete');
    })
    .screenshots({
      count: 1,
      timemarks: ['59'], // capture frame at 5 seconds
      filename: 'thumbnail.jpg', // not used when streaming
      size: '320x?' // width = 320px, auto height
    })
    .format('image2') // ensure image output
    .outputOptions('-vframes 1') // only 1 frame
    .output(res); // stream directly to client

   
    // if (fs.existsSync(videoPath)) {
    //   res.sendFile(videoPath);
    // } else {
    //   res.status(404).send('Video not found');
    // }
});


// --- API Endpoints ---
app.get('/api/videos', async (req, res) => {
  const videos = await getVideosList();
  res.json(videos);
});

app.get("/api/video/:id", (req, res) => {
  try{
  const videoId = req.params.id;
  const videoStartFrom = Number(req.query.start || 0);
  console.log("📢[:105]: req.query.start: ", req.query.start);

  const filePath = path.join(VIDEOS_DIR, videoId);

  if (!fs.existsSync(filePath)) {
      return res.status(404).send("Video not found");
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const isMKV = path.extname(filePath).toLowerCase() === ".mkv";

  // Update last opened timestamp in DB
  db.run(
      `INSERT INTO video_metadata (video_id, last_opened, size) VALUES (?, ?, ?) 
      ON CONFLICT(video_id) DO UPDATE SET last_opened = excluded.last_opened, size = excluded.size`,
      [videoId, new Date().toISOString(), fileSize]
  );

  // Reset all active flags
  db.run(`UPDATE video_metadata SET active = ?`, [0], function (err) {
      if (err) {
          console.error(err);
          return res.status(500).send("Database error");
      }

      // Set the specific video as active
      db.run(`UPDATE video_metadata SET active = ? WHERE video_id = ?`, [1, videoId]);
  });

  // if (isMKV) {
      ffmpeg.setFfmpegPath("/bin/ffmpeg"); 
      // Convert MKV to MP4 on the fly and stream it
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", `inline; filename="${videoId.replace('.mkv', '.mp4')}"`);

      ffmpeg(filePath)
      .setStartTime(videoStartFrom)
      .format("mp4")
      .videoCodec("libx264")
      .audioCodec("aac")
      .size('854x480') // ✅ Set resolution to 480p
      .outputOptions("-movflags frag_keyframe+empty_moov")
      .on("start", (cmd) => console.log("FFmpeg command:", cmd))
      .on("stderr", (stderr) => console.log("FFmpeg stderr:", stderr))
      .on("error", (err) => console.error("FFmpeg error:", err))
      .pipe(res, { end: true });

  // } else {
  //     // MP4 file streaming with range support
  //     if (range) {
  //         const parts = range.replace(/bytes=/, "").split("-");
  //         const start = parseInt(parts[0], 10);
  //         const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  //         const chunkSize = end - start + 1;
  //         const file = fs.createReadStream(filePath, { start, end });

  //         res.writeHead(206, {
  //             "Content-Range": `bytes ${start}-${end}/${fileSize}`,
  //             "Accept-Ranges": "bytes",
  //             "Content-Length": chunkSize,
  //             "Content-Type": "video/mp4",
  //         });

  //         file.pipe(res);
  //     } else {
  //         res.writeHead(200, {
  //             "Content-Length": fileSize,
  //             "Content-Type": "video/mp4",
  //         });

  //         fs.createReadStream(filePath).pipe(res);
  //     }
  // }
  } catch (e){
    console.error("📢[:175]: e: ", e);
  }
});


// Get video metadata (Last Opened, Size, Length)
app.get('/api/video-metadata/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM video_metadata WHERE video_id = ?`, [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(row || {});
  });
});

// 3. Save watch progress (POST body: { video_id, current_time })
app.post('/api/watch-progress', (req, res) => {
    const { video_id, current_time } = req.body;
    if (!video_id || current_time === undefined) {
      return res.status(400).json({ error: 'Missing video_id or current_time' });
    }
    const sql = `
      INSERT INTO video_metadata (video_id, current_time)
      VALUES (?, ?)
      ON CONFLICT(video_id) DO UPDATE SET current_time = excluded.current_time;
    `;
    db.run(sql, [video_id, current_time], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    });
  });

  function getVideoMetadata(video_id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM video_metadata WHERE video_id = ?`, [video_id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  
  // 4. Get watch progress for a video
  app.get('/api/watch-progress/:video_id',async (req, res) => {
    const video_id = req.params.video_id;
  try {
    const row = await getVideoMetadata(video_id);
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
