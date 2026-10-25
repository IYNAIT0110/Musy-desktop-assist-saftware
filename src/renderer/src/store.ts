/**
 * Musy 本地数据存储：
 * - localStorage 即时持久化（主存储）
 * - 若用户选择了本地文件夹，则每次变更自动同步写盘 musy-data.json（备份/迁移）
 */
import { t } from './i18n'
import { PROMPT_EXAMPLES } from './data/promptExamples'

export interface LinkItem {
  id: string
  title: string
  url: string
  group: string
  ts: number
  desc?: string
}

const LS_LINKS = 'musy.links'
const LS_GROUPS = 'musy.groups'
const LS_FOLDER = 'musy.dataFolder'
const LS_SEEDED = 'musy.seededV3' // v3：补网站简介 desc（v2 已写入无 desc 数据，需换新 key 重注入）
const LS_FIRM_SEEDED = 'musy.seededFirmsV1' // 「事务所」收藏夹：建筑事务所官网只注入一次

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    /* ignore */
  }
  return fallback
}

/**
 * 带配额保护的写入。
 * 关键：提示词的预览图是以 base64 data URI 存在 localStorage 里的，而 Chromium 对单个
 * 源（file:// / localhost）的 localStorage 配额只有 5~10MB，几张大图就能打满。
 * 打满后 setItem 会抛 QuotaExceededError：如果不捕获，异常会一路冒泡到 React 事件回调，
 * 导致「提示已保存但实际没落盘」，甚至整棵树被卸载白屏。
 * 这里统一捕获 + 广播 musy:storage-error，由界面弹提示告诉用户去压缩图片。
 */
function writeLS(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (err) {
    const quotaExceeded =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    console.error('[store] 写入 localStorage 失败:', key, err)
    window.dispatchEvent(
      new CustomEvent('musy:storage-error', { detail: { key, quotaExceeded } })
    )
    return false
  }
}

// === 数据文件夹 ===

export function getDataFolder(): string {
  return localStorage.getItem(LS_FOLDER) ?? ''
}

export function setDataFolder(folder: string): void {
  writeLS(LS_FOLDER, folder)
  void syncToDisk()
}

// === 分组 ===

export function getGroups(): string[] {
  return readLS<string[]>(LS_GROUPS, [])
}

// === 首次启动预置：国内外建筑师常用网站 ===

interface SeedEntry {
  title: string
  url: string
  group: string
  desc: string
}

const SEED_SITES: SeedEntry[] = [
  { title: 'Google', url: 'https://www.google.com/', group: '默认', desc: '网页搜索入口' },
  { title: 'Google Drive', url: 'https://drive.google.com/', group: '默认', desc: '在线文件存储与协作入口' },
  { title: 'ChatGPT', url: 'https://chatgpt.com/', group: '默认', desc: 'AI 对话与创作工具入口' },
  // 灵感与案例
  { title: '谷德设计网', url: 'https://www.gooood.cn/', group: '灵感', desc: '中文建筑/景观/室内设计案例与资讯平台' },
  { title: '有方空间', url: 'https://www.archiposition.com/', group: '灵感', desc: '深度建筑评论、展览与作品报道' },
  { title: '建筑档案', url: 'https://www.archidiaries.com/', group: '灵感', desc: '全球新锐建筑作品档案库' },
  { title: 'ArchDaily', url: 'https://www.archdaily.com/', group: '灵感', desc: '全球最大建筑案例与资讯门户' },
  { title: 'Dezeen', url: 'https://www.dezeen.com/', group: '灵感', desc: '设计、建筑与室内杂志' },
  { title: 'Architizer', url: 'https://www.architizer.com/', group: '灵感', desc: '建筑作品库与 A+ 奖项平台' },
  { title: 'Designboom', url: 'https://www.designboom.com/', group: '灵感', desc: '设计与建筑前沿资讯杂志' },
  { title: 'Architectural Review', url: 'https://www.architectural-review.com/', group: '灵感', desc: '老牌建筑评论杂志' },
  { title: 'Domus', url: 'https://www.domusweb.it/', group: '灵感', desc: '意大利建筑设计权威杂志' },
  // 高清图集
  { title: 'Divisare', url: 'https://divisare.com/', group: '图集', desc: '建筑摄影高清图集精选' },
  { title: 'Atlas of Places', url: 'https://www.atlasofplaces.com/', group: '图集', desc: '图纸、地图与建筑测绘图集' },
  { title: 'Hidden Architecture', url: 'https://hiddenarchitecture.net/', group: '图集', desc: '鲜为人知建筑的分析图集' },
  // 素材与资源
  { title: 'Pinterest', url: 'https://www.pinterest.com/', group: '素材', desc: '灵感图片搜集与整理' },
  { title: 'Behance', url: 'https://www.behance.net/', group: '素材', desc: '设计师作品展示平台' },
  { title: 'Toffu', url: 'https://www.toffu.co/', group: '素材', desc: '建筑插画与矢量素材下载' },
  { title: 'CADMapper', url: 'https://cadmapper.com/', group: '素材', desc: '城市 CAD 底图一键下载' },
  { title: 'Freepik', url: 'https://www.freepik.com/', group: '素材', desc: '免费图片与矢量素材库' },
  { title: 'Texture.com', url: 'https://www.texture.com/', group: '素材', desc: '高质量贴图与纹理资源' },
  // 理论与社区
  { title: 'e-flux Architecture', url: 'https://www.e-flux.com/architecture/', group: '理论', desc: '建筑理论与批评线上刊物' },
  { title: 'Archinect', url: 'https://archinect.com/', group: '理论', desc: '建筑行业社区与求职平台' },
  { title: 'Issuu', url: 'https://issuu.com/', group: '理论', desc: '杂志与出版物在线翻阅' }
]

/** 国内外知名建筑事务所官网（收藏夹分组：事务所） */
const FIRM_SITES: SeedEntry[] = [
  // —— 中国 ——
  { title: 'MAD 建筑事务所', url: 'https://www.i-mad.com/', group: '事务所', desc: '马岩松主持，北京/洛杉矶/罗马，自然意象的未来建筑' },
  { title: '如恩设计研究室 Neri&Hu', url: 'https://www.neriandhu.com/', group: '事务所', desc: '郭锡恩、胡如珊创立，上海，建筑/室内/产品跨界实践' },
  { title: 'OPEN 建筑事务所', url: 'https://www.openarch.com/', group: '事务所', desc: '李虎、黄文菁创立，北京，沙丘美术馆、山谷音乐厅' },
  { title: '直向建筑 Vector Architects', url: 'https://www.vectorarchitects.com/', group: '事务所', desc: '董功主持，北京，孤独图书馆、阳朔糖舍酒店' },
  { title: '家琨建筑', url: 'https://www.jiakun.com/', group: '事务所', desc: '刘家琨主持，成都，2025 普利兹克建筑奖得主' },
  { title: '大舍建筑 Atelier Deshaus', url: 'http://www.deshaus.com/', group: '事务所', desc: '柳亦春、陈屹峰，上海，龙美术馆西岸、西岸艺术中心' },
  { title: '非常建筑 Atelier FCJZ', url: 'https://www.fcjz.com/', group: '事务所', desc: '张永和主持，北京/上海，中国当代建筑实验先行者' },
  { title: '都市实践 URBANUS', url: 'http://www.urbanus.com.cn/', group: '事务所', desc: '刘晓都、孟岩、王辉，深圳/北京，城市与城中村研究' },
  { title: '朱锫建筑事务所', url: 'http://www.studiopeizhu.com/', group: '事务所', desc: '朱锫主持，北京，"自然建筑"，景德镇御窑博物馆' },
  { title: '迹·建筑事务所 TAO', url: 'https://www.t-a-o.cn/', group: '事务所', desc: '华黎主持，北京，在地建造与场所精神' },
  // —— 日本与亚洲 ——
  { title: 'SANAA', url: 'http://www.sanaa.co.jp/', group: '事务所', desc: '妹岛和世＋西泽立卫，东京，2010 普利兹克奖' },
  { title: '隈研吾建筑都市设计事务所 KKAA', url: 'https://kkaa.co.jp/', group: '事务所', desc: '隈研吾主持，东京，"负建筑"与材料建构' },
  { title: '安藤忠雄建筑研究所', url: 'https://www.tadao-ando.com/', group: '事务所', desc: '安藤忠雄，大阪，清水混凝土与光影空间' },
  { title: '日建设计 Nikken Sekkei', url: 'https://www.nikken.jp/en/', group: '事务所', desc: '日本规模最大的综合建筑设计事务所' },
  { title: 'WOHA', url: 'https://www.woha.net/', group: '事务所', desc: '新加坡，热带高层与垂直绿化标杆' },
  { title: 'Vo Trong Nghia Architects', url: 'https://vtnarchitects.net/', group: '事务所', desc: '越南，竹构与绿色建筑' },
  // —— 欧洲 ——
  { title: 'Foster + Partners', url: 'https://www.fosterandpartners.com/', group: '事务所', desc: '诺曼·福斯特，伦敦，高科技与可持续设计' },
  { title: 'Zaha Hadid Architects', url: 'https://www.zaha-hadid.com/', group: '事务所', desc: '扎哈·哈迪德，伦敦，参数化流线型建筑' },
  { title: 'BIG – Bjarke Ingels Group', url: 'https://big.dk/', group: '事务所', desc: '比亚克·英格尔斯，哥本哈根，实用乌托邦' },
  { title: 'Herzog & de Meuron', url: 'https://www.herzogdemeuron.com/', group: '事务所', desc: '巴塞尔，赫尔佐格与德梅隆，鸟巢、泰特现代' },
  { title: 'OMA', url: 'https://www.oma.com/', group: '事务所', desc: '雷姆·库哈斯，鹿特丹，CCTV 大裤衩' },
  { title: 'MVRDV', url: 'https://www.mvrdv.com/', group: '事务所', desc: '鹿特丹，数据驱动与堆叠式城市实验' },
  { title: 'Snøhetta', url: 'https://www.snohetta.com/', group: '事务所', desc: '挪威，景观与建筑融合，亚历山大图书馆' },
  { title: 'UNStudio', url: 'https://www.unstudio.com/', group: '事务所', desc: '阿姆斯特丹，本·范·伯克尔，参数化与基础设施' },
  { title: 'RSHP', url: 'https://www.rshp.com/', group: '事务所', desc: '罗杰斯，伦敦，蓬皮杜中心、高技派' },
  { title: 'David Chipperfield Architects', url: 'https://www.davidchipperfield.com/', group: '事务所', desc: '大卫·奇普菲尔德，柏林/伦敦，克制与文脉修复' },
  { title: 'Heatherwick Studio', url: 'https://www.heatherwick.com/', group: '事务所', desc: '托马斯·赫斯维克，伦敦/上海，上海1000 Trees' },
  { title: 'Renzo Piano Building Workshop', url: 'https://www.rpbw.com/', group: '事务所', desc: '伦佐·皮亚诺，热那亚/巴黎，蓬皮杜中心' },
  { title: 'Ateliers Jean Nouvel', url: 'https://www.jeannouvel.com/', group: '事务所', desc: '让·努维尔，巴黎，阿拉伯世界研究中心' },
  { title: 'Kéré Architecture', url: 'https://kerearchitecture.com/', group: '事务所', desc: '迪埃贝多·弗朗西斯·凯雷，柏林，2022 普利兹克奖' },
  { title: 'Aedas', url: 'https://www.aedas.com/', group: '事务所', desc: '全球大型商业与综合体设计事务所，港澳及内地项目众多' },
  // —— 美洲 ——
  { title: 'Gensler', url: 'https://www.gensler.com/', group: '事务所', desc: '全球最大建筑设计事务所，办公与商业空间' },
  { title: 'SOM', url: 'https://www.som.com/', group: '事务所', desc: '芝加哥，摩天楼与结构工程标杆，上海金茂大厦' },
  { title: 'KPF', url: 'https://www.kpf.com/', group: '事务所', desc: '纽约，高层与城市综合体，上海环球金融中心' },
  { title: 'Perkins&Will', url: 'https://perkinswill.com/', group: '事务所', desc: '芝加哥，教育、医疗与办公建筑' },
  { title: 'HOK', url: 'https://www.hok.com/', group: '事务所', desc: '美国大型综合设计事务所，体育场馆与总部园区' },
  { title: 'NBBJ', url: 'https://www.nbbj.com/', group: '事务所', desc: '西雅图，医疗、科技总部与城市设计' },
  { title: 'Diller Scofidio + Renfro', url: 'https://dsrny.com/', group: '事务所', desc: '纽约，跨界建筑与艺术，High Line、The Shed' },
  { title: 'Morphosis', url: 'https://www.morphosis.com/', group: '事务所', desc: '汤姆·梅恩，洛杉矶，解构与参数化表皮' },
  { title: 'Safdie Architects', url: 'https://www.safdiearchitects.com/', group: '事务所', desc: '摩西·萨夫迪，新加坡滨海湾金沙、Habitat 67' }
]

/**
 * 一次性注入「事务所」收藏夹：国内外知名建筑事务所官网（按 URL 去重，不覆盖已有收藏）。
 * 在 App 挂载时调用；标记已写入后不再重复注入，用户可以自由增删改。
 */
export function seedFirmSites(): void {
  // 旧官网已停用；只迁移该条内置收藏，不改动用户自行创建的链接。
  const links = getLinks()
  if (links.some((l) => l.id.startsWith('firm-') && l.url === 'https://www.votrongnghia.com/')) {
    setLinks(links.map((l) => l.id.startsWith('firm-') && l.url === 'https://www.votrongnghia.com/'
      ? { ...l, url: 'https://vtnarchitects.net/' }
      : l))
  }
  const groups = getGroups()
  if (!groups.includes('事务所')) {
    groups.push('事务所')
    writeLS(LS_GROUPS, JSON.stringify(groups))
  }

  if (localStorage.getItem(LS_FIRM_SEEDED)) return
  writeLS(LS_FIRM_SEEDED, '1')

  const existingUrls = new Set(getLinks().map((l) => l.url))
  const now = Date.now()
  const additions: LinkItem[] = FIRM_SITES.filter((s) => !existingUrls.has(s.url)).map((s, i) => ({
    id: `firm-${i}-${now}`,
    title: s.title,
    url: s.url,
    group: s.group,
    desc: s.desc,
    ts: now - i
  }))
  if (additions.length === 0) return

  setLinks([...additions, ...getLinks()])
}

/**
 * 首次启动时把预置的国内外建筑师常用网站追加进收藏（仅一次，带去重）。
 * 保留用户已有收藏，只补充不覆盖。在 App 挂载时调用。
 */
export function seedIfEmpty(): void {
  // 幂等回填：给所有预置链接补齐 desc（每次启动都执行，不依赖一次性标记）
  const existing = getLinks()
  const descMap = new Map(SEED_SITES.map((s) => [s.url, s.desc]))
  const patched = existing.map((l) =>
    !l.desc && descMap.has(l.url) ? { ...l, desc: descMap.get(l.url) } : l
  )
  if (patched.some((l, i) => l !== existing[i])) {
    setLinks(patched)
  }

  if (localStorage.getItem(LS_SEEDED)) return
  writeLS(LS_SEEDED, '1')

  const existingUrls = new Set(existing.map((l) => l.url))
  const now = Date.now()
  const additions: LinkItem[] = SEED_SITES
    .filter((s) => !existingUrls.has(s.url))
    .map((s, i) => ({
      id: `seed-${i}-${now}`,
      title: s.title,
      url: s.url,
      group: s.group,
      desc: s.desc,
      ts: now - i
    }))
  if (additions.length === 0) return

  setLinks([...additions, ...getLinks()])

  // 同步分组
  const groups = getGroups()
  for (const g of ['灵感', '图集', '素材', '理论']) {
    if (!groups.includes(g)) groups.push(g)
  }
  writeLS(LS_GROUPS, JSON.stringify(groups))
  void syncToDisk()
}

export function addGroup(name: string): void {
  const groups = getGroups()
  if (name && !groups.includes(name)) {
    groups.push(name)
    writeLS(LS_GROUPS, JSON.stringify(groups))
  }
}

/** 调整自定义分组顺序；「全部」「默认」始终固定在顶部。 */
export function moveGroup(name: string, targetName: string, after: boolean): boolean {
  if (name === targetName || name === '全部' || name === '默认' ||
      targetName === '全部' || targetName === '默认') return false
  const groups = getGroups()
  const from = groups.indexOf(name)
  if (from === -1 || !groups.includes(targetName)) return false
  const [moved] = groups.splice(from, 1)
  groups.splice(groups.indexOf(targetName) + (after ? 1 : 0), 0, moved)
  if (!writeLS(LS_GROUPS, JSON.stringify(groups))) return false
  void syncToDisk()
  return true
}

/** 重命名分组；同步更新该分组下所有链接的 group 字段 */
export function renameGroup(oldName: string, newName: string): boolean {
  const name = newName.trim()
  if (!name) return false
  const groups = getGroups()
  if (groups.includes(name) && name !== oldName) return false // 重名
  const idx = groups.indexOf(oldName)
  if (idx === -1) return false
  groups[idx] = name
  writeLS(LS_GROUPS, JSON.stringify(groups))
  // 更新链接所属分组
  setLinks(getLinks().map((l) => (l.group === oldName ? { ...l, group: name } : l)))
  return true
}

/** 删除分组；该分组下链接自动归入「默认」分组 */
export function removeGroup(name: string): void {
  const groups = getGroups().filter((g) => g !== name)
  writeLS(LS_GROUPS, JSON.stringify(groups))
  setLinks(getLinks().map((l) => (l.group === name ? { ...l, group: '默认' } : l)))
}

// === 链接 ===

export function getLinks(): LinkItem[] {
  return readLS<LinkItem[]>(LS_LINKS, [])
}

function setLinks(items: LinkItem[]): boolean {
  if (!writeLS(LS_LINKS, JSON.stringify(items))) return false
  void syncToDisk()
  return true
}

/** 添加链接；校验 URL 合法性与重复 */
export function addLink(
  rawUrl: string,
  group = '默认'
): { ok: boolean; msg: string; id?: string } {
  const url = rawUrl.trim()
  if (!url) return { ok: false, msg: t('links.add.clipboardEmpty') }
  let parsed: URL
  try {
    parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
  } catch {
    return { ok: false, msg: t('links.add.invalid') }
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return { ok: false, msg: t('links.add.notHttp') }
  }
  const finalUrl = parsed.href
  const items = getLinks()
  if (items.some((i) => i.url === finalUrl)) {
    return { ok: false, msg: t('links.add.duplicate') }
  }
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  items.unshift({
    id,
    title: parsed.hostname.replace(/^www\./, ''),
    url: finalUrl,
    group,
    ts: Date.now()
  })
  if (!setLinks(items)) return { ok: false, msg: t('links.add.storageFail') }
  return { ok: true, msg: t('links.add.success'), id }
}

export function removeLink(id: string): void {
  setLinks(getLinks().filter((i) => i.id !== id))
}

/** 拖拽排序：把 dragId 的链接移动到 targetId 所在位置（全量列表内重排，持久化） */
export function moveLink(dragId: string, targetId: string): void {
  if (dragId === targetId) return
  const items = getLinks()
  const from = items.findIndex((i) => i.id === dragId)
  const to = items.findIndex((i) => i.id === targetId)
  if (from === -1 || to === -1) return
  const [moved] = items.splice(from, 1)
  items.splice(to, 0, moved)
  setLinks(items)
}

/** 修改链接所属分组（右键调整分组用） */
export function updateLinkGroup(id: string, group: string): void {
  setLinks(getLinks().map((i) => (i.id === id ? { ...i, group } : i)))
}

/** 更新链接简介 */
export function setLinkDesc(id: string, desc: string): void {
  setLinks(getLinks().map((i) => (i.id === id ? { ...i, desc } : i)))
}

/**
 * 用配置的大模型总结网站功能简介并回填。
 * 收藏新链接后调用；无 API Key 或失败时静默跳过（不影响收藏本身）。
 */
export async function summarizeLink(
  id: string,
  url: string,
  cfg: { baseUrl: string; apiKey: string; model: string }
): Promise<void> {
  if (!cfg.apiKey) return
  const desc = await window.api.summarizeWebsite(cfg, url)
  if (desc) setLinkDesc(id, desc)
}

/** 全量数据同步写盘（选了文件夹才写） */
export async function syncToDisk(): Promise<boolean> {
  const folder = getDataFolder()
  if (!folder) return false
  const payload = JSON.stringify(
    {
      version: 1,
      savedAt: Date.now(),
      links: getLinks(),
      groups: getGroups(),
      prompts: getPrompts()
    },
    null,
    2
  )
  return window.api.saveDataToFolder(folder, payload)
}

/** 从用户选择的备份恢复收藏；校验后一次写入并通知界面刷新。 */
export function importBackup(json: string): boolean {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return false
  }
  if (!data || typeof data !== 'object') return false
  const backup = data as Record<string, unknown>
  if (backup.version !== 1 || !Array.isArray(backup.links) ||
      !Array.isArray(backup.groups) || !Array.isArray(backup.prompts)) return false
  if (!backup.links.every((x: unknown) => x && typeof x === 'object' &&
      typeof (x as LinkItem).id === 'string' && typeof (x as LinkItem).title === 'string' &&
      typeof (x as LinkItem).url === 'string' && typeof (x as LinkItem).group === 'string')) return false
  if (!backup.groups.every((x: unknown) => typeof x === 'string')) return false
  if (!backup.prompts.every((x: unknown) => x && typeof x === 'object' &&
      typeof (x as PromptItem).id === 'string' && typeof (x as PromptItem).text === 'string' &&
      Array.isArray((x as PromptItem).tags) &&
      (x as PromptItem).tags.every((tag: unknown) => typeof tag === 'string'))) return false

  const keys = [LS_LINKS, LS_GROUPS, LS_PROMPTS, LS_SEEDED, LS_FIRM_SEEDED]
  const previous = keys.map((key) => localStorage.getItem(key))
  try {
    localStorage.setItem(LS_LINKS, JSON.stringify(backup.links))
    localStorage.setItem(LS_GROUPS, JSON.stringify(backup.groups))
    localStorage.setItem(LS_PROMPTS, JSON.stringify(backup.prompts))
    localStorage.setItem(LS_SEEDED, '1')
    localStorage.setItem(LS_FIRM_SEEDED, '1')
  } catch {
    keys.forEach((key, i) => previous[i] === null
      ? localStorage.removeItem(key)
      : localStorage.setItem(key, previous[i]!))
    return false
  }
  treeNormalized = false
  void syncToDisk()
  window.dispatchEvent(new Event('musy:prompts-changed'))
  window.dispatchEvent(new Event('musy:data-imported'))
  return true
}

// === 文生图提示词 ===

export interface PromptItem {
  id: string
  /** 提示词正文 */
  text: string
  /** 标签（效果分类 / 项目分类等都作为标签，可多选） */
  tags: string[]
  /** 效果预览图（data URI 或空） */
  image?: string
  /** 备注 / 模型参数（如采样器、尺寸、CFG 等） */
  note?: string
  /** 母提示词 id（AI 改写另存时挂到原提示词下；空为主提示词） */
  parentId?: string
  ts: number
}

const LS_PROMPTS = 'musy.prompts'
const LS_PROMPT_EXAMPLES = 'musy.promptExamplesV1'

/** Only initialize an untouched library. Deleted demos and imported empty libraries stay empty. */
export function seedPromptExamples(): void {
  if (localStorage.getItem(LS_PROMPT_EXAMPLES)) return
  if (localStorage.getItem(LS_PROMPTS) !== null) {
    writeLS(LS_PROMPT_EXAMPLES, '1')
    return
  }
  if (writeLS(LS_PROMPTS, JSON.stringify(PROMPT_EXAMPLES))) {
    writeLS(LS_PROMPT_EXAMPLES, '1')
    void syncToDisk()
  }
}

/** 是否已完成层级修正（每次启动只做一次） */
let treeNormalized = false

/**
 * 层级修正：提示词只允许两层（母提示词 → 子提示词）。
 * 历史数据里若已出现"子提示词的子提示词"，统一上提到最上层的母提示词下。
 */
function normalizeTree(items: PromptItem[]): boolean {
  const byId = new Map(items.map((x) => [x.id, x]))
  let changed = false
  for (const p of items) {
    if (!p.parentId) continue
    // 沿 parentId 一路向上找到最顶层，避免多层嵌套残留
    let top = byId.get(p.parentId)
    if (!top) {
      p.parentId = undefined // 母提示词已不存在 → 提升为主提示词
      changed = true
      continue
    }
    let guard = 0
    while (top?.parentId && guard++ < items.length) {
      const up = byId.get(top.parentId)
      if (!up || up === top) break
      top = up
    }
    if (top && top.id !== p.parentId) {
      p.parentId = top.id
      changed = true
    }
  }
  return changed
}

export function getPrompts(): PromptItem[] {
  const items = readLS<PromptItem[]>(LS_PROMPTS, [])
  if (treeNormalized) return items
  treeNormalized = true
  if (normalizeTree(items)) {
    writeLS(LS_PROMPTS, JSON.stringify(items))
    void syncToDisk()
  }
  return items
}

function setPrompts(items: PromptItem[]): boolean {
  // 写入失败（配额满）时不刷新列表：界面会保持原样，避免出现"数据其实没存进去"的假象
  if (!writeLS(LS_PROMPTS, JSON.stringify(items))) return false
  void syncToDisk()
  // 通知其他组件（如 L4 提示词工作区）数据已变化
  window.dispatchEvent(new Event('musy:prompts-changed'))
  return true
}

/** 添加提示词；返回新 id */
export function addPrompt(p: {
  text: string
  tags: string[]
  image?: string
  note?: string
  parentId?: string
}): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const items = getPrompts()
  // 层级限制：只允许两层（母提示词 → 子提示词）。
  // 若传入的 parent 本身就是子提示词，则上提到它的母提示词，杜绝"子提示词的子提示词"
  let parentId = p.parentId
  if (parentId) {
    const parent = items.find((x) => x.id === parentId)
    if (!parent) parentId = undefined // 母提示词已丢失 → 存为主提示词，避免孤儿数据
    else if (parent.parentId) parentId = parent.parentId
  }
  items.unshift({
    id,
    text: p.text,
    tags: p.tags,
    image: p.image,
    note: p.note,
    parentId,
    ts: Date.now()
  })
  // 写入失败时返回空 id，调用方可据此提示用户（成功时一定是非空 id）
  return setPrompts(items) ? id : ''
}

/** 一次写入多条导入结果，避免中途配额失败造成只导入一部分。 */
export function addPromptsBatch(entries: Pick<PromptItem, 'text' | 'tags' | 'image' | 'note'>[]): boolean {
  if (!entries.length) return false
  const now = Date.now()
  const imported = entries.map((entry, index): PromptItem => ({
    id: `${now}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    text: entry.text,
    tags: entry.tags,
    image: entry.image,
    note: entry.note,
    ts: now + index
  }))
  return setPrompts([...imported, ...getPrompts()])
}

/** 删除提示词（级联删除其子提示词） */
export function removePrompt(id: string): void {
  const items = getPrompts()
  const doomed = new Set<string>([id])
  // 逐层收集后代（子提示词的子提示词等）
  let grew = true
  while (grew) {
    grew = false
    for (const p of items) {
      if (p.parentId && doomed.has(p.parentId) && !doomed.has(p.id)) {
        doomed.add(p.id)
        grew = true
      }
    }
  }
  setPrompts(items.filter((p) => !doomed.has(p.id)))
}

export function updatePrompt(
  id: string,
  patch: Partial<Pick<PromptItem, 'text' | 'tags' | 'image' | 'note'>>
): void {
  setPrompts(getPrompts().map((p) => (p.id === id ? { ...p, ...patch } : p)))
}

/** 获取所有已用标签（按使用次数排序，方便筛选） */
export function getAllPromptTags(): string[] {
  const count = new Map<string, number>()
  for (const p of getPrompts()) {
    for (const t of p.tags) count.set(t, (count.get(t) ?? 0) + 1)
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t)
}
