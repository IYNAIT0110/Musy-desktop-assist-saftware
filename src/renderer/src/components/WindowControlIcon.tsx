import settings from '../assets/controls/settings.svg?raw'
import collapse from '../assets/controls/panel-collapse.svg?raw'
import expand from '../assets/controls/panel-expand.svg?raw'
import minimize from '../assets/controls/minimize.svg?raw'
import power from '../assets/controls/power.svg?raw'

const sources = { settings, collapse, expand, minimize, power }

/** 窗口控制使用同一网格和线宽；收起、展开各自保留明确的方向。 */
export function WindowControlIcon({ name }: { name: keyof typeof sources }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      style={{ display: 'inline-flex', width: 18, height: 18, flexShrink: 0, pointerEvents: 'none' }}
      dangerouslySetInnerHTML={{ __html: sources[name] }}
    />
  )
}
