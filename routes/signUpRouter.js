const { Router } = require('express');
const chooseWallpaper = require('../middleware/chooseWallpaper');
const signUpController = require('../controllers/signUpController');

const signUpRouter = Router();

signUpRouter.get('/', chooseWallpaper, signUpController.signUpGet);

module.exports = signUpRouter;
