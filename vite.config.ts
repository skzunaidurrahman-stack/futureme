import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Set BASE_PATH for project pages (e.g. "/futureme/"); defaults to "/".
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  build: {
    // Three.js is the bulk of the bundle; keep the warning honest but quiet.
    chunkSizeWarningLimit: 1100,
  },
})
