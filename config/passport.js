const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { validPassword } = require('../lib/passwordUtils');
const { prisma } = require('../lib/prisma');

const customFields = {
  usernameField: 'username',
  passwordField: 'password',
};

const verifyCallback = (username, password, done) => {
  prisma.user
    .findUnique({
      where: { username: username },
    })
    .then((user) => {
      if (!user) {
        return done(null, false);
      }

      const isValid = validPassword(password, user.hash, user.salt);

      if (isValid) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    })
    .catch((err) => {
      done(err);
    });
};

const strategy = new LocalStrategy(customFields, verifyCallback);

passport.use(strategy);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((userId, done) => {
  prisma.user
    .findUnique({
      where: {
        id: userId,
      },
    })
    .then((user) => {
      done(null, user);
    })
    .catch((err) => done(err));
});
