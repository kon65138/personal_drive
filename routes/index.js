const { Router } = require('express');
const chooseWallpaper = require('../middleware/chooseWallpaper');
const indexController = require('../controllers/indexController');

const indexRouter = Router();

indexRouter.get('/', chooseWallpaper, indexController.indexGet);

module.exports = indexRouter;
