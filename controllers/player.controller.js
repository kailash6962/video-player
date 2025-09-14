const VideoService = require('../services/video.service');
const FolderService = require('../services/folder.service');
const ThumbnailService = require('../services/thumbnail.service.js');
const MetadataService = require('../services/metadata.service');

class PlayerController {
  constructor() {
    this.videoService = new VideoService();
    this.folderService = new FolderService();
    this.thumbnailService = new ThumbnailService();
    this.metadataService = new MetadataService();
  }

  async getVideosList(req, res) {
    try {
      const series = req.params.series === "home" ? "" : req.params.series || "";
      const videos = await this.videoService.getVideosList(req, series);
      res.json(videos);
    } catch (err) {
      res.status(500).json({ error: 'Unable to get videos' });
    }
  }

  async streamVideo(req, res) {
    try {
      await this.videoService.streamVideo(req, res);
    } catch (err) {
      res.status(500).send("Video streaming failed");
    }
  }

  async getAllFolders(req, res) {
    try {
      const folders = await this.folderService.getAllFolders(req);
      res.json(folders);
    } catch (err) {
      console.log("📢[:37]: err: ", err);
      res.status(500).json({ error: 'Unable to read folders' });
    }
  }

  async getThumbnail(req, res) {
    try {
      await this.thumbnailService.getThumbnail(req, res);
    } catch (err) {
      console.log("📢[:46]: err: ", err);
      res.status(500).send('Failed to generate thumbnail',err);
    }
  }

  async getVideoMetadata(req, res) {
    try {
      const row = await this.metadataService.getVideoMetadata(req);
      res.json(row || {});
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  }

  async saveWatchProgress(req, res) {
    try {
      await this.metadataService.saveWatchProgress(req, res);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  }

  async getWatchProgress(req, res) {
    try {
      const progress = await this.metadataService.getWatchProgress(req);
      res.json(progress);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getAudioQualityInfo(req, res) {
    try {
      const videoId = req.params.id;
      const series = req.params.series === "home" ? "" : req.params.series || "";
      
      // Handle special characters in folder names
      const { resolveActualFolderName } = require("../utils/folderUtils");
      const actualFolderName = resolveActualFolderName(series);
      
      const filePath = require('path').join(process.env.VIDEO_DIR, actualFolderName, videoId);
      
      if (!require('fs').existsSync(filePath)) {
        return res.status(404).json({ error: 'Video not found' });
      }

      const audioInfo = await this.videoService.getAudioQualityInfo(filePath);
      res.json(audioInfo);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getAudioTracks(req, res) {
    try {
      const videoId = req.params.id;
      const series = req.params.series === "home" ? "" : req.params.series || "";
      
      // Handle special characters in folder names
      const { resolveActualFolderName } = require("../utils/folderUtils");
      const actualFolderName = resolveActualFolderName(series);
      
      const filePath = require('path').join(process.env.VIDEO_DIR, actualFolderName, videoId);
      if (!require('fs').existsSync(filePath)) {
        return res.status(404).json({ error: 'Video not found' });
      }

      console.log("getAudioTracks API called:", { series, id: videoId, filePath });
      const audioTracks = await this.videoService.getAudioTracks(filePath);
      console.log("getAudioTracks API response:", audioTracks);
      res.json(audioTracks);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getSubtitleTracks(req, res) {
    try {
      const videoId = req.params.id;
      const series = req.params.series === "home" ? "" : req.params.series || "";
      
      // Handle special characters in folder names
      const { resolveActualFolderName } = require("../utils/folderUtils");
      const actualFolderName = resolveActualFolderName(series);
      
      const filePath = require('path').join(process.env.VIDEO_DIR, actualFolderName, videoId);
      if (!require('fs').existsSync(filePath)) {
        return res.status(404).json({ error: 'Video not found' });
      }

      console.log("getSubtitleTracks API called:", { series, id: videoId, filePath });
      const subtitleTracks = await this.videoService.getSubtitleTracks(filePath);
      console.log("getSubtitleTracks API response:", subtitleTracks);
      res.json(subtitleTracks);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  async streamSubtitle(req, res) {
    try {
      await this.videoService.streamSubtitle(req, res);
    } catch (err) {
      console.error("Error in subtitle streaming controller:", err);
      if (!res.headersSent) {
        res.status(500).send("Subtitle streaming failed");
      }
    }
  }

  async streamSubtitleChunk(req, res) {
    try {
      await this.videoService.streamSubtitleChunk(req, res);
    } catch (err) {
      console.error("Error in chunked subtitle streaming controller:", err);
      if (!res.headersSent) {
        res.status(500).send("Chunked subtitle streaming failed");
      }
    }
  }
}

module.exports = PlayerController;
