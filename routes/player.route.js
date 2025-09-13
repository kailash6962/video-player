const express = require('express');
const router = express.Router();
const PlayerController = require('../controllers/player.controller');

const controller = new PlayerController();
const dbMiddleware = require("../middleware/dbMiddleware");


router.get('/videos/:series',dbMiddleware, controller.getVideosList.bind(controller));
router.get('/video/:series/:id',dbMiddleware , controller.streamVideo.bind(controller));
router.get('/get-all-folders',dbMiddleware, controller.getAllFolders.bind(controller));
router.get('/thumbnail/:type/:db/:id', controller.getThumbnail.bind(controller));
router.get('/video-metadata/:id',dbMiddleware, controller.getVideoMetadata.bind(controller));
router.get('/audio-quality/:series/:id', controller.getAudioQualityInfo.bind(controller));
router.get('/audio-tracks/:series/:id', controller.getAudioTracks.bind(controller));
router.get('/subtitle-tracks/:series/:id', controller.getSubtitleTracks.bind(controller));
router.get('/subtitle/:series/:id/:trackIndex', controller.streamSubtitle.bind(controller));
router.get('/subtitle-chunk/:series/:id/:trackIndex/:startTime/:duration', controller.streamSubtitleChunk.bind(controller));
router.post('/watch-progress',dbMiddleware, controller.saveWatchProgress.bind(controller));
router.get('/watch-progress/:video_id',dbMiddleware, controller.getWatchProgress.bind(controller));

module.exports = router;
