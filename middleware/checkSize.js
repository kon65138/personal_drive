const { usedBytes } = require('../db/queries');

async function checkQuota(req, res, next) {
  const capacity = BigInt(process.env.VOLUME_SIZE || 0);
  const incoming = BigInt(req.headers['content-length'] || 0);
  const used = await usedBytes(req.user.id);

  if (used + incoming > capacity) {
    return res.status(413).json({ error: 'Not enough storage space' });
  }
  next();
}

module.exports = { checkQuota };
