import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // vite config
    define: {
    },
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
      cors: true,
      allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', 'ngrok.io', 'https://1637-2607-fea8-4c26-1800-a5ad-bb76-163-1a96.ngrok-free.app' ],
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
    },
  }
});
