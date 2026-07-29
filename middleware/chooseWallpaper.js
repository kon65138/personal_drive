const fs = require('fs/promises');
const path = require('path');

async function chooseWallpaper(req, res, next) {
  const portraitFiles = await fs.readdir(
    path.join(__dirname, '..', 'public', 'imgs', 'portrait'),
  );
  const landscapeFiles = await fs.readdir(
    path.join(__dirname, '..', 'public', 'imgs', 'landscape'),
  );

  const portRandNum = Math.floor(Math.random() * portraitFiles.length);
  const landRandNum = Math.floor(Math.random() * landscapeFiles.length);

  const portraitFile = portraitFiles[portRandNum];
  const landscapeFile = landscapeFiles[landRandNum];
  const thumbOf = (f) => f.replace(/\.webp$/, '_thumb.webp');

  res.locals.wallpaper = {
    portrait: `/imgs/portrait/${portraitFile}`,
    portraitThumb: `/imgs/portraitThumbnails/${thumbOf(portraitFile)}`,
    landscape: `/imgs/landscape/${landscapeFile}`,
    landscapeThumb: `/imgs/landscapeThumbnails/${thumbOf(landscapeFile)}`,
  };
  next();
}

module.exports = chooseWallpaper;
