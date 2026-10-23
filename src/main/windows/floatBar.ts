import { BrowserWindow, screen, shell, app } from 'electron'
import { join } from 'path'

let floatBarWindow: BrowserWindow | null = null

export function getFloatBarWindow(): BrowserWindow | null {
  return floatBarWindow
}

export function createFloatBarWindow(): BrowserWindow {
  if (floatBarWindow && !floatBarWindow.isDestroyed()) {
    floatBarWindow.focus()
    return floatBarWindow
  }

  const { workArea } = screen.getPrimaryDisplay()
  // 悬浮条尺寸（竖向窄条）
  const barWidth = 64
  const barHeight = 280

  floatBarWindow = new BrowserWindow({
    width: barWidth,
    height: barHeight,
    x: workArea.x + workArea.width - barWidth - 16,
    y: Math.round(workArea.y + (workArea.height - barHeight) / 2),
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
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

  // 置顶层级：屏幕级置顶，确保悬浮条在所有窗口之上
  floatBarWindow.setAlwaysOnTop(true, 'screen-saver')

  floatBarWindow.on('ready-to-show', () => {
    floatBarWindow?.show()
  })

  floatBarWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    floatBarWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#floatbar')
  } else {
    floatBarWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: 'floatbar'
    })
  }

  floatBarWindow.on('closed', () => {
    floatBarWindow = null
  })

  return floatBarWindow
}

