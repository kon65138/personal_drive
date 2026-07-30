// middleware/validate.js — reusable across every form
// usage: validate('viewName') as middleware after a validation chain
const { validationResult } = require('express-validator');

function validate(view) {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // re-render the form with errors and the submitted values (keyed by
      // form field name) so the user's input is preserved
      return res.status(400).render(view, {
        errors: errors.array(),
        values: req.body,
      });
    }
    next();
  };
}

module.exports = { validate };
