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
};
