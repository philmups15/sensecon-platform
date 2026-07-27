import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this app from a subpath; Railway serves it from
  // its own domain root, so Railway's build sets VITE_BASE_PATH=/ to override.
  base: process.env.VITE_BASE_PATH || '/sensecon-platform/',
});
