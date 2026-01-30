import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'widget-entry.ts'),
      name: 'Feedback',
      fileName: (format) => `feedback.js`, // Always use .js extension
      formats: ['iife']
    },
    rollupOptions: {
      // Internalize Vue so it's bundled
      external: [],
    },
    outDir: 'dist-widget',
    minify: true,
    emptyOutDir: true
  }
})
