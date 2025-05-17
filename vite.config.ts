import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
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
});
