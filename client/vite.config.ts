import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true, // ngrok などのホスト名からのアクセスを許可
    cors: true,         // クロスオリジンリソース共有を許可

    // スマホからのAPIリクエストをバックエンド(5000番)へ転送する設定
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        // プロキシでエラーが起きた場合にPCのターミナルにログを出す設定
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
        },
      }
    }
  },
})