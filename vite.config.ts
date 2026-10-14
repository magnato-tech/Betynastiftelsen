import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },
        {
          find: '@betyna/seed',
          replacement: path.resolve(
            __dirname,
            mode === 'production' ? 'src/data/publicData.ts' : 'src/data/initialData.ts',
          ),
        },
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
