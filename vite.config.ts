import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves project sites from /<repository-name>/.
// Change this if you publish under a different repo name.
export default defineConfig({
  plugins: [react()],
  base: '/pokemon-tcg-dashboard/',
})
