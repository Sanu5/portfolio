import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// BASE_PATH lets the same build serve from a sub-path (GitHub Pages project site → "/portfolio/").
// Local dev and root-domain hosts (Vercel, Netlify, a custom domain) leave it unset.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
