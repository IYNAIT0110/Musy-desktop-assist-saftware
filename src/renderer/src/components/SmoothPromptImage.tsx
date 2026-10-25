import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { decodePromptImage } from '../promptImageCache'
import { tx } from '../i18n'

interface Layer { id: number; src: string; failed?: boolean }
/** Keep the outgoing image opaque until the decoded incoming layer covers it. */
export function SmoothPromptImage({ src, onOpen }: { src: string; onOpen: (src: string) => void }): JSX.Element {
  const [layers, setLayers] = useState<Layer[]>([{ id: 0, src }])
  const current = useRef<Layer>({ id: 0, src })
  const nodes = useRef(new Map<number, HTMLDivElement>())
  const serial = useRef(0)
  const request = useRef(0)
  const alive = useRef(true)
  const running = useRef<Promise<void>>(Promise.resolve())
  const release = useRef<(() => void) | null>(null)
  const started = useRef(-1)
  const animation = useRef<Animation | null>(null)
  useEffect(() => {
    alive.current = true
    return () => { alive.current = false; request.current++; animation.current?.cancel(); release.current?.() }
  }, [])
  useEffect(() => {
    const token = ++request.current
    if (current.current.src === src && release.current === null) return
    void decodePromptImage(src).then(async ready => {
      await running.current
      if (!alive.current || token !== request.current || current.current.src === src) return
      const next = { id: ++serial.current, src, failed: !ready }
      running.current = new Promise(resolve => { release.current = resolve })
      setLayers([current.current, next])
    })
  }, [src])
  useLayoutEffect(() => {
    if (layers.length < 2) return
    const next = layers[layers.length - 1]
    if (started.current === next.id) return
    started.current = next.id
    const node = nodes.current.get(next.id)
    if (!node) return
    const image = node.querySelector('img')
    const complete = (): void => {
      if (!alive.current) return
      current.current = next; setLayers([next]); release.current?.(); release.current = null
    }
    // The old layer stays visible during this DOM image's own decode as well.
    void (image?.decode?.() ?? Promise.resolve()).catch(() => undefined).then(() => {
      if (!alive.current) return
      animation.current = node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160, easing: 'ease-out', fill: 'forwards' })
      void animation.current.finished.then(complete, complete)
    })
  }, [layers])
  return <div className="prompt-smooth-image" role="button" tabIndex={0} aria-label={tx('查看')}
    onClick={() => onOpen(current.current.src)} onKeyDown={event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); onOpen(current.current.src) } }}>
    {layers.map(layer => <div key={layer.id} ref={node => { if (node) nodes.current.set(layer.id, node); else nodes.current.delete(layer.id) }} className="prompt-smooth-layer" style={{ opacity: layer.id === current.current.id ? 1 : 0 }}>
      {layer.failed ? <span className="prompt-stack-empty">{tx('无预览图')}</span> : <img src={layer.src} alt="" draggable={false} />}
    </div>)}
  </div>
}
