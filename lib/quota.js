const { usedBytes, totalUsedBytes } = require('../db/queries');

// read once at startup rather than per request: a missing or malformed size
// would otherwise default to 0 and quietly refuse every upload, or throw on
// each one. every problem is collected so one restart shows them all
const problems = [];

function readSize(name) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    problems.push(`${name} is not set`);
    return 0n;
  }
  if (!/^\d+$/.test(raw)) {
    problems.push(`${name} must be a whole number of bytes, got "${raw}"`);
    return 0n;
  }
  return BigInt(raw);
}

const STANDARD_CAPACITY = readSize('STANDARD_VOLUME_SIZE');
const PRIVILEGED_CAPACITY = readSize('PRIVILEGED_VOLUME_SIZE');
// the disk itself, shared by everyone
const VOLUME_CAPACITY = readSize('FULL_VOLUME_SIZE');

if (problems.length) {
  throw new Error(`Storage configuration is invalid:\n  ${problems.join('\n  ')}`);
}

function capacityFor(user) {
  return user.privileged ? PRIVILEGED_CAPACITY : STANDARD_CAPACITY;
}

const remaining = (capacity, used) => (capacity > used ? capacity - used : 0n);

// a user's own allowance can promise more than the disk has left, so what they
// can actually upload is whichever of the two runs out first
async function storageFor(user) {
  const [used, volumeUsed] = await Promise.all([
    usedBytes(user.id),
    totalUsedBytes(),
  ]);
  const capacity = capacityFor(user);
  const userLeft = remaining(capacity, used);
  const volumeLeft = remaining(VOLUME_CAPACITY, volumeUsed);

  return {
    used,
    capacity,
    userLeft,
    volumeLeft,
    left: userLeft < volumeLeft ? userLeft : volumeLeft,
  };
}

// null when `incoming` bytes fit, otherwise the message to send with the 413.
// the two cases read differently because only one is something the user can
// fix by deleting their own files
async function quotaError(user, incoming) {
  const { userLeft, volumeLeft } = await storageFor(user);
  if (incoming > userLeft) return 'Not enough storage space';
  if (incoming > volumeLeft) return 'The drive is full';
  return null;
}

// new accounts are never privileged, so a sign-up needs room for one more
// standard allowance on what's left of the disk
async function hasRoomForNewUser() {
  const left = remaining(VOLUME_CAPACITY, await totalUsedBytes());
  return left >= STANDARD_CAPACITY;
}

module.exports = { capacityFor, storageFor, quotaError, hasRoomForNewUser };
