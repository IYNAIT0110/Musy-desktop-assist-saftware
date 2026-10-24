/**
 * 站点图标覆盖表（host → 官方品牌标识资源）
 *
 * 少数站点的官方 favicon 与大众认知的品牌标识不一致，直接用站点 favicon 会「看起来不对」。
 * 已知案例：
 * - big.dk（Bjarke Ingels Group）站点 favicon 是一个「大」字彩蛋（BIG 的中文意思），
 *   而其品牌字标是 BIG 三个字母，故此处覆盖为字标版本。
 *
 * 命中覆盖表的站点不再走 favicon 下载（省一次网络请求，也不受站点图标改版影响）。
 */
import bigLogo from '../assets/firm-icons/big.png'

export const LINK_ICON_OVERRIDES: Record<string, string> = {
  'big.dk': bigLogo
}
