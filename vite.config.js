import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    outDir: 'public',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        // Ensure proper chunking
        manualChunks: undefined,
      }
    }
  },
  // Important: Use relative paths
  base: './',
  // Ensure the public directory is properly configured
  publicDir: 'public',
})