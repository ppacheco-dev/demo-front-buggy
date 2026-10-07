import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const fullReloadGameFiles = {
  name: 'full-reload-game-files',
  handleHotUpdate({ file, server }) {
    if (file.includes('/game/') || file.includes('\\game\\')) {
      server.ws.send({ type: 'full-reload' });
      return [];
    }
  },
};

export default defineConfig({
  plugins: [react(), fullReloadGameFiles],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
