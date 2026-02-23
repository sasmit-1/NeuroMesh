import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // THE FIX: Forcibly tell Vite to pre-bundle framer-motion and the JSX runtime!
    include: ['framer-motion', 'react/jsx-runtime']
  }
})