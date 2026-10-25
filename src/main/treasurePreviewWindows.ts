import { app, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import type { TreasureStore } from './treasureStore'
import type { AssetPreviewSession } from '../shared/treasure'

export function createTreasurePreviewWindows(): {
  store: (sender: number) => TreasureStore | undefined
  session: (sender: number) => AssetPreviewSession | null
  control: (sender: number, action: string) => boolean
  open: (store: TreasureStore, ids: string[], mode: string, index: number, owner: BrowserWindow | null) => Promise<void>
} {
  const sessions = new Map<number, { store: TreasureStore; data: AssetPreviewSession; window: BrowserWindow }>()
  let preview: BrowserWindow | null = null
  return {
    store: sender => sessions.get(sender)?.store,
    session: sender => sessions.has(sender) ? structuredClone(sessions.get(sender)!.data) : null,
    control: (sender, action) => {
      const entry = sessions.get(sender)
      if (!entry || entry.window.isDestroyed()) return false
      if (action === 'close') { entry.window.close(); return false }
      if (action === 'pin') {
        entry.data.pinned = !entry.data.pinned
        entry.window.setAlwaysOnTop(entry.data.pinned, 'screen-saver')
      }
      return entry.data.pinned
    },
    open: async (store, ids, mode, index, owner) => {
      const unique = [...new Set(ids)]
      if (!unique.length || unique.length > 60) throw new Error('预览每次支持 1–60 项素材')
      const assets = unique.map(id => store.item(id))
      if (mode === 'compare' && (unique.length < 2 || unique.length > 4 || assets.some(item => item.kind !== 'image'))) throw new Error('请选择 2–4 张图片进行并排参考')
      const data: AssetPreviewSession = { ids: unique, mode: mode === 'compare' ? 'compare' : 'single', index: Math.max(0, Math.min(unique.length - 1, Math.floor(index) || 0)), pinned: true }
      if (preview && !preview.isDestroyed()) {
        const current = sessions.get(preview.webContents.id)
        if (current) data.pinned = current.data.pinned
        sessions.set(preview.webContents.id, { store, data, window: preview })
        preview.webContents.send('treasure:preview-changed')
        if (preview.isMinimized()) preview.restore()
        preview.show(); preview.focus()
        return
      }
      const { workArea } = owner ? screen.getDisplayMatching(owner.getBounds()) : screen.getPrimaryDisplay()
      const width = Math.min(1000, workArea.width - 24); const height = Math.min(760, workArea.height - 24)
      const window = new BrowserWindow({ width, height, minWidth: Math.min(480, width), minHeight: Math.min(320, height),
        x: workArea.x + Math.round((workArea.width - width) / 2), y: workArea.y + Math.round((workArea.height - height) / 2),
        title: 'Musy · 素材预览', show: false, frame: false, autoHideMenuBar: true, backgroundColor: '#151518',
        webPreferences: { preload: join(__dirname, '../preload/index.js'), contextIsolation: true, sandbox: false, nodeIntegration: false } })
      preview = window
      const sender = window.webContents.id
      sessions.set(sender, { store, data, window })
      window.setAlwaysOnTop(true, 'screen-saver')
      window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
      window.webContents.on('will-navigate', event => event.preventDefault())
      window.on('closed', () => { sessions.delete(sender); if (preview === window) preview = null })
      try {
        if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) await window.loadURL(process.env.ELECTRON_RENDERER_URL + '#asset-preview')
        else await window.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'asset-preview' })
        if (!window.isDestroyed()) { window.show(); window.focus() }
      } catch (error) { if (!window.isDestroyed()) window.destroy(); throw error }
    }
  }
}
