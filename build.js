const fs = require('fs');
const path = require('path');
const bundleMain = require('./bundle-js.cjs');

const root = __dirname;
const out = path.join(root, 'dist');

// Keep one browser JavaScript request while maintaining the source as smaller,
// purpose-specific modules. The generated src/main.js remains the local-dev entry.
bundleMain();

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// Root runtime files. sw.js is the Pass 6.80 retirement shim only; it does not cache requests.
for (const file of ['index.html', 'manifest.webmanifest', 'sw.js']) {
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}

// Production source payload: only the generated browser bundle and stylesheet.
// The development modules are intentionally not deployed as individual files.
const outSrc = path.join(out, 'src');
fs.mkdirSync(outSrc, { recursive: true });
for (const file of ['main.js', 'styles.css']) {
  fs.copyFileSync(path.join(root, 'src', file), path.join(outSrc, file));
}

// Canonical static directories.
for (const dir of ['assets', 'fonts', 'admin']) {
  const source = path.join(root, dir);
  if (fs.existsSync(source)) fs.cpSync(source, path.join(out, dir), { recursive: true });
}


console.log(`Built static Mission Control site in ${out}`);
