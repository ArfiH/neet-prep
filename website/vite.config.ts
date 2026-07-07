import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: '../backend/web-dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-router': ['react-router-dom'],
          'vendor-pdf': ['react-pdf'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});
