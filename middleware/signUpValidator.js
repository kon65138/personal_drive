const { body } = require('express-validator');
const { prisma } = require('../lib/prisma');
const { hasRoomForNewUser } = require('../lib/quota');

async function isUsernameDuplicate(value) {
  const user = await prisma.user.findUnique({
    where: { username: value },
  });
  if (user) {
    throw new Error('Username already in use');
  }
}

async function isThereSpace() {
  if (!(await hasRoomForNewUser())) {
    throw new Error('Sign-ups are closed: the drive is full');
  }
}

function matchPassword(value, { req }) {
  return value === req.body.password;
}

const signUpValidator = [
  // form-level: not about any one field, so body() with no path
  body().custom(isThereSpace),
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
