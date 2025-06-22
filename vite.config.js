import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },

  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },

      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }

          if (id.includes('/games/')) {
            const parts = id.split('/');
            const gameIndex = parts.findIndex(part => part === 'games');
            if (gameIndex >= 0 && gameIndex + 1 < parts.length) {
              return `games-${parts[gameIndex + 1]}`;
            }
          }

          if (id.includes('/src/')) {
            return 'main';
          }
        }
      }
    },

    target: 'es2020',
    minify: false
  },

  server: {
    port: 5173,
    host: true
  },

  assetsInclude: ['**/*.hdr'],

  optimizeDeps: {
    exclude: ['games/**/*']
  }
})
