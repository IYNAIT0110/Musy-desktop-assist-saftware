import portal from '../assets/navigation/portal.svg?raw'
import scroll from '../assets/navigation/scroll.svg?raw'
import codex from '../assets/navigation/codex.svg?raw'
import brush from '../assets/navigation/brush.svg?raw'
import treasure from '../assets/navigation/treasure.svg?raw'

const sources = { links: portal, prompts: scroll, shortcuts: codex, polish: brush, models: treasure }

/** 静态 SVG 源文件作为单一来源；currentColor 跟随导航选中与悬停状态。 */
export function NavigationIcon({ name }: { name: keyof typeof sources }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      style={{ display: 'inline-flex', width: 20, height: 20, flexShrink: 0, pointerEvents: 'none' }}
      dangerouslySetInnerHTML={{ __html: sources[name] }}
    />
  )
}
