import type { ReactNode } from 'react'
import { FloatBar } from './components/FloatBar'
import { MainWindow } from './components/MainWindow'

interface AppProps {
  mode: 'floatbar' | 'main'
}

function App({ mode }: AppProps): ReactNode {
  return mode === 'floatbar' ? <FloatBar /> : <MainWindow />
}

export default App
