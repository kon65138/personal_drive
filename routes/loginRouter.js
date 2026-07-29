const { Router } = require('express');
const chooseWallpaper = require('../middleware/chooseWallpaper');
const loginController = require('../controllers/loginController');

const loginRouter = Router();

loginRouter.get('/', chooseWallpaper, loginController.loginGet);

module.exports = loginRouter;
