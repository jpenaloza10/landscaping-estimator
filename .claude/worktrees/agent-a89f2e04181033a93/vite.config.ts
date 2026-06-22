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
        manualChunks: {
          // React runtime — tiny, changes rarely → long cache lifetime
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase client — large (~400 kB), almost never changes
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
