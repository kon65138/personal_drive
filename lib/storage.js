const path = require('node:path');

const UPLOAD_DIR =
  process.env.RAILWAY_VOLUME_MOUNT_PATH ||
  path.join(__dirname, '..', 'uploads');

module.exports = {
  UPLOAD_DIR,
};
