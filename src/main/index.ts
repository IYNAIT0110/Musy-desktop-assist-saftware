import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { createMainWindow } from './windows/mainWindow'
import { createFloatBarWindow, getFloatBarWindow } from './windows/floatBar'

// 开发/生产环境判断
const isDev = !app.isPackaged

// 应用单实例锁
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
}

function bootstrap(): void {
  app.setAppUserModelId('com.musy.desktop-assist')

  // 创建迷你悬浮条
  createFloatBarWindow()

  // 展开主窗口按需创建（首次点击悬浮条时创建）
  ipcMain.handle('window:open-main', () => {
    createMainWindow()
  })

  ipcMain.handle('window:open-external', (_e, url: string) => {
    if (url && /^https?:\/\//.test(url)) {
      shell.openExternal(url)
    }
  })

  // 悬浮条拖拽移动
  ipcMain.handle('floatbar:move', (_e, deltaX: number, deltaY: number) => {
    const bar = getFloatBarWindow()
    if (!bar || bar.isDestroyed()) return
    const [x, y] = bar.getPosition()
    bar.setPosition(x + deltaX, y + deltaY, false)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createFloatBarWindow()
    }
  })
}

app.on('second-instance', () => {
  createFloatBarWindow()
})

app.whenReady().then(() => {
  app.setAppUserModelId('com.musy.desktop-assist')
  bootstrap()
})

app.on('window-all-closed', () => {
  // 悬浮窗应用：窗口关闭后保持后台存活，由托盘/菜单控制退出
  // 这里故意不调用 app.quit()
})

// 获取主显示器工作区尺寸，供悬浮条定位
ipcMain.handle('screen:work-area', () => {
  const { workArea } = screen.getPrimaryDisplay()
  return workArea
})
