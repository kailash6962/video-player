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
router.post('/watch-progress',dbMiddleware, controller.saveWatchProgress.bind(controller));
router.get('/watch-progress/:video_id',dbMiddleware, controller.getWatchProgress.bind(controller));

module.exports = router;
