/**
 * アプリケーションのエントリーポイント
 * 
 * React 19のcreateRoot APIを使用してアプリケーションをマウントします。
 * StrictModeでラップして開発時の警告を有効化しています。
 * 
 * @module main
 * @see {@link https://react.dev/reference/react-dom/client/createRoot}
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
