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
import urbanusLogo from '../assets/firm-icons/urbanus.png'
import zhupeiLogo from '../assets/firm-icons/zhupei.png'
import vtnLogo from '../assets/firm-icons/vtn.png'
import sanaaLogo from '../assets/firm-icons/sanaa.svg'

export const LINK_ICON_OVERRIDES: Record<string, string> = {
  'big.dk': bigLogo,
  // 官网品牌素材：urbanus.com.cn/wp-content/themes/urbanus/ui/images/index_en.png
  // studiopeizhu.com/template/default/images/logo.png
  // vtnarchitects.net/images/config/logo_1626670038.png
  // 这些站点没有稳定的 favicon；第三方图标服务会返回通用的「f」占位图。
  'urbanus.com.cn': urbanusLogo,
  'studiopeizhu.com': zhupeiLogo,
  'votrongnghia.com': vtnLogo,
  'vtnarchitects.net': vtnLogo,
  'sanaa.co.jp': sanaaLogo
}

export const LINK_WIDE_ICON_HOSTS = new Set([
  'urbanus.com.cn', 'studiopeizhu.com', 'votrongnghia.com', 'vtnarchitects.net', 'sanaa.co.jp'
])
