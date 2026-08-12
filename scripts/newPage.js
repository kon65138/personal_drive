#!/usr/bin/env node
// Scaffolds a new page: view, stylesheet, controller and router.
// usage: node scripts/newPage.js <name>
const fs = require('fs/promises');
const path = require('path');

const root = path.join(__dirname, '..');
const name = process.argv[2];

if (!name) {
  console.error('usage: node scripts/newPage.js <name>');
  process.exit(1);
}

// the name becomes a JS variable (`${name}Router`), so it has to be a valid identifier
if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
  console.error(
    `invalid name "${name}" — use letters, digits, _ or $, and don't start with a digit`,
  );
  process.exit(1);
}

const view = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="/css/style.css" />
    <link rel="stylesheet" href="/css/${name}.css" />
    <script src="/js/pageTransition.js" defer></script>
    <title>Personal Drive</title>
  </head>
  <body>
    <div>${name}</div>
  </body>
</html>
`;

const controller = `function ${name}Get(req, res, next) {
  res.render('${name}');
}

module.exports = { ${name}Get };
`;

const router = `const { Router } = require('express');
const ${name}Controller = require('../controllers/${name}Controller');

const ${name}Router = Router();

${name}Router.get('/', ${name}Controller.${name}Get);

module.exports = ${name}Router;
`;

const targets = [
  { file: path.join(root, 'views', `${name}.ejs`), content: view },
  { file: path.join(root, 'public', 'css', `${name}.css`), content: '' },
  {
    file: path.join(root, 'controllers', `${name}Controller.js`),
    content: controller,
  },
  { file: path.join(root, 'routes', `${name}Router.js`), content: router },
];

async function main() {
  // check everything up front so a collision can't leave a half-scaffolded page
  const existing = [];
  for (const { file } of targets) {
    try {
      await fs.access(file);
      existing.push(path.relative(root, file));
    } catch {
      // missing is what we want
    }
  }

  if (existing.length) {
    console.error('refusing to overwrite:');
    existing.forEach((f) => console.error(`  ${f}`));
    process.exit(1);
  }

  for (const { file, content } of targets) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content, { flag: 'wx' });
    console.log(`created ${path.relative(root, file)}`);
  }

  console.log(`
add this to app.js to finish wiring it up:

  const ${name}Router = require('./routes/${name}Router');
  app.use('/${name}', ${name}Router);

then visit http://localhost:3000/${name}
`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
