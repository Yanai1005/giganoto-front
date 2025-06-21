import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // モジュール解決の設定
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },

  // publicディレクトリの設定
  publicDir: 'public',

  // ビルド設定
  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    // 静的アセットの処理
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },

      output: {
        // ゲームファイルを適切に処理
        manualChunks: (id) => {
          // gamesディレクトリのファイルは個別のチャンクとして分離
          if (id.includes('/games/')) {
            const parts = id.split('/');
            const gameIndex = parts.findIndex(part => part === 'games');
            if (gameIndex >= 0 && gameIndex + 1 < parts.length) {
              return `games-${parts[gameIndex + 1]}`;
            }
          }
        }
      }
    }
  },

  // 開発サーバー設定
  server: {
    port: 5173,
    host: true
  },

  // アセット処理の設定
  assetsInclude: ['**/*.hdr']
})
