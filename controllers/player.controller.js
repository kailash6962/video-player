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
      const folders = await this.folderService.getAllFolders();
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
      res.status(500).send('Failed to generate thumbnail');
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
}

module.exports = PlayerController;
