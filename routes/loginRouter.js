const { Router } = require('express');
const loginController = require('../controllers/loginController');
const passport = require('passport');

const loginRouter = Router();

loginRouter.get('/', loginController.loginGet);

loginRouter.post(
  '/',
  passport.authenticate('local', {
    failureMessage: 'incorrect creds',
    failureRedirect: 'login',
    successMessage: 'successfully logged in',
    successRedirect: '/dashboard',
  }),
);

module.exports = loginRouter;
