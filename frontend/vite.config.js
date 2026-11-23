import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Vite plugin to ensure dist/404.html is an exact copy of dist/index.html
// for seamless SPA client-side routing on Render Static Sites, GitHub Pages, etc.
const copyIndexTo404Plugin = () => ({
  name: 'copy-index-to-404',
  closeBundle() {
    const distPath = path.resolve(__dirname, 'dist')
    const indexPath = path.join(distPath, 'index.html')
    const notFoundPath = path.join(distPath, '404.html')
    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, notFoundPath)
      console.log('[SPA Routing] Successfully created dist/404.html from dist/index.html')
    }
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyIndexTo404Plugin()],
  base: '/', // Ensure absolute paths
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
