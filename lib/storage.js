const path = require('node:path');
const fs = require('node:fs/promises');

const UPLOAD_DIR =
  process.env.RAILWAY_VOLUME_MOUNT_PATH ||
  path.join(__dirname, '..', 'uploads');

function filePath(storageKey) {
  return path.join(UPLOAD_DIR, storageKey);
}

async function removePath(target) {
  await fs.unlink(target).catch((err) => {
    if (err.code !== 'ENOENT') throw err;
  });
}

module.exports = {
  UPLOAD_DIR,
  filePath,
  removePath,
};
