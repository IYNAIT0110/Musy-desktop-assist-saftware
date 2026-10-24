import type { ReactNode } from 'react'
import { FloatBar } from './components/FloatBar'
import { MainWindow } from './components/MainWindow'
import { seedFirmSites, seedIfEmpty } from './store'

interface AppProps {
  mode: 'floatbar' | 'main'
}

function App({ mode }: AppProps): ReactNode {
  // 首次启动注入预置的国内外建筑师常用网站（仅一次）
  if (mode === 'floatbar') {
    seedIfEmpty()
    seedFirmSites() // 「事务所」收藏夹：国内外知名建筑事务所官网
  }
  return mode === 'floatbar' ? <FloatBar /> : <MainWindow />
}

export default App
