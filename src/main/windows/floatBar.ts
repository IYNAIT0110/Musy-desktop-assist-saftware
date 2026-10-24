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
  // 悬浮条尺寸：初始为最小球 64×64
  // 定位在屏幕左侧垂直居中偏上，给向右（760px）与向下（560px）的展开预留空间
  const barWidth = 64
  const barHeight = 64
  const barX = workArea.x + 16
  const barY = workArea.y + Math.round((workArea.height - barHeight) / 2) - 80

  floatBarWindow = new BrowserWindow({
    width: barWidth,
    height: barHeight,
    x: barX,
    y: barY,
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

  // 从任务栏恢复（用户点击任务栏图标）：重新置顶并隐藏任务栏图标
  floatBarWindow.on('restore', () => {
    floatBarWindow?.setAlwaysOnTop(true, 'screen-saver')
    floatBarWindow?.setSkipTaskbar(true)
  })

  // 只允许 http/https 走系统浏览器：拦住 javascript: / file: / data: 等危险协议
  floatBarWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
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

