const path = require('node:path');
const fs = require('node:fs/promises');
const { prisma } = require('../lib/prisma');
const { UPLOAD_DIR } = require('../lib/storage');

function dashboardGet(req, res, next) {
  res.render('dashboard');
}

async function dashboardDownload(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.sendStatus(404);

  const file = await prisma.file.findUnique({
    where: { id: id },
  });
  if (!file || file.ownerId !== req.user.id) return res.sendStatus(404);
  res.download(path.join(UPLOAD_DIR, file.storageKey), file.name);
}

async function dashboardUpload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const file = await prisma.file.create({
      data: {
        name: req.file.originalname,
        storageKey: req.file.filename,
        mimeType: req.file.mimetype,
        size: BigInt(req.file.size),
        ownerId: req.user.id,
        folderId: req.user.rootFolderId, // or a folder id from the request
      },
    });

    res.json({ id: file.id, name: file.name, size: Number(file.size) });
  } catch (err) {
    // multer wrote the file to disk before this handler ran, so a failed insert
    // would strand it on the volume with nothing pointing at it
    await fs.unlink(req.file.path).catch(() => {});
    next(err);
  }
}

module.exports = { dashboardGet, dashboardUpload, dashboardDownload };
