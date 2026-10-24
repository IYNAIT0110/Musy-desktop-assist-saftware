import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 自定义 API：暴露给渲染进程的安全白名单
const api = {
  openMainWindow: (): Promise<void> => ipcRenderer.invoke('window:open-main'),
  // 退出应用（悬浮窗无系统托盘，需要显式退出入口）
  quitApp: (): Promise<void> => ipcRenderer.invoke('app:quit'),
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('window:open-external', url),
  moveFloatBar: (deltaX: number, deltaY: number): Promise<void> =>
    ipcRenderer.invoke('floatbar:move', deltaX, deltaY),
  setFloatBarExpanded: (expanded: boolean): Promise<void> =>
    ipcRenderer.invoke('floatbar:set-level', expanded ? 2 : 1),
  // 三级形态：1 最小球 / 2 功能胶囊 / 3 完整面板（带最大/最小化按钮）
  setFloatBarLevel: (level: 1 | 2 | 3 | 4): Promise<void> =>
    ipcRenderer.invoke('floatbar:set-level', level),
  getWorkArea: (): Promise<Electron.Rectangle> =>
    ipcRenderer.invoke('screen:work-area'),
  // 最小化到任务栏（点击任务栏图标可恢复）
  minimizeFloatBar: (): Promise<void> =>
    ipcRenderer.invoke('floatbar:minimize-to-taskbar'),
  // 读取系统剪贴板文本
  readClipboardText: (): Promise<string> => ipcRenderer.invoke('clipboard:read-text'),
  // 选择本地数据保存文件夹（返回路径或 null）
  chooseDataFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('data:choose-folder'),
  // 选择本地语言包 JSON 文件并读取内容
  pickLanguageFile: (): Promise<string | null> =>
    ipcRenderer.invoke('language:pick-file'),
  pickDataBackup: (): Promise<string | null> =>
    ipcRenderer.invoke('data:pick-backup'),
  // 把全部数据 JSON 写入指定文件夹
  saveDataToFolder: (folder: string, json: string): Promise<boolean> =>
    ipcRenderer.invoke('data:save', folder, json),
  // 获取网站 favicon（主进程下载并本地缓存，返回 file:// 或 null）
  getFavicon: (url: string): Promise<string | null> =>
    ipcRenderer.invoke('favicon:get', url),
  // 用配置的大模型总结网站功能简介（返回一句话或 null）
  summarizeWebsite: (
    cfg: { baseUrl: string; apiKey: string; model: string },
    url: string
  ): Promise<string | null> =>
    ipcRenderer.invoke('ai:summarize', { ...cfg, url }),
  // 用配置的大模型改写文生图提示词（mode: rewrite/expand/concise/translate）
  rewritePrompt: (
    cfg: { baseUrl: string; apiKey: string; model: string },
    prompt: string,
    mode: string
  ): Promise<string | null> =>
    ipcRenderer.invoke('ai:rewrite-prompt', { ...cfg, prompt, mode }),
  // 全局鼠标位置监听（整个桌面范围）
  onGlobalCursor: (callback: (point: { x: number; y: number }) => void): (() => void) => {
    const listener = (_e: unknown, point: { x: number; y: number }): void => {
      callback(point)
    }
    ipcRenderer.on('cursor:global', listener)
    // 返回取消订阅函数
    return () => {
      ipcRenderer.removeListener('cursor:global', listener)
    }
  }
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
