'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createServer } = require('../server');

let server;
let base;
let staticDir;

before(async () => {
  // Stand-in for the Vite build output so these tests don't need a build.
  staticDir = fs.mkdtempSync(path.join(os.tmpdir(), 'someday-monday-'));
  fs.mkdirSync(path.join(staticDir, 'assets'));
  fs.writeFileSync(path.join(staticDir, 'index.html'), '<!DOCTYPE html><div id="root"></div>');
  fs.writeFileSync(path.join(staticDir, 'assets', 'app-abc123.js'), 'console.log(1)');

  server = createServer({ staticDir });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(staticDir, { recursive: true, force: true });
});

const postSignup = (body) =>
  fetch(`${base}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

test('serves the landing page at /', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  assert.match(await res.text(), /<div id="root">/);
});

test('serves built assets with long-lived caching', async () => {
  const res = await fetch(`${base}/assets/app-abc123.js`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /javascript/);
  assert.match(res.headers.get('cache-control'), /immutable/);
});

test('unknown API routes return JSON 404', async () => {
  const res = await fetch(`${base}/api/nope`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: 'Not found' });
});

test('health check returns ok', async () => {
  const res = await fetch(`${base}/healthz`);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'ok');
});

test('unknown files return 404', async () => {
  const res = await fetch(`${base}/nope.html`);
  assert.equal(res.status, 404);
});

test('does not serve files outside public/', async () => {
  for (const p of ['/../server.js', '/%2e%2e/server.js', '/..%2fpackage.json']) {
    const res = await fetch(`${base}${p}`);
    assert.notEqual(res.status, 200, `${p} should not be served`);
    assert.doesNotMatch(await res.text(), /createServer|"scripts"/);
  }
});

test('signup accepts valid emails and counts unique ones', async () => {
  let res = await postSignup({ email: 'a@example.com' });
  assert.equal(res.status, 201);
  assert.deepEqual(await res.json(), { ok: true, count: 1 });

  res = await postSignup({ email: ' A@Example.com ' });
  assert.equal((await res.json()).count, 1, 'duplicates are not counted twice');

  res = await postSignup({ email: 'b@example.com' });
  assert.equal((await res.json()).count, 2);

  res = await fetch(`${base}/api/signups`);
  assert.deepEqual(await res.json(), { count: 2 });
});

test('signup rejects bad input', async () => {
  assert.equal((await postSignup({ email: 'not-an-email' })).status, 400);
  assert.equal((await postSignup({})).status, 400);
  assert.equal((await postSignup('{oops')).status, 400);
  assert.equal((await postSignup({ email: 'x'.repeat(2000) + '@a.co' })).status, 413);
  assert.equal((await fetch(`${base}/api/signup`)).status, 405);
});
