'use strict';

// Small, dependency-free Node.js app that serves the Someday Monday landing page.
// - Static files from ./public
// - POST /api/signup  { "email": "..." }  -> stores the email in memory (demo only)
// - GET  /api/signups                      -> count of signups so far
// - GET  /healthz                          -> "ok"

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_BODY_BYTES = 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      // Keep reading (and discarding) so the client still gets a response.
      if (size <= MAX_BODY_BYTES) chunks.push(chunk);
    });
    req.on('end', () => {
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Body too large'), { status: 413 }));
      } else {
        resolve(Buffer.concat(chunks).toString('utf8'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400);
    return res.end('Bad request');
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = path.join(PUBLIC_DIR, path.normalize(urlPath));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}

function createServer() {
  const signups = new Set();

  return http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');

    if (pathname === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('ok');
    }

    if (pathname === '/api/signup') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
      try {
        const { email } = JSON.parse((await readBody(req)) || '{}');
        if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
          return sendJson(res, 400, { error: 'Please enter a valid email address.' });
        }
        signups.add(email.trim().toLowerCase());
        return sendJson(res, 201, { ok: true, count: signups.size });
      } catch (err) {
        return sendJson(res, err.status || 400, { error: err.status ? err.message : 'Invalid JSON' });
      }
    }

    if (pathname === '/api/signups') {
      return sendJson(res, 200, { count: signups.size });
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return sendJson(res, 405, { error: 'Method not allowed' });
    }
    return serveStatic(req, res);
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  createServer().listen(port, host, () => {
    console.log(`Someday Monday running at http://localhost:${port}`);
  });
}

module.exports = { createServer };
