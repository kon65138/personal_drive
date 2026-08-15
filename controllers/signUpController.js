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

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username: req.body.username,
          firstName: req.body.firstName,
          hash,
          salt,
        },
      });
      const root = await tx.folder.create({
        data: { name: 'root', ownerId: created.id },
      });
      return tx.user.update({
        where: { id: created.id },
        data: { rootFolderId: root.id },
      });
    });
  } catch (err) {
    // signUpValidator already checks for a duplicate username, but another
    // request can claim it between that check and this insert — the unique
    // constraint is what actually guarantees it
    if (err.code === 'P2002') {
      return res.status(400).render('signUp', {
        errors: [{ msg: 'Username already in use' }],
        values: req.body,
      });
    }
    return next(err);
  }

  req.login(user, (err) => {
    if (err) return next(err);
    res.redirect('/dashboard');
  });
}

module.exports = { signUpGet, signUpPost };
