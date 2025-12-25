import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Set base to repository name so GitHub Pages serves assets at
  // https://<user>.github.io/BibleApp/
  base: '/BibleApp/',
  plugins: [react()],
})
