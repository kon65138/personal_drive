const { Router } = require('express');
const { UPLOAD_DIR } = require('../lib/storage');
const dashboardController = require('../controllers/dashboardController');
const { isAuth } = require('../middleware/authMiddleware');
const multer = require('multer');
const { nameValidator } = require('../middleware/renameValidator');
const { checkQuota } = require('../middleware/checkSize');

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 1024 * 1024 * 1024 },
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
  checkQuota,
  upload.single('file'),
  dashboardController.dashboardUpload,
);

dashboardRouter.post(
  '/newEmptyFolder',
  isAuth,
  dashboardController.dashboardNewEmptyFolder,
);

dashboardRouter.post(
  '/files/:id/share',
  isAuth,
  dashboardController.dashboardShareFile,
);

// multer aborts the stream and cleans up the partial file itself, so there is
// nothing to unlink here. this runs before the app-level handler, which renders
// HTML — these routes are fetched, so they need JSON
dashboardRouter.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File is larger than 1 GB' });
    }
    return res.status(400).json({ error: 'Upload failed' });
  }
  next(err);
});

module.exports = dashboardRouter;
