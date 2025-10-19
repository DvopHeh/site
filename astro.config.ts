import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

import react from '@astrojs/react';

export default defineConfig({
  adapter: cloudflare(),
  output: 'server',

  server: {
      port: 4321,
  },

  vite: {
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
},

  integrations: [react()]
});