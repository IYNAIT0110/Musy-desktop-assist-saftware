import type { CSSProperties } from 'react'

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: string
  }
}

export {}
