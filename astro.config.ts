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
    resolve: {
            // Use react-dom/server.edge for compatibility with Cloudflare's runtime
            alias: import.meta.env.PROD
                ? { 
                    'react-dom/server': 'react-dom/server.edge',
                  }
                : {},
        },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
},

  integrations: [react()]
});