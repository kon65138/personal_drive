const { prisma } = require('../lib/prisma');

function createFile(data) {
  return prisma.file.create({ data });
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

function findFolderWithContents(id, ownerId) {
  return prisma.folder.findFirst({
    where: { id, ownerId },
    include: {
      children: { orderBy: { name: 'asc' } },
      files: { orderBy: { name: 'asc' } },
    },
  });
}

module.exports = {
  createFile,
  findFileForOwner,
  listFolderContents,
  listFolders,
  findFolderWithContents,
};
