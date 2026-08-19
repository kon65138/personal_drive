const {
  findFileForOwner,
  findFolderWithContents,
  createFile,
} = require('../db/queries');
const { filePath, removeFile, removePath } = require('../lib/storage');

async function dashboardGet(req, res, next) {
  const folder = await findFolderWithContents(
    req.user.rootFolderId,
    req.user.id,
  );
  if (!folder) return res.sendStatus(404);

  res.render('dashboard', {
    currentFolders: folder.children,
    currentFolderContent: folder.files,
  });
}

async function dashboardDownload(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.sendStatus(404);

  const file = await findFileForOwner(id, req.user.id);
  if (!file) return res.sendStatus(404);

  res.download(filePath(file.storageKey), file.name);
}

async function dashboardUpload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const file = await createFile({
      name: req.file.originalname,
      storageKey: req.file.filename,
      mimeType: req.file.mimetype,
      size: BigInt(req.file.size),
      ownerId: req.user.id,
      folderId: req.user.rootFolderId, // or a folder id from the request
    });

    res.json({ id: file.id, name: file.name, size: Number(file.size) });
  } catch (err) {
    // multer wrote the file to disk before this handler ran, so a failed insert
    // would strand it on the volume with nothing pointing at it
    await removePath(req.file.path);
    next(err);
  }
}

module.exports = { dashboardGet, dashboardUpload, dashboardDownload };
