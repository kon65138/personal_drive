function isAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/signUp');
  }
}

function isAdmin(req, res, next) {
  console.log(req.user);
  if (req.isAuthenticated() && req.user.privileged) {
    next();
  } else {
    res.status(401).json({
      msg: 'you are not authorized to view this resource because you are not an admin.',
    });
  }
}

module.exports = {
  isAuth,
  isAdmin,
};
