import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

// Viteの環境変数から読み込み
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// デバッグ用：ブラウザのコンソールでIDが読み込めているか確認できる（本番公開後は消してもOK）
if (!clientId) {
  console.warn('⚠️ [NAMIR] VITE_GOOGLE_CLIENT_ID is not defined. Check your .env or Vercel settings.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* clientIdが空だとログインボタンが表示されない、またはエラーになるため、空文字を許容しつつ警告 */}
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)