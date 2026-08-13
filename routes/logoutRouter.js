const { Router } = require('express');
const { isAuth } = require('../middleware/authMiddleware');

const logoutRouter = Router();

logoutRouter.get('/', isAuth, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = logoutRouter;
