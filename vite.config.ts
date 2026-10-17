import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {newsletterDevApi} from './src/plugins/newsletterDevApi';

function valueFromDotEnv(key: string): string | undefined {
  try {
    const text = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
    const line = text.split(/\r?\n/).find((row) => row.startsWith(`${key}=`));
    return line?.slice(key.length + 1).trim();
  } catch {
    return undefined;
  }
}

export default defineConfig(({ mode }) => {
  // Agent-/Cursor-sesjoner setter ofte VITE_FIRESTORE_ENABLED=false i process.env.
  // Vite lar det overstyre .env, og innloggingsknappen blir da deaktivert lokalt.
  const firestoreFromFile = valueFromDotEnv('VITE_FIRESTORE_ENABLED');
  if (firestoreFromFile) {
    process.env.VITE_FIRESTORE_ENABLED = firestoreFromFile;
  }
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), newsletterDevApi(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['react-is', 'recharts'],
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
