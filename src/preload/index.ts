import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { TreasureApi } from '../shared/treasure'

function requestLocale(): string {
  let locale = 'zh'
  try { const value = localStorage.getItem('musy.lang'); if (value === 'en' || value === 'ja') locale = value } catch { /* Defaults to Chinese. */ }
  return locale
}

function treasureRequest(action: string, payload: Record<string, unknown> = {}): Promise<any> {
  return ipcRenderer.invoke('treasure:request', action, { ...payload, locale: requestLocale() })
}

const treasure: TreasureApi = {
  status: () => treasureRequest('status'),
  chooseLibrary: () => treasureRequest('chooseLibrary'),
  query: query => treasureRequest('query', { query }),
  get: id => treasureRequest('get', { id }),
  importFiles: mode => treasureRequest('importFiles', { mode }),
  importPaths: paths => treasureRequest('importPaths', { paths }),
  importClipboard: () => treasureRequest('importClipboard'),
  importDrop: drop => treasureRequest('importDrop', { drop }),
  dragOut: ids => treasureRequest('dragOut', { ids }),
  openPreview: (ids, mode, index) => treasureRequest('previewOpen', { ids, mode, index }),
  previewSession: () => treasureRequest('previewSession'),
  previewControl: action => treasureRequest('previewControl', { action }),
  onPreviewChange: callback => {
    const listener = (): void => callback()
    ipcRenderer.on('treasure:preview-changed', listener)
    return () => ipcRenderer.removeListener('treasure:preview-changed', listener)
  },
  onDragState: callback => {
    const listener = (_event: unknown, active: boolean): void => callback(active)
    ipcRenderer.on('treasure:drag-state', listener)
    return () => ipcRenderer.removeListener('treasure:drag-state', listener)
  },
  cancelImport: () => treasureRequest('cancelImport'),
  update: (ids, patch) => treasureRequest('update', { ids, patch }),
  group: (action, name, id, direction) => treasureRequest('group', { action, name, id, direction }),
  remove: (ids, restore) => treasureRequest('remove', { ids, restore }),
  thumbnail: (id, large, refresh) => treasureRequest('thumbnail', { id, large, refresh }),
  setCover: id => treasureRequest('setCover', { id }),
  open: (id, action) => treasureRequest('open', { id, action }),
  relink: rootId => treasureRequest('relink', { rootId }),
  locate: id => treasureRequest('locate', { id }),
  backup: () => treasureRequest('backup'),
  restore: () => treasureRequest('restore')
}

// 自定义 API：暴露给渲染进程的安全白名单
const api = {
  treasure,
  getFilePath: (file: File): string => webUtils.getPathForFile(file),
  openMainWindow: (): Promise<void> => ipcRenderer.invoke('window:open-main'),
  // 退出应用（悬浮窗无系统托盘，需要显式退出入口）
  quitApp: (): Promise<void> => ipcRenderer.invoke('app:quit'),
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('window:open-external', url),
  moveFloatBar: (deltaX: number, deltaY: number): Promise<void> =>
    ipcRenderer.invoke('floatbar:move', deltaX, deltaY),
  setFloatPointerHeld: (held: boolean): void => ipcRenderer.send('floatbar:pointer-held', held),
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
  setClipboardLinkWatch: (enabled: boolean): Promise<string | null> =>
    ipcRenderer.invoke('clipboard:set-link-watch', enabled),
  showLinkBubble: (): Promise<'left' | 'right' | null> =>
    ipcRenderer.invoke('floatbar:show-link-bubble'),
  hideLinkBubble: (): Promise<void> => ipcRenderer.invoke('floatbar:hide-link-bubble'),
  onClipboardUrl: (callback: (url: string) => void): (() => void) => {
    const listener = (_e: unknown, url: string): void => callback(url)
    ipcRenderer.on('clipboard:new-url', listener)
    return () => ipcRenderer.removeListener('clipboard:new-url', listener)
  },
  // 选择本地数据保存文件夹（返回路径或 null）
  chooseDataFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('data:choose-folder', requestLocale()),
  // 选择本地语言包 JSON 文件并读取内容
  pickLanguageFile: (): Promise<string | null> =>
    ipcRenderer.invoke('language:pick-file', requestLocale()),
  pickDataBackup: (): Promise<string | null> =>
    ipcRenderer.invoke('data:pick-backup', requestLocale()),
  importPromptFile: (
    cfg: { baseUrl: string; apiKey: string; model: string }, existingTags: string[]
  ): Promise<{ fileName: string; items: { text: string; tags: string[]; image?: string; note?: string }[]; warnings: string[] } | null> =>
    ipcRenderer.invoke('prompts:import-file', cfg, existingTags, requestLocale()),
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
