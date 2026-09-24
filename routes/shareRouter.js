const { Router } = require('express');
const shareController = require('../controllers/shareController');

const shareRouter = Router();

shareRouter.get('/:token', shareController.shareGet);
shareRouter.get('/:token/download', shareController.shareDownload);

module.exports = shareRouter;
