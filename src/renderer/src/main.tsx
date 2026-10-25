import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/main.css'
import { initTheme } from './theme'
import { AssetPreview } from './components/AssetPreview'
import './appearance.css'
import { initLanguage } from './i18n'
import { initButtonRipples } from './buttonRipple'
import './button-ripple.css'

initTheme()
initLanguage()
initButtonRipples()

// 根据 URL hash 判断当前渲染的是悬浮条还是主窗口
// #floatbar → 悬浮条；否则 → 主窗口
const isFloatBar = window.location.hash === '#floatbar'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {window.location.hash === '#asset-preview' ? <AssetPreview /> : <App mode={isFloatBar ? 'floatbar' : 'main'} />}
  </React.StrictMode>
)
