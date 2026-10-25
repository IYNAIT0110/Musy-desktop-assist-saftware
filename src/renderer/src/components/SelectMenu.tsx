import { InteractiveButton } from './HoverFeedback'
import { tx, useLang } from '../i18n'
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import './select-menu.css'

export interface SelectOption {
  value: string
  label: string
  description?: string
  separator?: boolean
}

interface Props {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  icon?: 'filter' | 'sort' | 'folder'
  width?: number
}

export function SelectMenu({ label, value, options, onChange, placeholder = tx("请选择"), disabled, icon, width = 208 }: Props): JSX.Element {
  useLang()
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [position, setPosition] = useState({ left: 0, top: 0, width, maxHeight: 320 })
  const selected = options.findIndex(option => option.value === value)
  const search = useRef({ text: '', time: 0 })
  const close = (restoreFocus = false): void => { setOpen(false); if (restoreFocus) trigger.current?.focus() }
  const show = (last = false): void => {
    if (disabled || !options.length) return
    setActive(selected >= 0 ? selected : last ? options.length - 1 : 0)
    search.current = { text: '', time: 0 }
    setOpen(true)
  }
  const choose = (index: number): void => {
    const option = options[index]
    if (!option) return
    close(true)
    onChange(option.value)
  }

  useLayoutEffect(() => {
    if (!open || disabled) { if (disabled) setOpen(false); return }
    const place = (): void => {
      const rect = trigger.current?.getBoundingClientRect()
      if (!rect) return
      const gap = 6; const edge = 10
      const below = window.innerHeight - rect.bottom - gap - edge
      const above = rect.top - gap - edge
      const desired = Math.min(360, popup.current?.scrollHeight ?? 360)
      const upward = below < desired && above > below
      const maxHeight = Math.max(0, Math.min(360, upward ? above : below))
      const menuWidth = Math.min(Math.max(width, rect.width), window.innerWidth - edge * 2)
      setPosition({
        left: Math.max(edge, Math.min(rect.left, window.innerWidth - menuWidth - edge)),
        top: upward ? Math.max(edge, rect.top - gap - Math.min(desired, maxHeight)) : rect.bottom + gap,
        width: menuWidth, maxHeight
      })
    }
    place()
    popup.current?.focus({ preventScroll: true })
    const outside = (event: PointerEvent): void => {
      if (!popup.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) close()
    }
    const scroll = (event: Event): void => { if (!popup.current?.contains(event.target as Node)) place() }
    const blur = (): void => close()
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('scroll', scroll, true)
    window.addEventListener('resize', place)
    window.addEventListener('blur', blur)
    return () => {
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('scroll', scroll, true)
      window.removeEventListener('resize', place)
      window.removeEventListener('blur', blur)
    }
  }, [open, disabled, width, options.length])

  useLayoutEffect(() => {
    if (open) popup.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open, position.maxHeight])

  const keyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    event.stopPropagation()
    if (event.key === 'Escape') { event.preventDefault(); close(true) }
    else if (event.key === 'Tab') { close(true) }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(active) }
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      setActive(index => event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length)
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now()
      search.current = { text: (now - search.current.time < 700 ? search.current.text : '') + event.key.toLocaleLowerCase(), time: now }
      const match = options.findIndex(option => option.label.toLocaleLowerCase().startsWith(search.current.text))
      if (match >= 0) setActive(match)
    }
  }

  return <>
    <InteractiveButton ref={trigger} type="button" className="musy-select-trigger" disabled={disabled} aria-label={label}
      aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => open ? close(true) : show()}
      onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); event.stopPropagation(); show(event.key === 'ArrowUp') } }}>
      {icon && <svg className="musy-select-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon === 'filter' ? <><path d="M3 5h14M5.5 10h9M8 15h4" /></> : icon === 'sort' ? <><path d="M5 3v14m-2-2 2 2 2-2M10 5h7m-7 5h5m-5 5h3" /></> : <path d="M3 6a2 2 0 0 1 2-2h3l2 2h5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />}
      </svg>}
      <span className="musy-select-value">{options[selected]?.label ?? placeholder}</span>
      <svg className="musy-select-chevron" data-open={open} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4.5 6.5 3.5 3.5 3.5-3.5" /></svg>
    </InteractiveButton>
    {open && createPortal(<div ref={popup} id={id} className="musy-select-popup" role="listbox" aria-label={label}
      aria-activedescendant={`${id}-${active}`} tabIndex={0} onKeyDown={keyDown}
      style={position} onPointerDown={event => event.stopPropagation()}>
      <div className="musy-select-heading" role="presentation">{label}</div>
      {options.map((option, index) => <div key={option.value} id={`${id}-${index}`} role="option" aria-selected={option.value === value}
        data-index={index} data-active={active === index} data-separator={option.separator || undefined}
        className="musy-select-option" onPointerMove={() => setActive(index)} onClick={() => choose(index)}>
        <span className="musy-select-copy"><span>{option.label}</span>{option.description && <small>{option.description}</small>}</span>
        <svg className="musy-select-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3.5 8 3 3 6-6" /></svg>
      </div>)}
    </div>, document.body)}
  </>
}
