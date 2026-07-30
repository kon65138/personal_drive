function loginGet(req, res, next) {
  // passport's failureMessage pushes strings onto req.session.messages;
  // read them, then clear so they don't reappear on the next page load
  const messages = req.session.messages ?? [];
  req.session.messages = [];

  // normalize to { msg } so the view's error.msg loop works the same as signUp
  const errors = messages.map((msg) => ({ msg }));

  res.render('login', { errors: errors.length ? errors : false });
}

module.exports = { loginGet };
