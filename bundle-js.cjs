const fs = require('fs');
const path = require('path');

function bundleMain() {
  const root = __dirname;
  const modulesDir = path.join(root, 'src', 'modules');
  const output = path.join(root, 'src', 'main.js');
  const modules = fs.readdirSync(modulesDir)
    .filter(name => name.endsWith('.js'))
    .sort((a, b) => a.localeCompare(b, 'en'));

  if (!modules.length) throw new Error('No JavaScript source modules found.');

  const source = modules
    .map(name => fs.readFileSync(path.join(modulesDir, name), 'utf8'))
    .join('');

  fs.writeFileSync(output, source);
  return { output, modules, bytes: Buffer.byteLength(source) };
}

if (require.main === module) {
  const result = bundleMain();
  console.log(`Bundled ${result.modules.length} source modules into ${path.relative(__dirname, result.output)} (${result.bytes} bytes).`);
}

module.exports = bundleMain;
