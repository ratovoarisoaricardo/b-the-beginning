import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false, // Ensures original code cannot be reconstructed
    target: 'esnext',
    chunkSizeWarningLimit: 2000,
  }
})
