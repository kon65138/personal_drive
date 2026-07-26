const fs = require('fs/promises');
const path = require('path');

async function chooseWallpaper(req, res, next) {
  const portraitFiles = await fs.readdir(
    path.join(__dirname, '..', 'public', 'imgs', 'portrait'),
  );
  const landscapeFiles = await fs.readdir(
    path.join(__dirname, '..', 'public', 'imgs', 'landscape'),
  );

  const portrait = `/imgs/portrait/${portraitFiles[Math.floor(Math.random() * portraitFiles.length)]}`;
  const landscape = `/imgs/landscape/${landscapeFiles[Math.floor(Math.random() * landscapeFiles.length)]}`;

  res.locals.wallpaper = { portrait, landscape };
  next();
}

module.exports = chooseWallpaper;
