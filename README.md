# someday-monday

Landing page for **Someday Monday**, served by a tiny dependency-free Node.js app.

## Run it

Requires Node.js 18 or newer. There are no dependencies to install.

```sh
npm start            # http://localhost:3000
PORT=8080 npm start  # pick another port
npm run dev          # restarts on file changes
npm test             # run the tests
```

## What's inside

- `public/index.html` is the landing page.
- `server.js` serves `public/` and a small demo API:
  - `POST /api/signup` with `{ "email": "you@example.com" }` records an early-access signup
  - `GET /api/signups` returns `{ "count": n }`
  - `GET /healthz` returns `ok`

Signups are kept in memory only, so they reset whenever the server restarts. This is for demos, not production.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute.
