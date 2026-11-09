# someday-monday

Landing page for **Someday Monday**: a React app (built with Vite) served by a tiny Node.js server with a demo signup API.

## Run it

Requires Node.js 20.19 or newer.

```sh
npm install
npm run dev          # dev server with hot reload + API: http://localhost:5173
npm start            # production build, then serve it: http://localhost:3000
npm test             # server tests (node:test) + React tests (Vitest)
```

`npm run build` writes the static site to `dist/`, and `npm run serve` serves an existing build. Set `PORT` to use another port.

## What's inside

- `index.html` and `src/`: the React app
  - `src/App.jsx` puts the page together from `src/components/` (Header, Hero, SignupForm, Features, HowItWorks, Testimonial, Footer)
  - `src/styles.css` holds the page styles
- `server.js` serves `dist/` and a small demo API:
  - `POST /api/signup` with `{ "email": "you@example.com" }` records an early-access signup
  - `GET /api/signups` returns `{ "count": n }`
  - `GET /healthz` returns `ok`
- `vite.config.mjs` mounts the same API into the Vite dev server, so `npm run dev` is all you need while developing.

Signups are kept in memory only, so they reset whenever the server restarts. This is for demos, not production.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute.
