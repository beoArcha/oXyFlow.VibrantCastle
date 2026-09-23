import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

function characterAssetsPlugin() {
  return {
    name: 'character-assets-serve',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/assets/characters/')) {
          const relative = req.url.replace('/assets/characters/', '').split('?')[0];
          let fullPath = path.join(__dirname, 'src/assets/characters', relative);

          if (!fs.existsSync(fullPath)) {
            // Handle aliases such as aurelia_1_low -> aurelia_level_1_low
            const aliased = relative.replace(/_1_/, '_level_1_');
            const aliasedPath = path.join(__dirname, 'src/assets/characters', aliased);
            if (fs.existsSync(aliasedPath)) {
              fullPath = aliasedPath;
            }
          }

          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            res.setHeader(
              'Content-Type',
              fullPath.endsWith('.json') ? 'application/json' : 'image/png'
            );
            return fs.createReadStream(fullPath).pipe(res);
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), characterAssetsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
