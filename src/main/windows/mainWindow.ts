import { BrowserWindow, shell, app, screen } from 'electron'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null

export function createMainWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus()
    return mainWindow
  }

  mainWindow = new BrowserWindow({
    width: 760,
    height: Math.min(680, Math.max(64, screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea.height - 12)),
    show: false,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: false,
    roundedCorners: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // 外部链接用系统浏览器打开（同样只放行 http/https，拦住 javascript: / file: 等协议）
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}
