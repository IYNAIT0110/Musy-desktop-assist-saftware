import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      openMainWindow: () => Promise<void>
      openExternal: (url: string) => Promise<void>
      moveFloatBar: (deltaX: number, deltaY: number) => Promise<void>
      getWorkArea: () => Promise<Electron.Rectangle>
    }
  }
}

export {}
