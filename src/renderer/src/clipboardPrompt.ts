const KEY = 'musy.clipboard.linkPrompt'

export function isClipboardPromptEnabled(): boolean {
  return localStorage.getItem(KEY) !== 'off'
}

export function setClipboardPromptEnabled(enabled: boolean): void {
  localStorage.setItem(KEY, enabled ? 'on' : 'off')
  window.dispatchEvent(new Event('musy:clipboard-prompt-setting'))
}
