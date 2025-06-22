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
        target: 'es2020',
        minify: false
    },

    server: {
        port: 3000,
        host: '127.0.0.1',
        strictPort: true,
        open: true,
        cors: true,
        headers: {
            'Cross-Origin-Embedder-Policy': 'credentialless',
            'Cross-Origin-Opener-Policy': 'same-origin'
        }
    },

    assetsInclude: ['**/*.hdr'],

    // ローカル開発用に最適化設定をシンプルに
    optimizeDeps: {
        exclude: [],
        include: ['react', 'react-dom', 'phaser', 'three']
    },

    // 開発時のHMR設定
    hmr: {
        port: 24678
    }
})
