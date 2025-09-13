const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const { resolveActualFolderName } = require("../utils/folderUtils");
const { getAllAudioTracks, getOptimalAudioSettingsForTrack, getOptimalAudioSettings, isAudioBrowserCompatible, getAudioOutputOptions } = require("../utils/audioUtils");

const VIDEOS_DIR = process.env.VIDEO_DIR;
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".mkv", ".avi", ".webm"];

class VideoService {
  async getVideosList(req, series) {
    try{
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
    } catch (error) {
      console.error("Error reading video directory:", error);
      return [];
    }
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

  getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      console.log("Getting basic metadata for:", filePath);
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.error("Basic FFprobe error:", err.message);
          return reject(err);
        }
        console.log("Basic metadata retrieved successfully, streams:", metadata.streams?.length || 0);
        resolve(metadata);
      });
    });
  }

  getDetailedVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      console.log("Getting detailed metadata for:", filePath);
      
      // Check if file exists first
      if (!fs.existsSync(filePath)) {
        console.error("File does not exist:", filePath);
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
          console.error("FFprobe error:", err.message);
          return reject(err);
        }
        
        console.log("Detailed metadata retrieved successfully, streams:", metadata.streams?.length || 0);
        console.log("Metadata structure:", {
          hasStreams: !!metadata.streams,
          streamsLength: metadata.streams?.length || 0,
          hasFormat: !!metadata.format,
          formatDuration: metadata.format?.duration
        });
        
        // Check if metadata is empty
        if (!metadata.streams || metadata.streams.length === 0) {
          console.warn("FFprobe returned empty streams, trying basic probe");
          // Try basic probe as fallback
          ffmpeg.ffprobe(filePath, (basicErr, basicMetadata) => {
            if (basicErr) {
              console.error("Basic FFprobe also failed:", basicErr.message);
              return reject(basicErr);
            }
            console.log("Basic metadata fallback successful, streams:", basicMetadata.streams?.length || 0);
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
      console.log("getAudioTracks called for:", filePath);
      
      // Check file existence first
      if (!fs.existsSync(filePath)) {
        console.error("File does not exist:", filePath);
        return { error: "File does not exist" };
      }
      
      // Get file stats
      const stats = fs.statSync(filePath);
      console.log("File stats:", {
        size: stats.size,
        isFile: stats.isFile(),
        modified: stats.mtime
      });
      
      // Test if we can run FFprobe directly
      console.log("Testing FFprobe with simple command...");
      try {
        const testCommand = `ffprobe -v quiet -print_format json -show_streams "${filePath}"`;
        console.log("Running test command:", testCommand);
        
        exec(testCommand, (error, stdout, stderr) => {
          if (error) {
            console.error("FFprobe test failed:", error.message);
          } else {
            console.log("FFprobe test output length:", stdout.length);
            if (stdout.length > 0) {
              try {
                const testMetadata = JSON.parse(stdout);
                console.log("Test metadata streams:", testMetadata.streams?.length || 0);
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
        console.log("Using detailed metadata for audio tracks", metadata);
      } catch (err) {
        console.warn("Detailed metadata failed, using basic metadata:", err.message);
        try {
          metadata = await this.getVideoMetadata(filePath);
          console.log("Using basic metadata for audio tracks");
        } catch (basicErr) {
          console.error("Both detailed and basic metadata failed:", basicErr.message);
          return { error: "Could not extract metadata from video file" };
        }
      }
      
      const audioTracks = getAllAudioTracks(metadata);
      console.log("getAudioTracks returning:", audioTracks.length, "tracks");
      
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

  async streamVideo(req, res) {
    const videoId = req.params.id;
    const series = req.params.series === "home" ? "" : req.params.series || "";

    // Handle special characters in folder names by finding the actual folder
    const actualFolderName = resolveActualFolderName(series);

    const videoStartFrom = Number(req.query.start || 0);
    const audioTrackIndex = Number(req.query.audioTrack || 0); // Default to first track
    
    console.log("Video streaming request:", {
      videoId: videoId,
      start: videoStartFrom,
      audioTrack: audioTrackIndex,
      queryParams: req.query
    });
    
    console.log("Audio track parameter analysis:", {
      rawAudioTrack: req.query.audioTrack,
      parsedAudioTrack: audioTrackIndex,
      type: typeof audioTrackIndex,
      isNaN: isNaN(audioTrackIndex)
    });
    
    // Audio track selection enabled with improved language detection
    const useAudioTrackSelection = true; // Re-enabled for audio track selection
    const filePath = path.join(VIDEOS_DIR, actualFolderName, videoId);
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

    // Get video metadata to determine optimal audio settings for selected track
    let audioSettings;
    if (useAudioTrackSelection) {
      console.log("Audio track selection is ENABLED");
      try {
        let metadata;
        try {
          metadata = await this.getDetailedVideoMetadata(filePath);
          console.log("Video metadata streams:", metadata.streams?.length || 0);
        } catch (detailedErr) {
          console.warn("Detailed metadata failed, trying basic metadata:", detailedErr.message);
          metadata = await this.getVideoMetadata(filePath);
          console.log("Basic metadata streams:", metadata.streams?.length || 0);
        }
        
        const audioTracks = getAllAudioTracks(metadata);
        console.log("Audio tracks found:", audioTracks.length);
        console.log("Audio tracks summary:", audioTracks.map(track => ({
          index: track.index,
          streamIndex: track.streamIndex,
          language: track.language,
          codec: track.codec,
          isBrowserCompatible: track.isBrowserCompatible
        })));
        
        // Test: Verify the track at index 3 is Kannada
        console.log("Track verification test:", {
          trackAtIndex0: audioTracks[0] ? { language: audioTracks[0].language, streamIndex: audioTracks[0].streamIndex } : 'NOT_FOUND',
          trackAtIndex1: audioTracks[1] ? { language: audioTracks[1].language, streamIndex: audioTracks[1].streamIndex } : 'NOT_FOUND',
          trackAtIndex2: audioTracks[2] ? { language: audioTracks[2].language, streamIndex: audioTracks[2].streamIndex } : 'NOT_FOUND',
          trackAtIndex3: audioTracks[3] ? { language: audioTracks[3].language, streamIndex: audioTracks[3].streamIndex } : 'NOT_FOUND',
          requestedIndex: audioTrackIndex,
          expectedAtRequestedIndex: audioTracks[audioTrackIndex] ? { language: audioTracks[audioTrackIndex].language, streamIndex: audioTracks[audioTrackIndex].streamIndex } : 'NOT_FOUND'
        });
        
        if (audioTracks.length === 0) {
          throw new Error("No audio tracks found");
        }

        // Get the selected audio track (or default to first)
        console.log("Available audio tracks:", audioTracks.map(track => ({
          index: track.index,
          streamIndex: track.streamIndex,
          language: track.language,
          codec: track.codec,
          displayName: track.displayName
        })));
        
        // Also log the raw metadata streams for comparison
        console.log("Raw metadata streams:", metadata.streams.map((stream, idx) => ({
          index: idx,
          streamIndex: stream.index,
          codecType: stream.codec_type,
          codecName: stream.codec_name,
          language: stream.tags?.language || 'Unknown',
          title: stream.tags?.title || 'Unknown'
        })));
        
        // Test: Check if the metadata has the expected audio streams
        const audioStreams = metadata.streams.filter(stream => stream.codec_type === 'audio');
        console.log("Raw audio streams from metadata:", audioStreams.map((stream, idx) => ({
          arrayIndex: idx,
          streamIndex: stream.index,
          codecName: stream.codec_name,
          language: stream.tags?.language || 'Unknown',
          title: stream.tags?.title || 'Unknown'
        })));
        
        console.log("Requested audio track index:", audioTrackIndex);
        console.log("Total tracks available:", audioTracks.length);
        
        // Validate the requested index
        let selectedTrack;
        console.log("Track selection process:", {
          requestedIndex: audioTrackIndex,
          totalTracks: audioTracks.length,
          isValidIndex: audioTrackIndex >= 0 && audioTrackIndex < audioTracks.length
        });
        
        if (audioTrackIndex >= audioTracks.length) {
          console.warn(`Requested track index ${audioTrackIndex} is out of range (max: ${audioTracks.length - 1}), using first track`);
          selectedTrack = audioTracks[0];
        } else {
          selectedTrack = audioTracks[audioTrackIndex];
          console.log("Selected track from array:", {
            arrayIndex: audioTrackIndex,
            selectedTrack: selectedTrack,
            allTracksAtThisIndex: audioTracks.map((track, idx) => ({
              arrayIndex: idx,
              language: track.language,
              streamIndex: track.streamIndex,
              isSelected: idx === audioTrackIndex
            }))
          });
        }
        
        // Additional validation - check if the selected track makes sense
        console.log("Track selection validation:", {
          requestedIndex: audioTrackIndex,
          selectedTrackIndex: selectedTrack.index,
          selectedStreamIndex: selectedTrack.streamIndex,
          selectedLanguage: selectedTrack.language,
          totalTracks: audioTracks.length
        });
        
        // Test: Show what should happen vs what is happening
        console.log("Expected vs Actual:", {
          expected: {
            requestedIndex: audioTrackIndex,
            expectedLanguage: audioTracks[audioTrackIndex]?.language || 'Unknown',
            expectedStreamIndex: audioTracks[audioTrackIndex]?.streamIndex || 'Unknown'
          },
          actual: {
            selectedIndex: selectedTrack.index,
            selectedLanguage: selectedTrack.language,
            selectedStreamIndex: selectedTrack.streamIndex
          }
        });
        
        // Debug: Show what track should be selected vs what is selected
        console.log("Track selection debug:", {
          requestedIndex: audioTrackIndex,
          availableTracks: audioTracks.map(t => ({ index: t.index, language: t.language, streamIndex: t.streamIndex })),
          selectedTrack: { index: selectedTrack.index, language: selectedTrack.language, streamIndex: selectedTrack.streamIndex },
          shouldBeSelected: audioTracks[audioTrackIndex] ? { index: audioTracks[audioTrackIndex].index, language: audioTracks[audioTrackIndex].language, streamIndex: audioTracks[audioTrackIndex].streamIndex } : 'OUT_OF_RANGE'
        });
        console.log("Selected audio track:", {
          requestedIndex: audioTrackIndex,
          actualIndex: selectedTrack.index,
          streamIndex: selectedTrack.streamIndex,
          codec: selectedTrack.codec,
          language: selectedTrack.language,
          displayName: selectedTrack.displayName,
          isBrowserCompatible: selectedTrack.isBrowserCompatible
        });
        
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
          console.log("Using browser-compatible audio (copy):", {
            trackIndex: selectedTrack.index,
            streamIndex: selectedTrack.streamIndex,
            language: selectedTrack.language,
            codec: selectedTrack.codec
          });
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
          console.log("Using audio conversion:", {
            trackIndex: selectedTrack.index,
            streamIndex: selectedTrack.streamIndex,
            language: selectedTrack.language,
            codec: selectedTrack.codec,
            conversionSettings: conversionSettings,
            finalAudioSettings: audioSettings
          });
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

    // Debug logging (can be enabled for troubleshooting)
    console.log("Audio settings for video:", {
      useCopy: audioSettings.useCopy,
      trackIndex: audioSettings.trackIndex,
      codec: audioSettings.codec,
      bitrate: audioSettings.bitrate,
      audioTrackIndex: audioTrackIndex,
      useAudioTrackSelection: useAudioTrackSelection
    });

    console.log("Creating FFmpeg command for:", filePath);
    console.log("Video start time:", videoStartFrom);
    
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
      console.log("Using audio track mapping with track index:", audioSettings.trackIndex);
      console.log("Audio settings details:", {
        useCopy: audioSettings.useCopy,
        trackIndex: audioSettings.trackIndex,
        codec: audioSettings.codec,
        bitrate: audioSettings.bitrate,
        trackInfo: audioSettings.trackInfo
      });
      
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
