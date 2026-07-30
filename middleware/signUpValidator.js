const { body } = require('express-validator');
const { prisma } = require('../lib/prisma');

async function isUsernameDuplicate(value) {
  const user = await prisma.user.findUnique({
    where: { username: value },
  });
  if (user) {
    throw new Error('Username already in use');
  }
}

function matchPassword(value, { req }) {
  return value === req.body.password;
}

const signUpValidator = [
  body('firstName').trim().isLength({ max: 50 }),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ max: 50 })
    .custom(isUsernameDuplicate),
  body('password')
    .isLength({ min: 8, max: 256 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .custom(matchPassword)
    .withMessage("Passwords don't match"),
];

module.exports = { signUpValidator };
