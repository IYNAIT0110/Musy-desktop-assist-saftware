import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 自定义 API：暴露给渲染进程的安全白名单
const api = {
  openMainWindow: (): Promise<void> => ipcRenderer.invoke('window:open-main'),
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('window:open-external', url),
  moveFloatBar: (deltaX: number, deltaY: number): Promise<void> =>
    ipcRenderer.invoke('floatbar:move', deltaX, deltaY),
  getWorkArea: (): Promise<Electron.Rectangle> =>
    ipcRenderer.invoke('screen:work-area')
}

// 使用 contextBridge 安全暴露
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
