import { defineConfig } from 'vite'
import react from '@vitejs/react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './', // This ensures paths work perfectly on GitHub Pages
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
