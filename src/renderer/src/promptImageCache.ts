const images = new Map<string, Promise<boolean>>()
/** Decode before changing a visible image; failed images remain retryable. */
export function decodePromptImage(src: string | undefined): Promise<boolean> {
  if (!src) return Promise.resolve(false)
  const cached = images.get(src)
  if (cached) return cached
  const task = new Promise<boolean>(resolve => {
    const image = new Image()
    let settled = false
    const finish = (ready: boolean): void => {
      if (settled) return
      settled = true; image.onload = null; image.onerror = null; resolve(ready)
    }
    image.onload = () => {
      if (typeof image.decode === 'function') void image.decode().then(() => finish(true), () => finish(image.naturalWidth > 0))
      else finish(image.naturalWidth > 0)
    }
    image.onerror = () => finish(false)
    image.src = src
  })
  images.set(src, task)
  while (images.size > 24) images.delete(images.keys().next().value!)
  void task.then(ready => { if (!ready && images.get(src) === task) images.delete(src) })
  return task
}
