/**
 * 轻量 i18n：内置中文 / 英语 / 日语，支持加载本地语言包（JSON）。
 * 通过一个全局订阅机制让切换语言时所有用到文案的组件自动重渲染。
 */
import { useSyncExternalStore } from 'react'

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
    'nav.links': '链接',
    'nav.prompts': '提示词',
    'nav.shortcuts': '快捷键',
    'nav.polish': '润色',
    'nav.models': '模型库',
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
    // 链接模块
    'links.title': '链接',
    'links.collect': '收藏剪贴板',
    'links.collectHint': '把剪贴板里的链接收藏进来',
    'links.organize': '整理收藏',
    'links.newGroup': '新建分组',
    'links.addGroup': '添加分组',
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
    // 空状态（各模块）
    'empty.links.title': '空空如也～',
    'empty.links.desc': '收藏常用链接，点一下就能打开',
    'empty.links.hint': 'Ctrl + N 快速新增',
    'empty.prompts.title': '还没有提示词哦',
    'empty.prompts.desc': '收藏第一条灵感，下次直接复用',
    'empty.prompts.hint': '支持效果图预览',
    'empty.shortcuts.title': '快捷键指引待整理',
    'empty.shortcuts.desc': 'Rhino / SU / CAD 常用命令会出现在这里',
    'empty.shortcuts.hint': '也可以添加自己的',
    'empty.polish.title': '我来帮你润色 ✨',
    'empty.polish.desc': '选中任意文字，一键润色得更专业',
    'empty.polish.hint': '点右上角 ⚙ 配置模型和 Key',
    'empty.models.title': '模型库空着呢',
    'empty.models.desc': '把你的模型和素材都装进来吧！',
    'empty.models.hint': '支持分类整理',
    // 设置面板
    'settings.title': '设置',
    'settings.model': '模型配置',
    'settings.path': '数据路径',
    'settings.language': '语言',
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
    'path.desc': '设置后，所有收藏数据都会自动保存为该文件夹下的 musy-data.json，方便备份和多设备迁移。',
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
    'nav.links': 'Links',
    'nav.prompts': 'Prompts',
    'nav.shortcuts': 'Shortcuts',
    'nav.polish': 'Polish',
    'nav.models': 'Models',
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
    // 链接模块
    'links.title': 'Links',
    'links.collect': 'Collect Clipboard',
    'links.collectHint': 'Save the link in your clipboard',
    'links.organize': 'Organize',
    'links.newGroup': 'New group',
    'links.addGroup': 'Add group',
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
    'empty.polish.hint': 'Click ⚙ to configure model and key',
    'empty.models.title': 'Model library is empty',
    'empty.models.desc': 'Bring in your models and assets!',
    'empty.models.hint': 'Organize by category',
    // 设置面板
    'settings.title': 'Settings',
    'settings.model': 'Model',
    'settings.path': 'Data path',
    'settings.language': 'Language',
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
    'path.desc': 'After setting, all saved data will be written to musy-data.json in this folder, for backup and multi-device migration.',
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
    'nav.links': 'リンク',
    'nav.prompts': 'プロンプト',
    'nav.shortcuts': 'ショートカット',
    'nav.polish': 'リライト',
    'nav.models': 'モデル',
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
    // 链接模块
    'links.title': 'リンク',
    'links.collect': 'クリップボード',
    'links.collectHint': 'クリップボードのリンクを保存',
    'links.organize': '整理',
    'links.newGroup': '新規グループ',
    'links.addGroup': 'グループ追加',
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
    'empty.polish.hint': '⚙ からモデルとキーを設定',
    'empty.models.title': 'モデルライブラリは空です',
    'empty.models.desc': 'モデルと素材を持ってきましょう！',
    'empty.models.hint': 'カテゴリで整理',
    // 设置面板
    'settings.title': '設定',
    'settings.model': 'モデル',
    'settings.path': 'データ保存先',
    'settings.language': '言語',
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
    'path.desc': '設定後、すべての保存データはこのフォルダの musy-data.json に書き込まれ、バックアップや複数デバイス移行が容易になります。',
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
    if (raw) return JSON.parse(raw) as Record<string, string>
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
  if (customDict[key]) return customDict[key]
  return DICT[currentLang][key] ?? DICT.zh[key] ?? key
}

export function setLang(lang: LangKey): void {
  currentLang = lang
  localStorage.setItem(LS_LANG, lang)
  subs.forEach((fn) => fn())
}

/** 加载本地语言包：把 JSON 文件内容（Record<string,string>）设为自定义字典 */
export function loadCustomLang(json: string): boolean {
  try {
    const obj = JSON.parse(json) as Record<string, string>
    if (!obj || typeof obj !== 'object') return false
    customDict = obj
    localStorage.setItem(LS_CUSTOM, json)
    subs.forEach((fn) => fn())
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
  localStorage.removeItem(LS_CUSTOM)
  subs.forEach((fn) => fn())
}

/** React hook：订阅语言变化，返回当前语言标识用于触发重渲染 */
export function useLang(): LangKey {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => {
        subs.delete(cb)
      }
    },
    () => currentLang
  )
}
