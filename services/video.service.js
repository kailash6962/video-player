const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const { resolveActualFolderName } = require("../utils/folderUtils");
const { getAllAudioTracks, getOptimalAudioSettingsForTrack, getOptimalAudioSettings, isAudioBrowserCompatible, getAudioOutputOptions } = require("../utils/audioUtils");
const { getAllSubtitleTracks, getOptimalSubtitleSettings, getSubtitleOutputOptions } = require("../utils/subtitleUtils");

const VIDEOS_DIR = process.env.VIDEO_DIR;
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".mkv", ".avi", ".webm"];

class VideoService {
  async getVideosList(req, series) {
    try {
      // Handle special characters in folder names by finding the actual folder
      const actualFolderName = resolveActualFolderName(series);

      const vidDir = path.join(VIDEOS_DIR, actualFolderName);
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
            modifiedDate: stats.mtime, // File modification date
            createdDate: stats.birthtime, // File creation date (if available)
          };
        })
      );
      // Sort videos by lastOpened (most recent first, undefined last)
      if (series == "home") {
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
    } catch (error) {
      console.error("Error reading video directory:", error);
      return [];
    }
  }

  getVideoDetails(file, req) {
    return new Promise((resolve, reject) => {
      const userId = req.cookies?.user_id || 'guest';

      // Use the full schema since all columns exist
      req.db.get(
        "SELECT * FROM video_metadata WHERE user_id = ? AND video_id = ?",
        [userId, file],
        (err, row) => {
          if (err) {
            console.error('Database error getting video details:', err);
            reject(err);
          } else {
            resolve(row);
          }
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

  getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.error("Basic FFprobe error:", err.message);
          return reject(err);
        }
        resolve(metadata);
      });
    });
  }

  getDetailedVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      // Getting detailed metadata
      // File exists check
      // File stats check

      // Check if file exists first
      if (!fs.existsSync(filePath)) {
        // File does not exist
        return reject(new Error("File does not exist"));
      }

      // Use more detailed FFprobe options to get better metadata
      ffmpeg.ffprobe(filePath, [
        '-v', 'error',  // Changed from 'quiet' to 'error' to see errors
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        '-show_chapters'
      ], (err, metadata) => {
        if (err) {
          console.error("🎬 FFprobe error:", err.message);
          console.error("🎬 Full FFprobe error:", err);
          return reject(err);
        }


        // Log first few streams for debugging
        if (metadata.streams && metadata.streams.length > 0) {
          metadata.streams.slice(0, 5).forEach((stream, index) => {
          });
        }

        // Check if metadata is empty
        if (!metadata.streams || metadata.streams.length === 0) {
          console.warn("🎬 FFprobe returned empty streams, trying basic probe");
          // Try basic probe as fallback
          ffmpeg.ffprobe(filePath, (basicErr, basicMetadata) => {
            if (basicErr) {
              console.error("🎬 Basic FFprobe also failed:", basicErr.message);
              console.error("🎬 Full basic FFprobe error:", basicErr);
              return reject(basicErr);
            }
            resolve(basicMetadata);
          });
        } else {
          resolve(metadata);
        }
      });
    });
  }

  async getAudioQualityInfo(filePath) {
    try {
      const metadata = await this.getVideoMetadata(filePath);
      const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

      if (!audioStream) {
        return { error: "No audio stream found" };
      }

      const audioSettings = getOptimalAudioSettings(metadata);
      const isCompatible = isAudioBrowserCompatible(audioStream);

      return {
        source: {
          codec: audioStream.codec_name,
          bitrate: parseInt(audioStream.bit_rate) || 0,
          sampleRate: parseInt(audioStream.sample_rate) || 0,
          channels: parseInt(audioStream.channels) || 0
        },
        target: audioSettings,
        isBrowserCompatible: isCompatible,
        willBeConverted: !isCompatible
      };
    } catch (err) {
      return { error: err.message };
    }
  }

  async getAudioTracks(filePath) {
    try {

      // Check file existence first
      if (!fs.existsSync(filePath)) {
        console.error("File does not exist:", filePath);
        return { error: "File does not exist" };
      }

      // Get file stats
      const stats = fs.statSync(filePath);

      // Test if we can run FFprobe directly
      try {
        const testCommand = `ffprobe -v quiet -print_format json -show_streams "${filePath}"`;

        exec(testCommand, (error, stdout, stderr) => {
          if (error) {
            console.error("FFprobe test failed:", error.message);
          } else {
            if (stdout.length > 0) {
              try {
                const testMetadata = JSON.parse(stdout);
              } catch (parseErr) {
                console.error("Failed to parse test metadata:", parseErr.message);
              }
            }
          }
        });
      } catch (testErr) {
        console.error("FFprobe test error:", testErr.message);
      }

      // Try detailed metadata first, fallback to basic if it fails
      let metadata;
      try {
        metadata = await this.getDetailedVideoMetadata(filePath);
      } catch (err) {
        console.warn("Detailed metadata failed, using basic metadata:", err.message);
        try {
          metadata = await this.getVideoMetadata(filePath);
        } catch (basicErr) {
          console.error("Both detailed and basic metadata failed:", basicErr.message);
          return { error: "Could not extract metadata from video file" };
        }
      }

      const audioTracks = getAllAudioTracks(metadata);

      if (!audioTracks.length) {
        console.log("No audio tracks found, returning error");
        return { error: "No audio tracks found" };
      }

      return {
        tracks: audioTracks,
        defaultTrack: audioTracks[0] // First track as default
      };
    } catch (err) {
      console.error("Error getting audio tracks:", err);
      return { error: err.message };
    }
  }

  async getSubtitleTracks(filePath) {
    try {

      // Check file existence first
      if (!fs.existsSync(filePath)) {
        console.error("File does not exist:", filePath);
        return { error: "File does not exist" };
      }

      // Get detailed metadata for subtitle detection
      const metadata = await this.getDetailedVideoMetadata(filePath);

      // Extract subtitle tracks
      const subtitleTracks = getAllSubtitleTracks(metadata);

      if (subtitleTracks.length === 0) {
        return { error: "No subtitle tracks found" };
      }

      return {
        tracks: subtitleTracks,
        defaultTrack: subtitleTracks.find(t => t.isDefault) || subtitleTracks[0] // Default or first track
      };
    } catch (err) {
      console.error("Error getting subtitle tracks:", err);
      return { error: err.message };
    }
  }

  async streamSubtitle(req, res) {
    const videoId = req.params.id;
    const series = req.params.series === "home" ? "" : req.params.series || "";
    const subtitleTrackIndex = parseInt(req.params.trackIndex) || 0;
    const timeOffset = parseInt(req.query.offset) || 0;

    // Handle special characters in folder names by finding the actual folder
    const actualFolderName = resolveActualFolderName(series);
    const filePath = path.join(VIDEOS_DIR, actualFolderName, videoId);

    // Additional debugging for file path resolution
    if (!fs.existsSync(filePath)) {
      console.error("🎬 ❌ File not found, debugging path resolution:");
      console.error("🎬 📁 Attempted file path:", filePath);
      console.error("🎬 📂 Base directory exists:", fs.existsSync(path.dirname(filePath)));

      // Try to find similar files
      try {
        const dir = path.dirname(filePath);
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          const similarFiles = files.filter(f => f.includes('Coolie')).slice(0, 3);
          console.error("🎬 📋 Similar files found:", similarFiles);
        }
      } catch (err) {
        console.error("🎬 ❌ Error reading directory:", err.message);
      }
    }

    // Enhanced file resolution with fallback for encoding issues
    let resolvedFilePath = filePath;
    if (!fs.existsSync(filePath)) {
      // Try different decoding approaches
      const alternativeVideoIds = [
        decodeURIComponent(videoId),
        videoId.replace(/\s+/g, ' '), // normalize spaces
        videoId.replace(/\u00A0/g, ' '), // replace non-breaking spaces
        req.params.id // use raw param
      ];

      for (const altVideoId of alternativeVideoIds) {
        const altPath = path.join(VIDEOS_DIR, actualFolderName, altVideoId);
        if (fs.existsSync(altPath)) {
          resolvedFilePath = altPath;
          break;
        }
      }

      // If still not found, try finding by partial match
      if (!fs.existsSync(resolvedFilePath)) {
        try {
          const dir = path.join(VIDEOS_DIR, actualFolderName);
          if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const coolieFiiles = files.filter(f =>
              f.toLowerCase().includes('coolie') &&
              f.toLowerCase().includes('2025') &&
              (f.endsWith('.mkv') || f.endsWith('.mp4'))
            );

            if (coolieFiiles.length > 0) {
              resolvedFilePath = path.join(dir, coolieFiiles[0]);
            }
          }
        } catch (err) {
          console.error("🎬 ❌ Error during file search:", err.message);
        }
      }
    }

    if (!fs.existsSync(resolvedFilePath)) {
      console.error("🎬 Video file not found after all attempts:", resolvedFilePath);
      return res.status(404).send("Video not found");
    }

    try {
      // Get subtitle tracks
      const metadata = await this.getDetailedVideoMetadata(resolvedFilePath);

      const subtitleTracks = getAllSubtitleTracks(metadata);

      if (subtitleTrackIndex >= subtitleTracks.length) {
        console.error(`🎬 Requested subtitle track ${subtitleTrackIndex} is out of range (max: ${subtitleTracks.length - 1})`);
        return res.status(404).send("Subtitle track not found");
      }

      const selectedTrack = subtitleTracks[subtitleTrackIndex];
      const subtitleSettings = getOptimalSubtitleSettings(selectedTrack);

      // Set appropriate headers for subtitle content
      res.setHeader("Content-Type", "text/vtt; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Access-Control-Allow-Origin", "*");

      ffmpeg.setFfmpegPath("/bin/ffmpeg");

      // For large SRT files, try direct conversion first (faster than FFmpeg)
      const subtitleSize = selectedTrack.tags?.NUMBER_OF_BYTES ?
        parseInt(selectedTrack.tags.NUMBER_OF_BYTES) : 0;
      if (selectedTrack.codec === 'subrip' && subtitleSize > 30000) {
        try {
          const directResult = await this.tryDirectSrtConversion(resolvedFilePath, selectedTrack, res);
          if (directResult) {
            return;
          }
        } catch (err) {
          // Emergency fallback - generate basic WebVTT header for immediate loading
          try {
            const emergencyResult = await this.tryEmergencySubtitleFallback(resolvedFilePath, selectedTrack, res);
            if (emergencyResult) {
              return;
            }
          } catch (fallbackErr) {
            console.log("🎬 ⚠️ Emergency fallback also failed:", fallbackErr.message);
          }
        }
      }

      // Use direct child_process for better control and timeout handling

      const { spawn } = require('child_process');
      // Dynamic timeout based on subtitle file size (already calculated above)
      const baseTimeout = 30000; // 30 seconds base
      const sizeMultiplier = Math.min(Math.max(subtitleSize / 50000, 1), 3); // 1x to 3x based on size
      const SUBTITLE_TIMEOUT = baseTimeout * sizeMultiplier;
      let isCompleted = false;

      // FFmpeg arguments for subtitle extraction with optimizations for large files
      const ffmpegArgs = [
        '-hide_banner',           // Reduce verbose output
        '-loglevel', 'error',     // Only show errors to reduce processing overhead
        '-threads', '1',          // Single thread for subtitle processing
        '-i', resolvedFilePath,
        '-map', `0:s:${selectedTrack.index}`,
        '-c:s', 'webvtt',
        '-f', 'webvtt',
        '-avoid_negative_ts', 'make_zero', // Handle timing issues
        '-copyts',                // Copy timestamps to preserve timing
        'pipe:1'
      ];

      // Spawn FFmpeg process
      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (!isCompleted) {
          // console.error("🎬 ⏰ Subtitle extraction timeout after", SUBTITLE_TIMEOUT/1000, "seconds");
          ffmpegProcess.kill('SIGKILL');
          isCompleted = true;
          if (!res.headersSent) {
            res.status(504).send('Subtitle extraction timeout');
          }
        }
      }, SUBTITLE_TIMEOUT);

      // Handle FFmpeg stdout (subtitle data)
      let bytesStreamed = 0;
      ffmpegProcess.stdout.on('data', (chunk) => {
        if (!res.headersSent) {
          res.write(chunk);
          bytesStreamed += chunk.length;

          // Log progress for large files
          if (subtitleSize > 20000 && bytesStreamed % 10000 === 0) {
            const progress = Math.min((bytesStreamed / subtitleSize) * 100, 100);
          }
        }
      });

      // Handle FFmpeg stderr (logs/errors)
      ffmpegProcess.stderr.on('data', (chunk) => {
      });

      // Handle process completion
      ffmpegProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        if (!isCompleted) {
          isCompleted = true;
          if (code === 0) {
            res.end();
          } else {
            console.error("🎬 FFmpeg process failed with code:", code);
            if (!res.headersSent) {
              res.status(500).send('Subtitle extraction failed');
            } else {
              res.end();
            }
          }
        }
      });

      // Handle process errors
      ffmpegProcess.on('error', (err) => {
        console.error("🎬 FFmpeg process error:", err.message);
        clearTimeout(timeoutId);
        if (!isCompleted) {
          isCompleted = true;
          if (!res.headersSent) {
            res.status(500).send('Error starting subtitle extraction');
          }
        }
      });

      // Handle client disconnect
      req.on('close', () => {
        console.log("🎬 Client disconnected, killing subtitle extraction");
        clearTimeout(timeoutId);
        if (!isCompleted) {
          isCompleted = true;
          ffmpegProcess.kill('SIGKILL');
        }
      });

    } catch (err) {
      console.error("🎬 Error streaming subtitle:", err.message);
      console.error("🎬 Full error details:", err);
      if (!res.headersSent) {
        res.status(500).send("Subtitle streaming failed");
      }
    }
  }

  async streamSubtitleChunk(req, res) {
    const videoId = req.params.id;
    const series = req.params.series === "home" ? "" : req.params.series || "";
    const subtitleTrackIndex = parseInt(req.params.trackIndex) || 0;
    const startTime = parseInt(req.params.startTime) || 0; // in seconds
    const duration = parseInt(req.params.duration) || 600; // default 10 minutes

    console.log("🎬 📦 Chunked subtitle request:", {
      videoId: videoId,
      series: series,
      subtitleTrack: subtitleTrackIndex,
      startTime: startTime,
      duration: duration,
      startTimeFormatted: this.formatSeconds(startTime),
      endTimeFormatted: this.formatSeconds(startTime + duration)
    });

    // Handle special characters in folder names by finding the actual folder
    const actualFolderName = resolveActualFolderName(series);
    const filePath = path.join(VIDEOS_DIR, actualFolderName, videoId);

    // Enhanced file resolution with fallback for encoding issues
    let resolvedFilePath = filePath;
    if (!fs.existsSync(filePath)) {
      console.log("🎬 🔍 File not found, trying alternative paths...");

      const alternativeVideoIds = [
        decodeURIComponent(videoId),
        videoId.replace(/\s+/g, ' '),
        videoId.replace(/\u00A0/g, ' '),
        req.params.id
      ];

      for (const altVideoId of alternativeVideoIds) {
        const altPath = path.join(VIDEOS_DIR, actualFolderName, altVideoId);
        if (fs.existsSync(altPath)) {
          resolvedFilePath = altPath;
          break;
        }
      }

      if (!fs.existsSync(resolvedFilePath)) {
        try {
          const dir = path.join(VIDEOS_DIR, actualFolderName);
          if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const matchingFiles = files.filter(f =>
              f.toLowerCase().includes(videoId.split('.')[0].toLowerCase().substring(0, 20)) &&
              (f.endsWith('.mkv') || f.endsWith('.mp4'))
            );

            if (matchingFiles.length > 0) {
              resolvedFilePath = path.join(dir, matchingFiles[0]);
            }
          }
        } catch (err) {
          console.error("🎬 ❌ Error during file search:", err.message);
        }
      }
    }

    if (!fs.existsSync(resolvedFilePath)) {
      console.error("🎬 Video file not found after all attempts:", resolvedFilePath);
      return res.status(404).send("Video not found");
    }

    try {
      // Get subtitle tracks
      const metadata = await this.getDetailedVideoMetadata(resolvedFilePath);
      const subtitleTracks = getAllSubtitleTracks(metadata);

      if (subtitleTrackIndex >= subtitleTracks.length) {
        return res.status(404).send("Subtitle track not found");
      }

      const selectedTrack = subtitleTracks[subtitleTrackIndex];

      // Set headers
      res.setHeader("Content-Type", "text/vtt; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Access-Control-Allow-Origin", "*");

      // Extract subtitle chunk using FFmpeg with time filtering
      await this.extractSubtitleChunk(resolvedFilePath, selectedTrack, startTime, duration, res);

    } catch (err) {
      console.error("🎬 Error streaming subtitle chunk:", err.message);
      if (!res.headersSent) {
        res.status(500).send("Subtitle chunk streaming failed");
      }
    }
  }

  async extractSubtitleChunk(filePath, selectedTrack, startTime, duration, res) {
    const { spawn } = require('child_process');


    // For SRT files, try direct extraction with copying first (much faster)
    if (selectedTrack.codec === 'subrip') {
      console.log("🎬 📦 Trying fast SRT chunk extraction...");
      try {
        const success = await this.extractSrtChunkDirect(filePath, selectedTrack, startTime, duration, res);
        if (success) {
          return;
        }
      } catch (err) {
        console.log("🎬 📦 Fast SRT extraction failed, trying WebVTT conversion:", err.message);
      }
    }

    // Fallback to WebVTT conversion with aggressive optimizations
    const startTimeFormatted = this.formatSeconds(startTime);
    const durationFormatted = this.formatSeconds(duration);

    // More aggressive FFmpeg options for problematic files
    const ffmpegArgs = [
      '-hide_banner',
      '-loglevel', 'panic',             // Suppress all output except panics
      '-threads', '1',                  // Single thread
      '-ss', startTimeFormatted,        // Seek to start time
      '-t', durationFormatted,          // Duration to extract
      '-i', filePath,
      '-map', `0:s:${selectedTrack.index}`,
      '-c:s', 'webvtt',
      '-f', 'webvtt',
      '-avoid_negative_ts', 'disabled', // Disable negative timestamp handling
      '-fflags', '+genpts',             // Generate presentation timestamps
      'pipe:1'
    ];

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
    let isCompleted = false;
    let hasOutput = false;

    // Shorter timeout for chunks - if no output in 15 seconds, something is wrong
    const timeout = setTimeout(() => {
      if (!isCompleted) {
        console.error("🎬 ⏰ Subtitle chunk extraction timeout after 15 seconds");
        ffmpegProcess.kill('SIGKILL');
        if (!res.headersSent) {
          res.status(504).send('Subtitle chunk timeout - try a smaller chunk size');
        }
      }
    }, 15000);

    // Handle output
    ffmpegProcess.stdout.on('data', (chunk) => {
      hasOutput = true;
      if (!res.headersSent) {
        res.write(chunk);
      }
    });

    ffmpegProcess.stderr.on('data', (chunk) => {
      const errorText = chunk.toString().trim();
      if (errorText) {
        console.log("🎬 📦 FFmpeg chunk stderr:", errorText);
      }
    });

    ffmpegProcess.on('close', (code) => {
      clearTimeout(timeout);
      isCompleted = true;
      if (code === 0 && hasOutput) {
        console.log("🎬 ✅ Subtitle chunk extraction completed");
        res.end();
      } else {
        console.error("🎬 ❌ Subtitle chunk extraction failed - code:", code, "hasOutput:", hasOutput);
        if (!res.headersSent) {
          res.status(500).send('Subtitle chunk extraction failed');
        }
      }
    });

    ffmpegProcess.on('error', (err) => {
      clearTimeout(timeout);
      isCompleted = true;
      console.error("🎬 ❌ FFmpeg chunk process error:", err.message);
      if (!res.headersSent) {
        res.status(500).send('Error extracting subtitle chunk');
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      clearTimeout(timeout);
      if (!isCompleted) {
        console.log("🎬 Client disconnected, killing chunk extraction");
        ffmpegProcess.kill('SIGKILL');
      }
    });
  }

  async extractSrtChunkDirect(filePath, selectedTrack, startTime, duration, res) {
    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
      // Extract raw SRT data for the time range
      const startTimeFormatted = this.formatSeconds(startTime);
      const durationFormatted = this.formatSeconds(duration);

      const ffmpegArgs = [
        '-hide_banner',
        '-loglevel', 'panic',
        '-ss', startTimeFormatted,
        '-t', durationFormatted,
        '-i', filePath,
        '-map', `0:s:${selectedTrack.index}`,
        '-c:s', 'copy',                   // Just copy, don't convert
        '-f', 'srt',                      // Raw SRT output
        'pipe:1'
      ];

      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
      let srtContent = '';
      let isCompleted = false;

      // 10 second timeout for raw SRT extraction
      const timeout = setTimeout(() => {
        if (!isCompleted) {
          console.log("🎬 📦 Fast SRT extraction timeout");
          ffmpegProcess.kill('SIGKILL');
          reject(new Error('SRT extraction timeout'));
        }
      }, 10000);

      ffmpegProcess.stdout.on('data', (chunk) => {
        srtContent += chunk.toString();
      });

      ffmpegProcess.on('close', (code) => {
        clearTimeout(timeout);
        isCompleted = true;

        if (code === 0 && srtContent.trim()) {
          console.log("🎬 📦 Fast SRT extraction successful, converting to WebVTT...");
          try {
            // Convert SRT to WebVTT
            const webvttContent = this.convertSrtToWebVtt(srtContent);
            res.write(webvttContent);
            res.end();
            resolve(true);
          } catch (convErr) {
            console.error("🎬 📦 SRT to WebVTT conversion failed:", convErr.message);
            reject(convErr);
          }
        } else {
          reject(new Error(`SRT extraction failed with code ${code}`));
        }
      });

      ffmpegProcess.on('error', (err) => {
        clearTimeout(timeout);
        isCompleted = true;
        reject(err);
      });
    });
  }

  formatSeconds(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async tryDirectSrtConversion(filePath, selectedTrack, res) {
    const { spawn } = require('child_process');
    const fs = require('fs');

    try {
      console.log("🎬 🔄 Starting direct SRT extraction...");

      // Extract SRT subtitle using ffmpeg without conversion
      const extractArgs = [
        '-hide_banner',
        '-loglevel', 'error',
        '-i', filePath,
        '-map', `0:s:${selectedTrack.index}`,
        '-c:s', 'copy', // Copy without conversion
        '-f', 'srt',
        'pipe:1'
      ];

      const extractProcess = spawn('ffmpeg', extractArgs);
      let srtContent = '';

      // Collect SRT data
      extractProcess.stdout.on('data', (chunk) => {
        srtContent += chunk.toString();
      });

      extractProcess.stderr.on('data', (chunk) => {
        console.log("🎬 SRT extraction stderr:", chunk.toString().trim());
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          extractProcess.kill('SIGKILL');
          reject(new Error('SRT extraction timeout'));
        }, 20000); // 20 second timeout for extraction

        extractProcess.on('close', (code) => {
          clearTimeout(timeout);
          if (code === 0 && srtContent) {
            try {
              // Convert SRT to WebVTT
              const webvttContent = this.convertSrtToWebVtt(srtContent);

              res.write(webvttContent);
              res.end();
              resolve(true);
            } catch (convErr) {
              console.error("🎬 ❌ SRT to WebVTT conversion failed:", convErr.message);
              reject(convErr);
            }
          } else {
            reject(new Error(`SRT extraction failed with code ${code}`));
          }
        });

        extractProcess.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

    } catch (err) {
      console.error("🎬 ❌ Direct SRT conversion error:", err.message);
      throw err;
    }
  }

  async tryEmergencySubtitleFallback(filePath, selectedTrack, res) {
    console.log("🎬 🆘 Attempting emergency subtitle fallback...");

    try {
      // Send a basic WebVTT with a message that subtitles are loading
      const emergencyWebVTT = `WEBVTT

00:00:00.000 --> 00:00:05.000
Subtitles are loading...

00:00:05.000 --> 00:00:10.000
Please wait while we process the subtitle file.

00:01:00.000 --> 00:01:05.000
If subtitles don't appear, try refreshing the page.
`;

      res.write(emergencyWebVTT);
      res.end();

      // Start background processing for this file (could be implemented later)
      console.log("🎬 🆘 Emergency fallback sent, subtitle processing would continue in background");

      return true;
    } catch (err) {
      console.error("🎬 🆘 Emergency fallback failed:", err.message);
      return false;
    }
  }

  convertSrtToWebVtt(srtContent) {
    console.log("🎬 🔄 Converting SRT to WebVTT format...");

    let webvtt = 'WEBVTT\n\n';

    // Split SRT content into blocks
    const blocks = srtContent.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length >= 3) {
        // Skip sequence number (first line)
        const timingLine = lines[1];
        const textLines = lines.slice(2);

        // Convert SRT timing format to WebVTT
        // SRT: 00:01:30,500 --> 00:01:33,000
        // WebVTT: 00:01:30.500 --> 00:01:33.000
        const webvttTiming = timingLine.replace(/,/g, '.');

        webvtt += webvttTiming + '\n';
        webvtt += textLines.join('\n') + '\n\n';
      }
    }

    console.log("🎬 ✅ SRT to WebVTT conversion completed");
    return webvtt;
  }

  adjustSubtitleTiming(webvttContent, offsetSeconds) {
    // WebVTT timing format: HH:MM:SS.mmm --> HH:MM:SS.mmm
    const timingRegex = /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/g;

    const adjustedContent = webvttContent.replace(timingRegex, (match, startTime, endTime) => {
      const adjustedStartTime = this.adjustTimeString(startTime, offsetSeconds);
      const adjustedEndTime = this.adjustTimeString(endTime, offsetSeconds);

      return `${adjustedStartTime} --> ${adjustedEndTime}`;
    });
    return adjustedContent;
  }

  adjustTimeString(timeString, offsetSeconds) {
    // Parse HH:MM:SS.mmm format
    const parts = timeString.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secondsAndMs = parts[2].split('.');
    const seconds = parseInt(secondsAndMs[0]);
    const milliseconds = parseInt(secondsAndMs[1]);

    // Convert to total milliseconds
    let totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;

    // Apply offset
    totalMs += offsetSeconds * 1000;

    // Ensure non-negative time
    if (totalMs < 0) totalMs = 0;

    // Convert back to HH:MM:SS.mmm
    const newMs = totalMs % 1000;
    const newSeconds = Math.floor(totalMs / 1000) % 60;
    const newMinutes = Math.floor(totalMs / 60000) % 60;
    const newHours = Math.floor(totalMs / 3600000);

    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}.${String(newMs).padStart(3, '0')}`;
  }

  async streamVideo(req, res) {
    const videoId = req.params.id;
    const series = req.params.series === "home" ? "" : req.params.series || "";

    // Handle special characters in folder names by finding the actual folder
    const actualFolderName = resolveActualFolderName(series);

    const videoStartFrom = Number(req.query.start || 0);
    const audioTrackIndex = Number(req.query.audioTrack || 0); // Default to first track
    const subtitleTrackIndex = req.query.subtitleTrack !== undefined ? Number(req.query.subtitleTrack) : -1; // -1 means no subtitles

    // Audio track selection enabled with improved language detection
    const useAudioTrackSelection = true; // Re-enabled for audio track selection
    const filePath = path.join(VIDEOS_DIR, actualFolderName, videoId);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Video not found");
    }
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const userId = req.cookies?.user_id || 'guest';

    const duration = await this.getVideoDuration(filePath);
    const durationSeconds = Math.floor(duration); // Store as integer seconds

    console.log("🎬 Duration seconds:", durationSeconds);


    req.db.run(
      `INSERT INTO video_metadata (user_id, video_id, last_opened, size, length) VALUES (?, ?, ?, ?, ?) 
         ON CONFLICT(user_id, video_id) DO UPDATE SET last_opened = excluded.last_opened, size = excluded.size, length = excluded.length`,
      [userId, videoId, new Date().toISOString(), fileSize, durationSeconds]
    );

    // Clear all active flags for this user, then set current video as active
    req.db.run(`UPDATE video_metadata SET active = 0 WHERE user_id = ?`, [userId], function (err) {
      if (!err) {
        req.db.run(`UPDATE video_metadata SET active = 1 WHERE user_id = ? AND video_id = ?`, [
          userId,
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

    // Get video metadata to determine optimal audio settings for selected track
    let audioSettings;
    if (useAudioTrackSelection) {
      try {
        let metadata;
        try {
          metadata = await this.getDetailedVideoMetadata(filePath);
        } catch (detailedErr) {
          console.warn("Detailed metadata failed, trying basic metadata:", detailedErr.message);
          metadata = await this.getVideoMetadata(filePath);
        }

        const audioTracks = getAllAudioTracks(metadata);

        if (audioTracks.length === 0) {
          throw new Error("No audio tracks found");
        }


        const audioStreams = metadata.streams.filter(stream => stream.codec_type === 'audio');

        // Validate the requested index
        let selectedTrack;
        if (audioTrackIndex >= audioTracks.length) {
          console.warn(`Requested track index ${audioTrackIndex} is out of range (max: ${audioTracks.length - 1}), using first track`);
          selectedTrack = audioTracks[0];
        } else {
          selectedTrack = audioTracks[audioTrackIndex];
        }


        // Validate track index
        if (selectedTrack.streamIndex < 0 || selectedTrack.streamIndex >= metadata.streams.length) {
          console.warn("Invalid track index, using fallback");
          throw new Error("Invalid audio track index");
        }

        // Check if selected audio track is already browser-compatible
        if (selectedTrack.isBrowserCompatible) {
          // Use copy for already compatible audio
          audioSettings = {
            useCopy: true,
            trackIndex: selectedTrack.index,  // Use array index, not stream index
            trackInfo: selectedTrack
          };
        } else {
          // Get optimal settings for conversion
          const conversionSettings = getOptimalAudioSettingsForTrack(selectedTrack);
          audioSettings = {
            useCopy: false,
            codec: conversionSettings.codec,
            bitrate: conversionSettings.bitrate,
            sampleRate: conversionSettings.sampleRate,
            channels: conversionSettings.channels,
            trackIndex: selectedTrack.index,  // Use array index, not stream index
            trackInfo: selectedTrack
          };
        }
      } catch (err) {
        console.warn("Could not get video metadata, using default audio settings:", err.message);
        audioSettings = {
          useCopy: false,
          codec: "aac",
          bitrate: "192k",
          sampleRate: 48000,
          channels: 2,
          trackIndex: undefined // No specific track index
        };
      }
    } else {
      console.log("Audio track selection is DISABLED - using simple fallback");
      // Use simple fallback without metadata extraction
      audioSettings = {
        useCopy: false,
        codec: "aac",
        bitrate: "192k",
        sampleRate: 48000,
        channels: 2
      };
    }

    const command = ffmpeg(filePath)
      .setStartTime(videoStartFrom)
      .format("mp4")
      .videoCodec("copy") // copy video stream without re-encoding
      .on("error", (err) => {
        console.error("FFmpeg error:", err.message);
        if (!res.headersSent) res.status(500).end("FFmpeg conversion failed: " + err.message);
      })
      .on("end", () => {
        console.log("FFmpeg conversion completed");
      });

    // Apply audio settings for selected track
    if (useAudioTrackSelection && audioSettings.trackIndex !== undefined && audioSettings.trackIndex >= 0) {

      // Use specific audio track mapping
      if (audioSettings.useCopy) {
        // Copy specific audio track without re-encoding
        command.audioCodec("copy");
        // Map video stream and selected audio stream
        command.outputOptions([`-map 0:v:0`, `-map 0:a:${audioSettings.trackIndex}`]);
        console.log("FFmpeg command: copy audio track", audioSettings.trackIndex, "with mapping -map 0:v:0 -map 0:a:" + audioSettings.trackIndex);
      } else {
        // Convert specific audio track
        command.audioCodec(audioSettings.codec);
        // Map video stream and selected audio stream
        command.outputOptions([`-map 0:v:0`, `-map 0:a:${audioSettings.trackIndex}`]);
        const audioOptions = getAudioOutputOptions(audioSettings);
        command.outputOptions(audioOptions);
        console.log("FFmpeg command: convert audio track", audioSettings.trackIndex, "to", audioSettings.codec, "with mapping -map 0:v:0 -map 0:a:" + audioSettings.trackIndex);
      }
    } else {
      console.log("Using fallback audio handling (no track mapping)");
      // Fallback: use default audio handling (no mapping, let FFmpeg choose first audio track)
      if (audioSettings.useCopy) {
        console.log("FFmpeg command: copy audio (no re-encoding)");
        command.audioCodec("copy");
      } else {
        console.log("FFmpeg command: convert audio to", audioSettings.codec, "at", audioSettings.bitrate);
        command.audioCodec(audioSettings.codec);
        const audioOptions = getAudioOutputOptions(audioSettings);
        command.outputOptions(audioOptions);
      }
    }

    // Handle subtitle track selection
    let subtitleSettings = null;
    if (subtitleTrackIndex >= 0) {
      console.log("Subtitle track selection requested:", subtitleTrackIndex);
      try {
        // Get metadata for subtitle analysis (reuse existing metadata if available)
        const metadata = await this.getDetailedVideoMetadata(filePath);
        const subtitleTracks = getAllSubtitleTracks(metadata);

        console.log("Available subtitle tracks:", subtitleTracks.length);

        if (subtitleTracks.length > 0 && subtitleTrackIndex < subtitleTracks.length) {
          const selectedSubtitleTrack = subtitleTracks[subtitleTrackIndex];
          subtitleSettings = getOptimalSubtitleSettings(selectedSubtitleTrack);

          console.log("Selected subtitle track:", {
            index: selectedSubtitleTrack.index,
            language: selectedSubtitleTrack.language,
            codec: selectedSubtitleTrack.codec,
            compatible: selectedSubtitleTrack.isBrowserCompatible,
            settings: subtitleSettings
          });

          // Note: Skip subtitle mapping for MP4 streaming
          // MP4 containers with piped output don't handle embedded subtitles well
          // Subtitles will be served separately as WebVTT tracks for the HTML5 video player
          console.log("Subtitle track", subtitleSettings.trackIndex, "detected but skipped for streaming (will be served separately)");
          console.log("Subtitle info:", {
            language: selectedSubtitleTrack.language,
            codec: selectedSubtitleTrack.codec,
            streamIndex: selectedSubtitleTrack.streamIndex
          });
        } else {
          console.warn(`Requested subtitle track ${subtitleTrackIndex} is out of range (max: ${subtitleTracks.length - 1})`);
        }
      } catch (err) {
        console.warn("Could not process subtitle track:", err.message);
      }
    } else {
      console.log("No subtitle track requested (index: -1)");
    }

    // Add standard output options
    command.outputOptions(["-movflags +frag_keyframe+empty_moov"]);

    let ffmpegProc;
    command.once("start", (commandLine) => {
      console.log("FFmpeg started with command:", commandLine);
      console.log("FFmpeg command analysis:", {
        hasVideoMap: commandLine.includes('-map 0:v:0'),
        hasAudioMap: commandLine.includes('-map 0:a:'),
        audioMapIndex: commandLine.match(/-map 0:a:(\d+)/)?.[1],
        requestedTrackIndex: audioTrackIndex,
        selectedStreamIndex: audioSettings.trackIndex
      });
      ffmpegProc = command.ffmpegProc;
    });
    req.on("close", () => {
      console.log("Client disconnected, killing FFmpeg process");
      if (ffmpegProc) ffmpegProc.kill("SIGKILL");
    });
    console.log("Starting FFmpeg stream...");
    command.pipe(res, { end: true });
  }
}

module.exports = VideoService;
