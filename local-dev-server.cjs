const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 5173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function safeFile(requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  let rel = decoded.replace(/^\/+/, '');
  if (!rel) rel = 'index.html';
  if (rel === 'admin' || rel === 'admin/') rel = 'admin/index.html';
  const resolved = path.resolve(root, rel);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  let file = safeFile(req.url || '/');
  if (!file) {
    res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8'});
    return res.end('Forbidden');
  }

  try {
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      // Browser-history fallback for this single-page app.
      file = path.join(root, 'index.html');
    }
    const ext = path.extname(file).toLowerCase();
    const body = fs.readFileSync(file);
    res.writeHead(200, {
      'Content-Type': types[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, {'Content-Type':'text/plain; charset=utf-8'});
    res.end('Local dev server error');
    console.error(err);
  }
});

server.listen(port, host, () => {
  console.log(`Silverstone Mission Control running at http://localhost:${port}`);
  console.log(`Admin: http://localhost:${port}/admin`);
  console.log('Press Ctrl+C to stop.');
});
