import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Same setup as production (see vercel.json): the API is reached through
    // this site's own /api path, so the session cookie is always first-party.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
