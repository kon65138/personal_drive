const { Router } = require('express');
const shareController = require('../controllers/shareController');

const shareRouter = Router();

shareRouter.get('/', shareController.shareGet);

module.exports = shareRouter;
