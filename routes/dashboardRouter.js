const { Router } = require('express');
const { UPLOAD_DIR } = require('../lib/storage');
const dashboardController = require('../controllers/dashboardController');
const { isAuth } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});

const dashboardRouter = Router();

dashboardRouter.get('/', isAuth, dashboardController.dashboardGet);

dashboardRouter.get(
  '/files/:id',
  isAuth,
  dashboardController.dashboardDownload,
);

dashboardRouter.post(
  '/newFile',
  isAuth,
  upload.single('file'),
  dashboardController.dashboardUpload,
);

dashboardRouter.post(
  '/newEmptyFolder',
  isAuth,
  dashboardController.dashboardNewEmptyFolder,
);

module.exports = dashboardRouter;
