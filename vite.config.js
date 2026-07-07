import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: './', // Ensures all your game scripts and paths map perfectly on GitHub Pages
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  }
})
