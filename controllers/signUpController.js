const { genPassword } = require('../lib/passwordUtils');
const { prisma } = require('../lib/prisma');

function signUpGet(req, res, next) {
  res.render('signUp', {
    errors: null,
    values: null,
  });
}

async function signUpPost(req, res, next) {
  const { salt, hash } = genPassword(req.body.password);
  const user = prisma.user.create({
    data: {
      username: req.body.username,
      firstName: req.body.firstName,
      hash,
      salt,
      privileged: false,
    },
  });

  req.login(user, (err) => {
    if (err) return next(err);
    res.redirect('/');
  });
}

module.exports = { signUpGet, signUpPost };
