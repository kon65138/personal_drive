const { body } = require('express-validator');

const INVALID_CHARS = /[/\\:*?"<>|\u0000-\u001F]/;

const nameValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 255 })
    .withMessage('Name must be 255 characters or fewer')
    .not()
    .matches(INVALID_CHARS)
    .withMessage('Name cannot contain / \\ : * ? " < > |'),
];

module.exports = { nameValidator };
