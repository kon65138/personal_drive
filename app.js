require('dotenv').config();
const path = require('node:path');
const express = require('express');
const expressSession = require('express-session');
require('dotenv/config');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { prisma } = require('./lib/prisma');

const passport = require('passport');

const indexRouter = require('./routes/index');
const loginRouter = require('./routes/loginRouter');
const signUpRouter = require('./routes/signUpRouter');
const chooseWallpaper = require('./middleware/chooseWallpaper');
const dashboardRouter = require('./routes/dashboardRouter');

require('./config/passport');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(
  expressSession({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: 'a santa at nasa',
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  console.log(req.session);
  console.log(req.user);
  next();
});

// makes `currentUser` and `dev` available in every EJS template
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.dev = process.env.NODE_ENV !== 'production';
  next();
});

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/signUp', signUpRouter);
app.use('/dashboard', dashboardRouter);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).render('error', { message: err.message, status: status });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`running on http://localhost:${PORT}`));
