const { quotaError } = require('../lib/quota');

// an early bail-out before multer writes anything to disk. Content-Length comes
// from the client, so this is only a courtesy — dashboardUpload repeats the
// check against the real file size once it has landed
async function checkQuota(req, res, next) {
  const incoming = BigInt(req.headers['content-length'] || 0);
  const error = await quotaError(req.user, incoming);

  if (error) return res.status(413).json({ error });
  next();
}

module.exports = { checkQuota };
