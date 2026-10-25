import { app, BrowserWindow } from 'electron'

// Electron 31 calls Windows thumbnail providers synchronously even though the
// API returns a Promise. Run that API in a dedicated hidden renderer so a slow
// third-party provider cannot freeze the main process or the visible interface.
export function createSystemThumbnailReader(): (path: string, size: number) => Promise<Buffer | null> {
  let worker: BrowserWindow | null = null
  let ready: Promise<void> | null = null
  let quitting = false
  app.on('before-quit', () => { quitting = true; worker?.destroy(); worker = null })
  return async (path, size): Promise<Buffer | null> => {
    if (quitting) return null
    if (!worker || worker.isDestroyed()) {
      worker = new BrowserWindow({ show: false, skipTaskbar: true, width: 64, height: 64,
        webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false, backgroundThrottling: false } })
      worker.webContents.on('will-navigate', event => event.preventDefault())
      worker.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
      const created = worker
      worker.webContents.on('render-process-gone', () => {
        if (!created.isDestroyed()) created.destroy()
        if (worker === created) { worker = null; ready = null }
      })
      ready = worker.loadURL('data:text/html,<meta charset="utf-8"><title>Musy thumbnail worker</title>')
    }
    const current = worker
    let timer: NodeJS.Timeout | undefined
    try {
      const task = (async (): Promise<Buffer | null> => {
        await ready
        if (current.isDestroyed()) return null
        const script = `require('electron').nativeImage.createThumbnailFromPath(${JSON.stringify(path)}, { width: ${size}, height: ${size} }).then(image => image.isEmpty() ? null : image.toPNG().toString('base64')).catch(() => null)`
        const value: unknown = await current.webContents.executeJavaScript(script)
        return typeof value === 'string' && value.length <= 24 * 1024 * 1024 ? Buffer.from(value, 'base64') : null
      })().catch(() => null)
      return await Promise.race([task, new Promise<null>(resolve => {
        timer = setTimeout(() => {
          if (!current.isDestroyed()) {
            current.webContents.forcefullyCrashRenderer()
            if (!current.isDestroyed()) current.destroy()
          }
          if (worker === current) { worker = null; ready = null }
          resolve(null)
        }, 6000)
      })])
    } finally { clearTimeout(timer) }
  }
}
