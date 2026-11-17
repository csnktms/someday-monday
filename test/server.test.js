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
  const first = await res.json();
  assert.equal(first.ok, true);
  assert.equal(first.count, 1);
  assert.match(first.code, /^[A-Za-z0-9_-]{8}$/);
  assert.equal(first.position, 1);
  assert.equal(first.spot, 1);
  assert.equal(first.referrals, 0);

  res = await postSignup({ email: ' A@Example.com ' });
  const again = await res.json();
  assert.equal(again.count, 1, 'duplicates are not counted twice');
  assert.equal(again.code, first.code, 'a repeat signup gets the same referral code back');

  res = await postSignup({ email: 'b@example.com' });
  const second = await res.json();
  assert.equal(second.count, 2);
  assert.equal(second.position, 2);
  assert.notEqual(second.code, first.code);

  res = await fetch(`${base}/api/signups`);
  assert.deepEqual(await res.json(), { count: 2 });
});

test('referrals move the referrer up the list', async () => {
  const base1 = (await (await fetch(`${base}/api/signups`)).json()).count;
  const owner = await (await postSignup({ email: 'owner@example.com' })).json();
  assert.equal(owner.position, base1 + 1);

  // Two friends join with the link; a repeat signup and an unknown code don't count.
  await postSignup({ email: 'friend1@example.com', ref: owner.code });
  await postSignup({ email: 'friend2@example.com', ref: owner.code });
  await postSignup({ email: 'friend1@example.com', ref: owner.code });
  await postSignup({ email: 'owner@example.com', ref: owner.code });
  await postSignup({ email: 'friend3@example.com', ref: 'nope' });

  const res = await fetch(`${base}/api/referral/${owner.code}`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    code: owner.code,
    position: owner.position,
    referrals: 2,
    spot: owner.position - 2,
  });
});

test('spot never goes above #1', async () => {
  const res = await fetch(`${base}/api/signups`);
  const { count } = await res.json();
  assert.ok(count > 0);
  const first = await (await postSignup({ email: 'a@example.com' })).json();
  await postSignup({ email: 'top1@example.com', ref: first.code });
  await postSignup({ email: 'top2@example.com', ref: first.code });
  const stats = await (await fetch(`${base}/api/referral/${first.code}`)).json();
  assert.equal(stats.referrals, 2);
  assert.equal(stats.spot, 1);
});

test('unknown referral codes return 404', async () => {
  for (const code of ['doesnotexist', '..%2f..', 'x'.repeat(40)]) {
    const res = await fetch(`${base}/api/referral/${code}`);
    assert.equal(res.status, 404, code);
  }
});

test('signup rejects bad input', async () => {
  assert.equal((await postSignup({ email: 'not-an-email' })).status, 400);
  assert.equal((await postSignup({})).status, 400);
  assert.equal((await postSignup('{oops')).status, 400);
  assert.equal((await postSignup({ email: 'x'.repeat(2000) + '@a.co' })).status, 413);
  assert.equal((await fetch(`${base}/api/signup`)).status, 405);
});
