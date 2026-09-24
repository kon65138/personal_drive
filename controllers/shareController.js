const { findActiveShareLink } = require('../db/queries');
const { filePath } = require('../lib/storage');
const { formatTimeLeft } = require('../lib/format');

// no isAuth anywhere in here: holding the token is the permission. an expired
// token and one that never existed get the same answer, so the page gives away
// nothing about which links were once real

async function shareGet(req, res) {
  const link = await findActiveShareLink(req.params.token);
  if (!link) return res.status(404).render('share', { file: null });

  res.render('share', {
    file: link.file,
    token: link.token,
    expiresIn: formatTimeLeft(link.expiresAt),
  });
}

// checks expiry again rather than trusting the page: someone could open it
// with a minute left and click download an hour later
async function shareDownload(req, res) {
  const link = await findActiveShareLink(req.params.token);
  if (!link) return res.status(404).render('share', { file: null });

  res.download(filePath(link.file.storageKey), link.file.name);
}

module.exports = { shareGet, shareDownload };
