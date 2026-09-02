const { Router } = require('express');
const { UPLOAD_DIR } = require('../lib/storage');
const dashboardController = require('../controllers/dashboardController');
const { isAuth } = require('../middleware/authMiddleware');
const multer = require('multer');
const { nameValidator } = require('../middleware/renameValidator');

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});

const dashboardRouter = Router();

dashboardRouter.get('/', isAuth, dashboardController.dashboardGet);

dashboardRouter.get(
  '/folders/:id',
  isAuth,
  dashboardController.dashboardFolderGet,
);

dashboardRouter.get(
  '/files/:id',
  isAuth,
  dashboardController.dashboardDownload,
);

dashboardRouter.get(
  '/folders/:id/size',
  isAuth,
  dashboardController.dashboardFolderSize,
);

dashboardRouter.get(
  '/storageLeft',
  isAuth,
  dashboardController.dashboardStorage,
);

dashboardRouter.patch(
  '/files/:id',
  isAuth,
  nameValidator,
  dashboardController.dashboardRenameFile,
);

dashboardRouter.delete(
  '/files/:id',
  isAuth,
  dashboardController.dashboardDeleteFile,
);

dashboardRouter.patch(
  '/folders/:id',
  isAuth,
  nameValidator,
  dashboardController.dashboardRenameFolder,
);

dashboardRouter.delete(
  '/folders/:id',
  isAuth,
  dashboardController.dashboardDeleteFolder,
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
