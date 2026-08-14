const { Router } = require('express');
const dashboardController = require('../controllers/dashboardController');
const { isAuth } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: './public/data/uploads/' });

const dashboardRouter = Router();

dashboardRouter.get('/', isAuth, dashboardController.dashboardGet);

dashboardRouter.post('/uploads', isAuth, upload.single('file'), (req, res) => {
  // multer leaves req.file undefined when no file came through
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ filename: req.file.filename, size: req.file.size });
});

module.exports = dashboardRouter;
