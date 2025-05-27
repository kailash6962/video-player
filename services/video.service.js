const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const VIDEOS_DIR = process.env.VIDEO_DIR;
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".mkv", ".avi", ".webm"];

class VideoService {
  async getVideosList(req, series) {
    const vidDir = path.join(VIDEOS_DIR, series);
    const files = fs.readdirSync(vidDir);
    const videoFiles = files.filter((file) =>
      VIDEO_EXTENSIONS.includes(path.extname(file).toLowerCase())
    );
    const videos = await Promise.all(
      videoFiles.map(async (file) => {
        const videoDetails = await this.getVideoDetails(file, req);
        const duration = await this.getVideoDuration(path.join(vidDir, file));
        const filePath = path.join(vidDir, file);
        const stats = fs.statSync(filePath);
        return {
          id: file,
          title: path.parse(file).name,
          url: "/video/" + file,
          file,
          active: videoDetails?.active,
          current_time: videoDetails?.current_time || 0,
          size: stats.size,
          duration,
          lastOpened: videoDetails?.last_opened,
        };
      })
    );
    // Sort videos by lastOpened (most recent first, undefined last)
    if(series=="home") {
        videos.sort((a, b) => {
        if (!a.lastOpened && !b.lastOpened) return 0;
        if (!a.lastOpened) return 1;
        if (!b.lastOpened) return -1;
        return (
            new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime()
        );
        });
    }
    return videos;
  }

  getVideoDetails(file, req) {
    return new Promise((resolve, reject) => {
      req.db.get(
        "SELECT * FROM video_metadata WHERE video_id = ?",
        [file],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  getVideoDuration(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) return reject(err);
        resolve(metadata.format.duration);
      });
    });
  }

  async streamVideo(req, res) {
    const videoId = req.params.id;
    const series = req.params.series === "home" ? "" : req.params.series || "";

    const videoStartFrom = Number(req.query.start || 0);
    const filePath = path.join(VIDEOS_DIR, series, videoId);
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
    req.db.run(`UPDATE video_metadata SET active = ?`, [0], function (err) {
      if (!err) {
        req.db.run(`UPDATE video_metadata SET active = ? WHERE video_id = ?`, [
          1,
          videoId,
        ]);
      }
    });

    ffmpeg.setFfmpegPath("/bin/ffmpeg");
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${videoId.replace(".mkv", ".mp4")}"`
    );

    const command = ffmpeg(filePath)
      .setStartTime(videoStartFrom)
      .format("mp4")
    //   .videoCodec("libx264")
    //   .audioCodec("aac")
      .outputOptions(["-preset ultrafast", "-movflags +frag_keyframe+empty_moov"])
      .on("error", (err) => {
        if (!res.headersSent) res.status(500).end("FFmpeg conversion failed.");
      })
      .on("end", () => {
        // finished
      });

    let ffmpegProc;
    command.once("start", () => {
      ffmpegProc = command.ffmpegProc;
    });
    req.on("close", () => {
      if (ffmpegProc) ffmpegProc.kill("SIGKILL");
    });
    command.pipe(res, { end: true });
  }
}

module.exports = VideoService;
