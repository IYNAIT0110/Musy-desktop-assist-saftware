import { ElectronAPI } from '@electron-toolkit/preload'
import type { TreasureApi } from '../shared/treasure'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      treasure: TreasureApi
      getFilePath: (file: File) => string
      openMainWindow: () => Promise<void>
      quitApp: () => Promise<void>
      openExternal: (url: string) => Promise<void>
      moveFloatBar: (deltaX: number, deltaY: number) => Promise<void>
      setFloatPointerHeld: (held: boolean) => void
      setFloatBarExpanded: (expanded: boolean) => Promise<void>
      setFloatBarLevel: (level: 1 | 2 | 3 | 4) => Promise<void>
      getWorkArea: () => Promise<Electron.Rectangle>
      minimizeFloatBar: () => Promise<void>
      readClipboardText: () => Promise<string>
      setClipboardLinkWatch: (enabled: boolean) => Promise<string | null>
      showLinkBubble: () => Promise<'left' | 'right' | null>
      hideLinkBubble: () => Promise<void>
      onClipboardUrl: (callback: (url: string) => void) => () => void
      chooseDataFolder: () => Promise<string | null>
      pickLanguageFile: () => Promise<string | null>
      pickDataBackup: () => Promise<string | null>
      importPromptFile: (
        cfg: { baseUrl: string; apiKey: string; model: string }, existingTags: string[]
      ) => Promise<{ fileName: string; items: { text: string; tags: string[]; image?: string; note?: string }[]; warnings: string[] } | null>
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
