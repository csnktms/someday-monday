import { createRequire } from 'node:module';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);
const { createApi } = require('./server.js');

// Mount the same API the production server uses, so `npm run dev` and
// `vite preview` work with a single command and no proxy.
function apiPlugin() {
  return {
    name: 'someday-monday-api',
    configureServer(server) {
      server.middlewares.use(createApi());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createApi());
    },
  };
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  // Relative asset URLs so the build also works when served from a sub-path.
  base: './',
  server: {
    // Allow access through preview/tunnel hostnames.
    allowedHosts: true,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
