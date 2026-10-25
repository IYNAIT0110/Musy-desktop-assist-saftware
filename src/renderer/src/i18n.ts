/**
 * 轻量 i18n：内置中文 / 英语 / 日语，支持加载本地语言包（JSON）。
 * 通过一个全局订阅机制让切换语言时所有用到文案的组件自动重渲染。
 */
import { useSyncExternalStore } from 'react'
import { translateMessage, validLocale, type MessageValues } from '../../shared/uiMessages'

export type LangKey = 'zh' | 'en' | 'ja'

const LS_LANG = 'musy.lang'
const LS_CUSTOM = 'musy.lang.custom' // 自定义语言包 JSON 原文

export const LANGS: { id: LangKey; name: string; native: string }[] = [
  { id: 'zh', name: 'Chinese', native: '中文' },
  { id: 'en', name: 'English', native: 'English' },
  { id: 'ja', name: 'Japanese', native: '日本語' }
]

// 内置字典：覆盖全部界面文案
const DICT: Record<LangKey, Record<string, string>> = {
  zh: {
    // 导航
    'nav.links': '传送门',
    'nav.prompts': '卷轴',
    'nav.shortcuts': '秘籍',
    'nav.polish': '点睛笔',
    'nav.models': '百宝匣',
    'nav.linksHint': '传送门 · 收藏与打开网站',
    'nav.promptsHint': '卷轴 · 收藏与改写提示词',
    'nav.shortcutsHint': '秘籍 · 查阅软件快捷键',
    'nav.polishHint': '点睛笔 · 文字润色',
    'nav.modelsHint': '百宝匣 · 整理模型与素材',
    'nav.settings': '设置',
    // 悬浮球 / 标题栏按钮
    'float.clickCollapse': '点击收起',
    'float.clickExpand': '点击展开',
    'float.minimize': '最小化到任务栏',
    'float.quit': '退出 Musy',
    'kb.back': '返回',
    'kb.count': '条快捷键',
    'kb.matched': '条匹配',
    'kb.noMatchPrefix': '没有匹配「',
    'kb.noMatchSuffix': '」的快捷键',
    'kb.itemCount': '条',
    'float.collapsePanel': '收起面板',
    'float.expandPanel': '展开面板',
    'float.linkQuestion': '咦，发现一个新链接，要我收好它吗？',
    'float.linkSave': '帮我收藏',
    'float.linkSkip': '先不用',
    'float.linkSaved': '收好啦 ✓',
    // 链接模块
    'links.title': '传送门',
    'links.collect': '收藏剪贴板',
    'links.collectHint': '把剪贴板里的链接收藏进来',
    'links.organize': '整理收藏',
    'links.newGroup': '新建分组',
    'links.addGroup': '添加分组',
    'links.dragGroup': '长按后拖动，可调整分组顺序',
    'links.all': '全部',
    'links.default': '默认',
    'links.moveTo': '移动到分组',
    'links.delete': '删除',
    'links.deleteHint': '删除（链接移入默认）',
    'links.rename': '重命名',
    'links.confirmDelete': '删除？',
    'links.confirm': '确认',
    'links.cancel': '取消',
    'links.emptyTitle': '空空如也～',
    'links.emptyDesc': '收藏常用链接，点一下就能打开',
    'links.searchPlaceholder': '搜索…',
    'links.searching': '正在找相关的内容…',
    'links.searchingDesc': '输入关键词，我来帮你翻一翻',
    'links.noResultPrefix': '没有找到「',
    'links.noResultSuffix': '」相关的链接',
    'links.noLinks': '还没有链接',
    'links.noLinksHint': '复制一个链接，点左侧「收藏剪贴板」试试～',
    'links.movedTo': '已移动到「',
    'links.clipboardFail': '读取剪贴板失败',

    'links.renamedTo': '已重命名为「',
    'links.renameInvalid': '名称无效或已存在',
    'links.deletedTo': '已删除，链接移入默认',
    'links.add.clipboardEmpty': '剪贴板是空的～',
    'links.add.invalid': '这不是一个有效的链接呢',
    'links.add.notHttp': '只支持 http/https 链接',
    'links.add.duplicate': '这个链接已经收藏过啦',
    'links.add.success': '收藏成功 ✓',
    'links.add.storageFail': '保存失败，请检查本地存储空间',
    // 空状态（各模块）
    'empty.links.title': '空空如也～',
    'empty.links.desc': '收藏常用链接，点一下就能打开',
    'empty.links.hint': 'Ctrl + N 快速新增',
    'empty.prompts.title': '卷轴还空着呢',
    'empty.prompts.desc': '收藏第一条灵感，下次直接复用',
    'empty.prompts.hint': '支持效果图预览',
    'empty.shortcuts.title': '秘籍正在整理中',
    'empty.shortcuts.desc': 'Rhino / SU / CAD 常用命令会出现在这里',
    'empty.shortcuts.hint': '也可以添加自己的',
    'empty.polish.title': '让点睛笔帮你润色 ✨',
    'empty.polish.desc': '选中任意文字，一键润色得更专业',
    'empty.polish.hint': '打开右上角设置，配置模型和 Key',
    'empty.models.title': '百宝匣还空着呢',
    'empty.models.desc': '把你的模型和素材都装进来吧！',
    'empty.models.hint': '支持分类整理',
    // 设置面板
    'settings.title': '设置',
    'settings.model': '模型配置',
    'settings.path': '数据路径',
    'settings.language': '语言',
    'settings.interaction': '交互',
    'settings.appearance': '外观',
    'settings.themeTitle': '整体配色',
    'settings.themeDesc': '选择后立即改变界面、悬浮球和提示气泡；下次启动会保持。',
    'settings.theme.graphite': '石墨',
    'settings.theme.ocean': '海蓝',
    'settings.theme.forest': '森绿',
    'settings.theme.plum': '暮紫',
    'settings.theme.apricot': '暖杏',
    'settings.theme.rose': '玫瑰',
    'settings.theme.indigo': '靛蓝',
    'settings.theme.teal': '青瓷',
    'settings.theme.clay': '陶土',
    'settings.theme.latte': '拿铁',
    'settings.theme.ice': '冰川',
    'settings.theme.olive': '橄榄',
    'appearance.live': '配色与质感自由搭配，即时生效',
    'appearance.materialTitle': '表面质感',
    'appearance.materialDesc': '调整面板、小球与卡片的表面效果，文字和图片保持清晰。',
    'appearance.material.smooth': '经典哑光',
    'appearance.material.smoothDesc': '干净、平整，保留原有外观',
    'appearance.material.glass': '毛玻璃',
    'appearance.material.glassDesc': '半透明层次与柔和透光',
    'appearance.material.kraft': '牛皮纸',
    'appearance.material.kraftDesc': '细碎纸纹，带一点温暖的纤维',
    'appearance.material.plush': '毛茸茸',
    'appearance.material.plushDesc': '柔软绒毛与蓬松的边缘光影',
    'appearance.material.linen': '亚麻织物',
    'appearance.material.linenDesc': '细密经纬，安静的布面触感',
    'appearance.material.ceramic': '温润陶瓷',
    'appearance.material.ceramicDesc': '柔亮釉面与圆润的高光',
    'appearance.strength': '质感强度',
    'appearance.chooseMaterial': '选择毛玻璃、纸张或织物等材质后可调节',
    'appearance.reset': '恢复默认外观',
    'settings.clipboardPrompt': '复制网址时提醒收藏',
    'settings.clipboardPromptDesc': '小球会轻声问一句；已收藏的链接不会重复提醒。',
    'settings.close': '关闭',
    'settings.builtinLang': '内置语言',
    'settings.customLang': '自定义语言包',
    'settings.customLangDesc': '加载本地 JSON 语言包（格式为 {"键": "译文"}），会覆盖内置文案。',
    'settings.customLangLoaded': ' 当前已加载自定义语言包。',
    'settings.chooseLangFile': '选择语言包文件',
    'settings.clear': '清除',
    'settings.langLoaded': '语言包已加载',
    'settings.langLoadFail': '加载失败：不是有效的 JSON 语言包',
    'settings.langCleared': '已清除自定义语言包',
    // 模型配置
    'model.provider': '模型服务商',
    'model.baseUrl': '接口地址（OpenAI 兼容）',
    'model.apiKey': 'API Key',
    'model.model': '模型',
    'model.orManual': '或手动输入模型名',
    'model.customPlaceholder': '或输入自定义模型名',
    'model.modelPlaceholder': '模型名称，如 gpt-4o-mini',
    'model.save': '保存配置',
    'model.saved': '已保存 ✓',
    'model.hide': '隐藏',
    'model.show': '显示',
    // 数据路径
    'path.title': '数据保存位置',
    'path.desc': '此处备份传送门、分组和卷轴数据，写入 musy-data.json。百宝匣使用独立资料库，请在百宝匣的「管理资料库」中备份索引与封面；引用原件需另外保管。',
    'path.label': '保存文件夹路径',
    'path.placeholder': '例如 D:\\Musy\\data 或留空（仅保存在本机）',
    'path.browse': '浏览',
    'path.current': '当前：',
    'path.save': '保存',
    'path.saved': '已保存 ✓',
    'path.import': '从 musy-data.json 恢复',
    'path.importConfirm': '导入备份会替换当前链接、分组和提示词。确定继续吗？',
    'path.importError': '导入失败：文件格式不正确或本地存储空间不足。',
    // 提示词模块
    'prompts.all': '全部',
    'prompts.add': '新增',
    'prompts.addFirst': '+ 收藏第一条提示词',
    'prompts.empty': '还没有提示词，点右上角「新增」收藏第一条',
    'prompts.noResult': '没有找到相关提示词',
    'prompts.saved': '已保存 ✓',
    'prompts.deleted': '已删除',
    'prompts.image': '效果预览图',
    'prompts.changeImage': '选择图片',
    'prompts.pasteImage': '点击粘贴/选择效果图',
    'prompts.removeImage': '移除图片',
    'prompts.text': '提示词正文',
    'prompts.textPlaceholder': '输入文生图提示词，例如：modern minimalist house, white concrete…',
    'prompts.tags': '标签（效果 / 项目分类）',
    'prompts.tagsPlaceholder': '输入标签后回车，如：建筑 写实 项目A',
    'prompts.addTag': '添加',
    'prompts.existingTags': '选择已有标签',
    'prompts.importFile': '导入文件',
    'prompts.importing': 'AI 识别中…',
    'prompts.importPreview': '导入预览',
    'prompts.importSelected': '导入选中',
    'prompts.imported': '已导入',
    'prompts.importFailed': '导入失败',
    'prompts.cancel': '取消',
    'prompts.note': '备注（模型 / 参数）',
    'prompts.notePlaceholder': '如：SDXL, 1024x1024, CFG 7',
    'prompts.save': '保存',
    'prompts.edit': '编辑',
    'prompts.detail': '提示词详情',
    'prompts.delete': '删除',
    'prompts.copy': '复制',
    'prompts.copied': '已复制 ✓',
    'prompts.rewrite': 'AI 改写复用',
    'prompts.run': '生成',
    'prompts.rewriting': '生成中…',
    'prompts.expand': '扩写',
    'prompts.translate': '翻译',
    'prompts.storageFull': '本地存储空间已满，请删除一些带图的提示词',
    'prompts.saveAsNew': '另存为新提示词',
    'prompts.savedAsNew': '已另存为新提示词 ✓',
    'prompts.saveAsChild': '保存为子提示词',
    'prompts.savedAsChild': '已保存为子提示词 ✓',
    'prompts.children': '子提示词',
    'prompts.siblings': '同级子提示词',
    'prompts.openParent': '查看母提示词',
    'prompts.close': '关闭工作区',
    'prompts.noKey': '请先在设置里配置 API Key',
    'prompts.rewriteFailed': '改写失败，请检查模型配置'
  },
  en: {
    // 导航
    'nav.links': 'Portal',
    'nav.prompts': 'Scroll',
    'nav.shortcuts': 'Codex',
    'nav.polish': 'Magic Pen',
    'nav.models': 'Treasure Box',
    'nav.linksHint': 'Portal · Save and open websites',
    'nav.promptsHint': 'Scroll · Collect and rewrite prompts',
    'nav.shortcutsHint': 'Codex · Software shortcut guide',
    'nav.polishHint': 'Magic Pen · Polish your writing',
    'nav.modelsHint': 'Treasure Box · Organize models and assets',
    'nav.settings': 'Settings',
    // 悬浮球 / 标题栏按钮
    'float.clickCollapse': 'Click to collapse',
    'float.clickExpand': 'Click to expand',
    'float.minimize': 'Minimize to taskbar',
    'float.quit': 'Quit Musy',
    'kb.back': 'Back',
    'kb.count': 'shortcuts',
    'kb.matched': 'matched',
    'kb.noMatchPrefix': 'No shortcut matches “',
    'kb.noMatchSuffix': '”',
    'kb.itemCount': 'items',
    'float.collapsePanel': 'Collapse panel',
    'float.expandPanel': 'Expand panel',
    'float.linkQuestion': 'A new link! Shall I save it for you?',
    'float.linkSave': 'Save link',
    'float.linkSkip': 'Not now',
    'float.linkSaved': 'Saved ✓',
    // 链接模块
    'links.title': 'Portal',
    'links.collect': 'Collect Clipboard',
    'links.collectHint': 'Save the link in your clipboard',
    'links.organize': 'Organize',
    'links.newGroup': 'New group',
    'links.addGroup': 'Add group',
    'links.dragGroup': 'Press and hold, then drag to reorder groups',
    'links.all': 'All',
    'links.default': 'Default',
    'links.moveTo': 'Move to group',
    'links.delete': 'Delete',
    'links.deleteHint': 'Delete (move links to Default)',
    'links.rename': 'Rename',
    'links.confirmDelete': 'Delete?',
    'links.confirm': 'Confirm',
    'links.cancel': 'Cancel',
    'links.emptyTitle': 'Empty for now',
    'links.emptyDesc': 'Save a link and open it in one click',
    'links.searchPlaceholder': 'Search…',
    'links.searching': 'Searching for related content…',
    'links.searchingDesc': 'Type keywords and I will find it for you',
    'links.noResultPrefix': 'No links found for',
    'links.noResultSuffix': '',
    'links.noLinks': 'No links yet',
    'links.noLinksHint': 'Copy a link and click "Collect Clipboard"',
    'links.movedTo': 'Moved to',
    'links.clipboardFail': 'Failed to read clipboard',
    'links.renamedTo': 'Renamed to',
    'links.renameInvalid': 'Name is invalid or already exists',
    'links.deletedTo': 'Deleted, links moved to Default',
    'links.add.clipboardEmpty': 'Clipboard is empty',
    'links.add.invalid': 'This is not a valid link',
    'links.add.notHttp': 'Only http/https links are supported',
    'links.add.duplicate': 'This link is already saved',
    'links.add.success': 'Saved ✓',
    'links.add.storageFail': 'Could not save. Check local storage space.',
    // 空状态（各模块）
    'empty.links.title': 'Empty for now',
    'empty.links.desc': 'Save a link and open it in one click',
    'empty.links.hint': 'Ctrl + N to add',
    'empty.prompts.title': 'No prompts yet',
    'empty.prompts.desc': 'Save your first inspiration to reuse',
    'empty.prompts.hint': 'Preview images supported',
    'empty.shortcuts.title': 'Shortcut guide coming',
    'empty.shortcuts.desc': 'Rhino / SU / CAD commands will appear here',
    'empty.shortcuts.hint': 'You can also add your own',
    'empty.polish.title': 'Let me polish ✨',
    'empty.polish.desc': 'Select any text and polish it in one click',
    'empty.polish.hint': 'Open Settings to configure model and key',
    'empty.models.title': 'Model library is empty',
    'empty.models.desc': 'Bring in your models and assets!',
    'empty.models.hint': 'Organize by category',
    // 设置面板
    'settings.title': 'Settings',
    'settings.model': 'Model',
    'settings.path': 'Data path',
    'settings.language': 'Language',
    'settings.interaction': 'Interaction',
    'settings.appearance': 'Appearance',
    'settings.themeTitle': 'Color theme',
    'settings.themeDesc': 'Updates the interface, mascot and bubbles instantly. Your choice is saved.',
    'settings.theme.graphite': 'Graphite',
    'settings.theme.ocean': 'Ocean',
    'settings.theme.forest': 'Forest',
    'settings.theme.plum': 'Plum',
    'settings.theme.apricot': 'Apricot',
    'settings.theme.rose': 'Rose',
    'settings.theme.indigo': 'Indigo',
    'settings.theme.teal': 'Teal',
    'settings.theme.clay': 'Clay',
    'settings.theme.latte': 'Latte',
    'settings.theme.ice': 'Glacier',
    'settings.theme.olive': 'Olive',
    'appearance.live': 'Mix colors and materials. Changes apply instantly.',
    'appearance.materialTitle': 'Surface material',
    'appearance.materialDesc': 'Style panels, Musy and cards while keeping text and images clear.',
    'appearance.material.smooth': 'Classic matte',
    'appearance.material.smoothDesc': 'Clean, flat and familiar',
    'appearance.material.glass': 'Frosted glass',
    'appearance.material.glassDesc': 'Translucent layers and soft light',
    'appearance.material.kraft': 'Kraft paper',
    'appearance.material.kraftDesc': 'Fine paper grain and warm fibers',
    'appearance.material.plush': 'Fluffy plush',
    'appearance.material.plushDesc': 'Soft fibers and cushioned shading',
    'appearance.material.linen': 'Linen',
    'appearance.material.linenDesc': 'A quiet, fine woven texture',
    'appearance.material.ceramic': 'Glazed ceramic',
    'appearance.material.ceramicDesc': 'Smooth glaze and rounded highlights',
    'appearance.strength': 'Material intensity',
    'appearance.chooseMaterial': 'Choose glass, paper or another material to adjust intensity',
    'appearance.reset': 'Reset appearance',
    'settings.clipboardPrompt': 'Suggest saving copied links',
    'settings.clipboardPromptDesc': 'Musy asks quietly when you copy a new link; saved links are ignored.',
    'settings.close': 'Close',
    'settings.builtinLang': 'Built-in languages',
    'settings.customLang': 'Custom language pack',
    'settings.customLangDesc': 'Load a local JSON language pack (format {"key": "translation"}) to override built-in text.',
    'settings.customLangLoaded': ' A custom language pack is currently loaded.',
    'settings.chooseLangFile': 'Choose language file',
    'settings.clear': 'Clear',
    'settings.langLoaded': 'Language pack loaded',
    'settings.langLoadFail': 'Load failed: not a valid JSON language pack',
    'settings.langCleared': 'Custom language pack cleared',
    // 模型配置
    'model.provider': 'Provider',
    'model.baseUrl': 'API base (OpenAI-compatible)',
    'model.apiKey': 'API Key',
    'model.model': 'Model',
    'model.orManual': 'or type a model name',
    'model.customPlaceholder': 'or enter a custom model name',
    'model.modelPlaceholder': 'Model name, e.g. gpt-4o-mini',
    'model.save': 'Save',
    'model.saved': 'Saved ✓',
    'model.hide': 'Hide',
    'model.show': 'Show',
    // 数据路径
    'path.title': 'Data location',
    'path.desc': 'This saves links, groups and prompts to musy-data.json. Treasure Box has a separate library: back up its index and covers in Manage Library, and keep referenced originals separately.',
    'path.label': 'Save folder path',
    'path.placeholder': 'e.g. D:\\Musy\\data or leave empty (local only)',
    'path.browse': 'Browse',
    'path.current': 'Current:',
    'path.save': 'Save',
    'path.saved': 'Saved ✓',
    'path.import': 'Restore from musy-data.json',
    'path.importConfirm': 'This replaces current links, groups and prompts. Continue?',
    'path.importError': 'Import failed: invalid backup or insufficient local storage.',
    // 提示词模块
    'prompts.all': 'All',
    'prompts.add': 'Add',
    'prompts.addFirst': '+ Save your first prompt',
    'prompts.empty': 'No prompts yet. Click "Add" to save your first one',
    'prompts.noResult': 'No matching prompts found',
    'prompts.saved': 'Saved ✓',
    'prompts.deleted': 'Deleted',
    'prompts.image': 'Preview image',
    'prompts.changeImage': 'Choose image',
    'prompts.pasteImage': 'Click to paste / choose an image',
    'prompts.removeImage': 'Remove image',
    'prompts.text': 'Prompt text',
    'prompts.textPlaceholder': 'Enter a text-to-image prompt, e.g. modern minimalist house, white concrete…',
    'prompts.tags': 'Tags (effect / project)',
    'prompts.tagsPlaceholder': 'Type a tag and press Enter, e.g. architecture realistic projectA',
    'prompts.addTag': 'Add',
    'prompts.existingTags': 'Existing tags',
    'prompts.importFile': 'Import file',
    'prompts.importing': 'AI analyzing…',
    'prompts.importPreview': 'Import preview',
    'prompts.importSelected': 'Import selected',
    'prompts.imported': 'Imported',
    'prompts.importFailed': 'Import failed',
    'prompts.cancel': 'Cancel',
    'prompts.note': 'Note (model / params)',
    'prompts.notePlaceholder': 'e.g. SDXL, 1024x1024, CFG 7',
    'prompts.save': 'Save',
    'prompts.edit': 'Edit',
    'prompts.detail': 'Prompt detail',
    'prompts.delete': 'Delete',
    'prompts.copy': 'Copy',
    'prompts.copied': 'Copied ✓',
    'prompts.rewrite': 'AI rewrite & reuse',
    'prompts.run': 'Generate',
    'prompts.rewriting': 'Generating…',
    'prompts.expand': 'Expand',
    'prompts.translate': 'Translate',
    'prompts.storageFull': 'Local storage is full — please delete some prompts with images',
    'prompts.saveAsNew': 'Save as new prompt',
    'prompts.savedAsNew': 'Saved as new prompt ✓',
    'prompts.saveAsChild': 'Save as child prompt',
    'prompts.savedAsChild': 'Saved as child prompt ✓',
    'prompts.children': 'Child prompts',
    'prompts.siblings': 'Sibling prompts',
    'prompts.openParent': 'Open parent prompt',
    'prompts.close': 'Close workspace',
    'prompts.noKey': 'Please configure your API Key in Settings first',
    'prompts.rewriteFailed': 'Rewrite failed, please check model settings'
  },
  ja: {
    // 导航
    'nav.links': 'ポータル',
    'nav.prompts': '巻物',
    'nav.shortcuts': '秘伝書',
    'nav.polish': '魔法のペン',
    'nav.models': '宝箱',
    'nav.linksHint': 'ポータル · Webサイトを保存して開く',
    'nav.promptsHint': '巻物 · プロンプトを保存・書き換え',
    'nav.shortcutsHint': '秘伝書 · ソフトのショートカット集',
    'nav.polishHint': '魔法のペン · 文章を磨く',
    'nav.modelsHint': '宝箱 · モデルと素材を整理',
    'nav.settings': '設定',
    // 悬浮球 / 标题栏按钮
    'float.clickCollapse': 'クリックで閉じる',
    'float.clickExpand': 'クリックで開く',
    'float.minimize': 'タスクバーに最小化',
    'float.quit': 'Musy を終了',
    'kb.back': '戻る',
    'kb.count': '件のショートカット',
    'kb.matched': '件一致',
    'kb.noMatchPrefix': '「',
    'kb.noMatchSuffix': '」に一致するショートカットはありません',
    'kb.itemCount': '件',
    'float.collapsePanel': 'パネルを閉じる',
    'float.expandPanel': 'パネルを開く',
    'float.linkQuestion': '新しいリンクですね。保存しましょうか？',
    'float.linkSave': '保存する',
    'float.linkSkip': '今はしない',
    'float.linkSaved': '保存しました ✓',
    // 链接模块
    'links.title': 'ポータル',
    'links.collect': 'クリップボード',
    'links.collectHint': 'クリップボードのリンクを保存',
    'links.organize': '整理',
    'links.newGroup': '新規グループ',
    'links.addGroup': 'グループ追加',
    'links.dragGroup': '長押ししてドラッグすると並べ替えできます',
    'links.all': 'すべて',
    'links.default': 'デフォルト',
    'links.moveTo': 'グループへ移動',
    'links.delete': '削除',
    'links.deleteHint': '削除（リンクはデフォルトへ移動）',
    'links.rename': '名前を変更',
    'links.confirmDelete': '削除しますか？',
    'links.confirm': '確認',
    'links.cancel': 'キャンセル',
    'links.emptyTitle': 'まだ何もありません',
    'links.emptyDesc': 'リンクを保存してワンクリックで開けます',
    'links.searchPlaceholder': '検索…',
    'links.searching': '関連コンテンツを検索中…',
    'links.searchingDesc': 'キーワードを入力してください',
    'links.noResultPrefix': '「',
    'links.noResultSuffix': '」に関連するリンクが見つかりません',
    'links.noLinks': 'リンクがまだありません',
    'links.noLinksHint': 'リンクをコピーして「クリップボードを保存」をクリック',
    'links.movedTo': '「',
    'links.clipboardFail': 'クリップボードの読み取りに失敗しました',
    'links.renamedTo': '「',
    'links.renameInvalid': '名前が無効か既に存在します',
    'links.deletedTo': '削除しました、リンクはデフォルトへ移動',
    'links.add.clipboardEmpty': 'クリップボードは空です',
    'links.add.invalid': '有効なリンクではありません',
    'links.add.notHttp': 'http/https リンクのみ対応しています',
    'links.add.duplicate': 'このリンクは既に保存済みです',
    'links.add.success': '保存しました ✓',
    'links.add.storageFail': '保存できません。空き容量を確認してください',
    // 空状态（各模块）
    'empty.links.title': 'まだ何もありません',
    'empty.links.desc': 'リンクを保存してワンクリックで開けます',
    'empty.links.hint': 'Ctrl + N で追加',
    'empty.prompts.title': 'プロンプトがありません',
    'empty.prompts.desc': '最初のインスピレーションを保存して再利用',
    'empty.prompts.hint': '効果画像プレビュー対応',
    'empty.shortcuts.title': 'ショートカット準備中',
    'empty.shortcuts.desc': 'Rhino / SU / CAD のコマンドがここに表示されます',
    'empty.shortcuts.hint': '自分でも追加できます',
    'empty.polish.title': 'リライトします ✨',
    'empty.polish.desc': 'テキストを選択してワンクリックでリライト',
    'empty.polish.hint': '設定からモデルとキーを設定',
    'empty.models.title': 'モデルライブラリは空です',
    'empty.models.desc': 'モデルと素材を持ってきましょう！',
    'empty.models.hint': 'カテゴリで整理',
    // 设置面板
    'settings.title': '設定',
    'settings.model': 'モデル',
    'settings.path': 'データ保存先',
    'settings.language': '言語',
    'settings.interaction': '操作',
    'settings.appearance': '外観',
    'settings.themeTitle': 'カラーテーマ',
    'settings.themeDesc': '画面・マスコット・吹き出しをすぐに変更し、次回も保持します。',
    'settings.theme.graphite': 'グラファイト',
    'settings.theme.ocean': 'オーシャン',
    'settings.theme.forest': 'フォレスト',
    'settings.theme.plum': 'プラム',
    'settings.theme.apricot': 'アプリコット',
    'settings.theme.rose': 'ローズ',
    'settings.theme.indigo': 'インディゴ',
    'settings.theme.teal': '青磁',
    'settings.theme.clay': 'テラコッタ',
    'settings.theme.latte': 'ラテ',
    'settings.theme.ice': '氷河',
    'settings.theme.olive': 'オリーブ',
    'appearance.live': '配色と質感を自由に組み合わせ、すぐに反映',
    'appearance.materialTitle': '表面の質感',
    'appearance.materialDesc': '文字と画像の見やすさを保ち、パネルやマスコットの質感を変えます。',
    'appearance.material.smooth': 'クラシックマット',
    'appearance.material.smoothDesc': 'すっきりした従来の見た目',
    'appearance.material.glass': 'すりガラス',
    'appearance.material.glassDesc': '半透明の重なりと柔らかな光',
    'appearance.material.kraft': 'クラフト紙',
    'appearance.material.kraftDesc': '細かな紙目と温かな繊維',
    'appearance.material.plush': 'ふわふわ',
    'appearance.material.plushDesc': '柔らかな毛並みとふっくらした陰影',
    'appearance.material.linen': 'リネン',
    'appearance.material.linenDesc': '繊細で落ち着いた織り目',
    'appearance.material.ceramic': '陶器',
    'appearance.material.ceramicDesc': '滑らかな釉薬と丸みのある光沢',
    'appearance.strength': '質感の強さ',
    'appearance.chooseMaterial': 'ガラス・紙・布などを選ぶと強さを調整できます',
    'appearance.reset': '外観を初期設定に戻す',
    'settings.clipboardPrompt': 'コピーしたリンクの保存を提案',
    'settings.clipboardPromptDesc': '新しいリンクをコピーすると、Musy が静かに確認します。保存済みのリンクは除外します。',
    'settings.close': '閉じる',
    'settings.builtinLang': '内蔵言語',
    'settings.customLang': 'カスタム言語パック',
    'settings.customLangDesc': 'ローカル JSON 言語パック（形式 {"キー": "翻訳"}）を読み込んで内蔵テキストを上書きします。',
    'settings.customLangLoaded': ' 現在カスタム言語パックが読み込まれています。',
    'settings.chooseLangFile': '言語ファイルを選択',
    'settings.clear': 'クリア',
    'settings.langLoaded': '言語パックを読み込みました',
    'settings.langLoadFail': '読み込み失敗：有効な JSON 言語パックではありません',
    'settings.langCleared': 'カスタム言語パックをクリアしました',
    // 模型配置
    'model.provider': 'プロバイダー',
    'model.baseUrl': 'API ベース（OpenAI 互換）',
    'model.apiKey': 'API キー',
    'model.model': 'モデル',
    'model.orManual': 'またはモデル名を入力',
    'model.customPlaceholder': 'またはカスタムモデル名を入力',
    'model.modelPlaceholder': 'モデル名（例 gpt-4o-mini）',
    'model.save': '保存',
    'model.saved': '保存済み ✓',
    'model.hide': '隠す',
    'model.show': '表示',
    // 数据路径
    'path.title': 'データ保存先',
    'path.desc': 'ここではリンク・グループ・プロンプトを musy-data.json に保存します。宝箱は独立したライブラリです。管理画面で索引と表紙をバックアップし、参照元ファイルは別途保管してください。',
    'path.label': '保存フォルダのパス',
    'path.placeholder': '例 D:\\Musy\\data、空欄ならローカルのみ',
    'path.browse': '参照',
    'path.current': '現在：',
    'path.save': '保存',
    'path.saved': '保存済み ✓',
    'path.import': 'musy-data.json から復元',
    'path.importConfirm': '現在のリンク、グループ、プロンプトを置き換えます。続行しますか？',
    'path.importError': '復元に失敗しました。ファイル形式か保存容量を確認してください。',
    // 提示词模块
    'prompts.all': 'すべて',
    'prompts.add': '追加',
    'prompts.addFirst': '+ 最初のプロンプトを保存',
    'prompts.empty': 'プロンプトがありません。「追加」から保存してください',
    'prompts.noResult': '該当するプロンプトが見つかりません',
    'prompts.saved': '保存しました ✓',
    'prompts.deleted': '削除しました',
    'prompts.image': '効果プレビュー画像',
    'prompts.changeImage': '画像を選択',
    'prompts.pasteImage': 'クリックして画像を貼り付け / 選択',
    'prompts.removeImage': '画像を削除',
    'prompts.text': 'プロンプト本文',
    'prompts.textPlaceholder': '画像生成プロンプトを入力（例：modern minimalist house, white concrete…）',
    'prompts.tags': 'タグ（効果 / プロジェクト）',
    'prompts.tagsPlaceholder': 'タグを入力して Enter（例：建築 写実 プロジェクトA）',
    'prompts.addTag': '追加',
    'prompts.existingTags': '既存のタグ',
    'prompts.importFile': 'ファイルを取り込む',
    'prompts.importing': 'AI 解析中…',
    'prompts.importPreview': '取り込みプレビュー',
    'prompts.importSelected': '選択項目を取り込む',
    'prompts.imported': '取り込み完了',
    'prompts.importFailed': '取り込みに失敗',
    'prompts.cancel': 'キャンセル',
    'prompts.note': 'メモ（モデル / パラメータ）',
    'prompts.notePlaceholder': '例：SDXL, 1024x1024, CFG 7',
    'prompts.save': '保存',
    'prompts.edit': '編集',
    'prompts.detail': 'プロンプト詳細',
    'prompts.delete': '削除',
    'prompts.copy': 'コピー',
    'prompts.copied': 'コピーしました ✓',
    'prompts.rewrite': 'AI リライト再利用',
    'prompts.run': '生成',
    'prompts.rewriting': '生成中…',
    'prompts.expand': '拡張',
    'prompts.translate': '翻訳',
    'prompts.storageFull': '保存領域が一杯です。画像付きプロンプトを削除してください',
    'prompts.saveAsNew': '新しいプロンプトとして保存',
    'prompts.savedAsNew': '新しいプロンプトとして保存しました ✓',
    'prompts.saveAsChild': '子プロンプトとして保存',
    'prompts.savedAsChild': '子プロンプトとして保存しました ✓',
    'prompts.children': '子プロンプト',
    'prompts.siblings': '同階層の子プロンプト',
    'prompts.openParent': '親プロンプトを開く',
    'prompts.close': 'ワークスペースを閉じる',
    'prompts.noKey': 'まず設定で API キーを設定してください',
    'prompts.rewriteFailed': 'リライトに失敗しました。モデル設定を確認してください'
  }
}

type Subscriber = () => void
const subs = new Set<Subscriber>()

let currentLang: LangKey = 'zh'
let customDict: Record<string, string> = {}
let localeRevision = 0
let languageChannel: BroadcastChannel | null = null
let languageInitialized = false

function loadLang(): LangKey {
  try {
    const raw = localStorage.getItem(LS_LANG)
    if (raw === 'en' || raw === 'ja' || raw === 'zh') return raw
  } catch {
    /* ignore */
  }
  return 'zh'
}

function loadCustom(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_CUSTOM)
    if (raw) {
      const value = JSON.parse(raw)
      if (value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every(item => typeof item === 'string')) return value
    }
  } catch {
    /* ignore */
  }
  return {}
}

currentLang = loadLang()
customDict = loadCustom()

export function getLang(): LangKey {
  return currentLang
}

/** 取文案：自定义语言包 > 内置字典 > 兜底返回 key */
export function t(key: string): string {
  if (Object.prototype.hasOwnProperty.call(customDict, key)) return customDict[key]
  return DICT[currentLang][key] ?? DICT.zh[key] ?? key
}

/** Fixed feature copy with named parameters; never translate user-owned names. */
export function tx(source: string, values?: MessageValues): string {
  if (Object.prototype.hasOwnProperty.call(customDict, source)) {
    return customDict[source].replace(/\{(\w+)\}/g, (placeholder, name: string) => values?.[name] === undefined ? placeholder : String(values[name]))
  }
  return translateMessage(source, currentLang, values)
}

function notifyLanguage(): void {
  localeRevision++
  if (typeof document !== 'undefined') document.documentElement.lang = currentLang
  subs.forEach(fn => fn())
}

export function initLanguage(): void {
  if (languageInitialized) return
  languageInitialized = true
  if (typeof document !== 'undefined') document.documentElement.lang = currentLang
  window.addEventListener('storage', event => {
    if (event.key === null || event.key === LS_LANG || event.key === LS_CUSTOM) {
      currentLang = loadLang(); customDict = loadCustom(); notifyLanguage()
    }
  })
  if (typeof BroadcastChannel !== 'undefined') {
    languageChannel = new BroadcastChannel('musy-language')
    languageChannel.onmessage = event => {
      const value = event.data
      if (!value || typeof value !== 'object' || !['zh', 'en', 'ja'].includes(value.lang)) return
      currentLang = validLocale(value.lang)
      if (value.custom && typeof value.custom === 'object' && !Array.isArray(value.custom) && Object.values(value.custom).every(item => typeof item === 'string')) customDict = value.custom
      notifyLanguage()
    }
  }
}

function broadcastLanguage(): void { languageChannel?.postMessage({ lang: currentLang, custom: customDict }) }

export function setLang(lang: LangKey): void {
  currentLang = validLocale(lang)
  try { localStorage.setItem(LS_LANG, currentLang) } catch { /* Apply for this session. */ }
  notifyLanguage(); broadcastLanguage()
}

/** 加载本地语言包：把 JSON 文件内容（Record<string,string>）设为自定义字典 */
export function loadCustomLang(json: string): boolean {
  try {
    const obj = JSON.parse(json) as Record<string, string>
    if (!obj || typeof obj !== 'object' || Array.isArray(obj) || !Object.values(obj).every(value => typeof value === 'string')) return false
    customDict = obj
    try { localStorage.setItem(LS_CUSTOM, json) } catch { /* Apply for this session. */ }
    notifyLanguage(); broadcastLanguage()
    return true
  } catch {
    return false
  }
}

export function hasCustomLang(): boolean {
  return Object.keys(customDict).length > 0
}

export function clearCustomLang(): void {
  customDict = {}
  try { localStorage.removeItem(LS_CUSTOM) } catch { /* Apply for this session. */ }
  notifyLanguage(); broadcastLanguage()
}

/** React hook：订阅语言变化，返回当前语言标识用于触发重渲染 */
export function useLang(): LangKey {
  useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => {
        subs.delete(cb)
      }
    },
    () => localeRevision
  )
  return currentLang
}
