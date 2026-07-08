import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    sourcemap: true,
    // Raise the warning threshold slightly; real fix is manualChunks below
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Function form so ALL entries of a package (e.g. react-dom/client)
        // land in the right vendor chunk. Vendor chunks change rarely →
        // long browser-cache lifetime across deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/react-router') ||
            id.includes('/scheduler/')
          ) {
            return 'vendor-react'
          }
          return 'vendor'
        },
      },
    },
  },
})
