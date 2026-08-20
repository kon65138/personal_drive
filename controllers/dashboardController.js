const {
  findFileForOwner,
  findFolderForOwner,
  findFolderWithContents,
  createFile,
  createFolder,
} = require('../db/queries');
const { formatBytes, formatDate } = require('../lib/format');
const { filePath, removePath } = require('../lib/storage');

// Resolves the folder a write should land in. The id arrives from the client,
// so it is only trusted after confirming it belongs to the requesting user —
// otherwise anyone could write into another account's tree by guessing an id.
// Returns null when the folder is missing or not theirs.
async function resolveParentId(req) {
  const raw = req.body.parentId;
  if (raw === undefined || raw === '') return req.user.rootFolderId;

  const id = Number(raw);
  if (!Number.isInteger(id)) return null;
  if (id === req.user.rootFolderId) return id;

  const parent = await findFolderForOwner(id, req.user.id);
  return parent ? parent.id : null;
}

// shared by the root view and the per-folder view so both stay in step
async function renderFolder(req, res, folderId) {
  const folder = await findFolderWithContents(folderId, req.user.id);
  if (!folder) return res.sendStatus(404);

  res.render('dashboard', {
    currentFolder: folder,
    currentFolders: folder.children,
    currentFolderContent: folder.files,
  });
}

async function dashboardGet(req, res, next) {
  return renderFolder(req, res, req.user.rootFolderId);
}

async function dashboardFolderGet(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.sendStatus(404);

  return renderFolder(req, res, id);
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
    const folderId = await resolveParentId(req);
    if (folderId === null) {
      await removePath(req.file.path);
      return res.status(404).json({ error: 'Folder not found' });
    }

    const file = await createFile({
      name: req.file.originalname,
      storageKey: req.file.filename,
      mimeType: req.file.mimetype,
      size: BigInt(req.file.size),
      ownerId: req.user.id,
      folderId,
    });

    res.json({
      id: file.id,
      name: file.name,
      size: formatBytes(file.size),
      createdAt: formatDate(file.createdAt),
    });
  } catch (err) {
    // multer wrote the file to disk before this handler ran, so a failed insert
    // would strand it on the volume with nothing pointing at it
    await removePath(req.file.path);

    if (err.code === 'P2002') {
      return res
        .status(409)
        .json({ error: 'A file with that name already exists here' });
    }
    next(err);
  }
}

async function dashboardNewEmptyFolder(req, res, next) {
  const name = (req.body.newFolder || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }

  const parentId = await resolveParentId(req);
  if (parentId === null) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  try {
    const folder = await createFolder({ name, ownerId: req.user.id, parentId });
    res.json({ id: folder.id, name: folder.name });
  } catch (err) {
    // @@unique([ownerId, parentId, name])
    if (err.code === 'P2002') {
      return res
        .status(409)
        .json({ error: 'A folder with that name already exists here' });
    }
    next(err);
  }
}

module.exports = {
  dashboardGet,
  dashboardFolderGet,
  dashboardUpload,
  dashboardDownload,
  dashboardNewEmptyFolder,
};
