// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait()
  ],
  optimizeDeps: {
  },
  resolve: {
    alias: {
      'argon2-browser': 'argon2-browser/dist/argon2.min.js',
    },
  },
});