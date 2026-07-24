require('dotenv').config();
const path = require('node:path');
const express = require('express');
const expressSession = require('express-session');
require('dotenv/config');
const { PrismaPg } = require('@prisma/adapter-pg'); // For other db adapters, see Prisma docs
const { PrismaClient } = require('./generated/prisma/client');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');

// DATABASE_URL defined in env file included in prisma.config.js; see Prisma docs
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const passport = require('passport');

const indexRouter = require('./routes/index');

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

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).render('error', { message: err.message, status: status });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`running on http://localhost:${PORT}`));
