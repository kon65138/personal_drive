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

module.exports = {
  createFile,
  findFileForOwner,
  listFolderContents,
  listFolders,
  findFolderForOwner,
  findFolderWithContents,
  createFolder,
  findFolderSummary,
};
