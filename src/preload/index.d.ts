import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      openMainWindow: () => Promise<void>
      quitApp: () => Promise<void>
      openExternal: (url: string) => Promise<void>
      moveFloatBar: (deltaX: number, deltaY: number) => Promise<void>
      setFloatBarExpanded: (expanded: boolean) => Promise<void>
      setFloatBarLevel: (level: 1 | 2 | 3 | 4) => Promise<void>
      getWorkArea: () => Promise<Electron.Rectangle>
      minimizeFloatBar: () => Promise<void>
      readClipboardText: () => Promise<string>
      chooseDataFolder: () => Promise<string | null>
      pickLanguageFile: () => Promise<string | null>
      pickDataBackup: () => Promise<string | null>
      saveDataToFolder: (folder: string, json: string) => Promise<boolean>
      getFavicon: (url: string) => Promise<string | null>
      summarizeWebsite: (
        cfg: { baseUrl: string; apiKey: string; model: string },
        url: string
      ) => Promise<string | null>
      rewritePrompt: (
        cfg: { baseUrl: string; apiKey: string; model: string },
        prompt: string,
        mode: string
      ) => Promise<string | null>
      onGlobalCursor: (
        callback: (point: { x: number; y: number }) => void
      ) => () => void
    }
  }
}

export {}
