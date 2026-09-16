const { prisma } = require('../lib/prisma');

function createFile(data) {
  return prisma.file.create({ data });
}

function createFolder(data) {
  return prisma.folder.create({ data });
}

function findFileForOwner(id, ownerId) {
  return prisma.file.findFirst({ where: { id, ownerId } });
}

function listFolderContents(folderId, ownerId) {
  return prisma.file.findMany({
    where: { folderId, ownerId },
    orderBy: { name: 'asc' },
  });
}

function listFolders(parentId, ownerId) {
  return prisma.folder.findMany({
    where: { parentId, ownerId },
    orderBy: { name: 'asc' },
  });
}

// ownership is part of the query so there is no callable path that returns
// another user's folder
function findFolderForOwner(id, ownerId) {
  return prisma.folder.findFirst({ where: { id, ownerId } });
}

function findFolderWithContents(id, ownerId) {
  return prisma.folder.findFirst({
    where: { id, ownerId },
    include: {
      children: {
        orderBy: { name: 'asc' },
        include: { _count: { select: { children: true, files: true } } },
      },
      files: { orderBy: { name: 'asc' } },
    },
  });
}

function findFolderSummary(id, ownerId) {
  return prisma.folder.findFirst({
    where: { id, ownerId },
    include: { _count: { select: { children: true, files: true } } },
  });
}

// A folder's size is every file beneath it at any depth. Prisma can't express
// recursion, so the subtree walk and the sum happen in one round trip.
async function folderSize(id, ownerId) {
  const [row] = await prisma.$queryRaw`
    WITH RECURSIVE tree AS (
      SELECT id FROM "Folder" WHERE id = ${id} AND "ownerId" = ${ownerId}
      UNION
      SELECT f.id FROM "Folder" f JOIN tree t ON f."parentId" = t.id
    )
    SELECT COALESCE(SUM(fi.size), 0)::bigint AS size,
           COUNT(fi.id)::int              AS files
    FROM tree t LEFT JOIN "File" fi ON fi."folderId" = t.id
  `;
  return row;
}

function renameFolder(id, name) {
  return prisma.folder.update({
    where: { id: id },
    data: { name: name },
  });
}

function renameFile(id, name) {
  return prisma.file.update({
    where: { id: id },
    data: { name: name },
  });
}

// The cascade removes descendant rows, taking their storageKeys with them, so
// the keys have to be collected while the tree still exists.
function subtreeStorageKeys(id, ownerId) {
  return prisma.$queryRaw`
    WITH RECURSIVE tree AS (
      SELECT id FROM "Folder" WHERE id = ${id} AND "ownerId" = ${ownerId}
      UNION
      SELECT f.id FROM "Folder" f JOIN tree t ON f."parentId" = t.id
    )
    SELECT fi."storageKey" FROM tree t JOIN "File" fi ON fi."folderId" = t.id
  `;
}

// deleteMany rather than delete: it accepts a non-unique where, so ownership
// is enforced in the query instead of by the caller. count 0 means "not yours".
function deleteFolder(id, ownerId) {
  return prisma.folder.deleteMany({ where: { id, ownerId } });
}

function deleteFile(id, ownerId) {
  return prisma.file.deleteMany({ where: { id, ownerId } });
}

async function ensureFolderPath(ownerId, parentId, segments) {
  let currentId = parentId;

  for (const name of segments) {
    const existing = await prisma.folder.findFirst({
      where: { ownerId, parentId: currentId, name },
    });

    if (existing) {
      currentId = existing.id;
    } else {
      const created = await prisma.folder.create({
        data: { name, ownerId, parentId: currentId },
      });
      currentId = created.id;
    }
  }

  return currentId;
}

async function usedBytes(ownerId) {
  const { _sum } = await prisma.file.aggregate({
    where: { ownerId },
    _sum: { size: true },
  });
  return _sum.size ?? 0n;
}

module.exports = {
  createFile,
  findFileForOwner,
  listFolderContents,
  listFolders,
  findFolderForOwner,
  findFolderWithContents,
  createFolder,
  findFolderSummary,
  folderSize,
  renameFolder,
  renameFile,
  subtreeStorageKeys,
  deleteFolder,
  deleteFile,
  ensureFolderPath,
  usedBytes,
};
