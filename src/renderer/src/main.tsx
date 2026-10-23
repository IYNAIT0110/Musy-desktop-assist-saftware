import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/main.css'

// 根据 URL hash 判断当前渲染的是悬浮条还是主窗口
// #floatbar → 悬浮条；否则 → 主窗口
const isFloatBar = window.location.hash === '#floatbar'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App mode={isFloatBar ? 'floatbar' : 'main'} />
  </React.StrictMode>
)
