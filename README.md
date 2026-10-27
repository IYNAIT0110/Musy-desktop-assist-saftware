# <img src="build/icon.png" width="36" align="top" /> Musy · 桌面悬窗助手

> 开发策略已更新：公开 v0.2.0 保留，后续源码私有开发，日常修改不发布。未来公开仓库只接收经批准的软件产物和用户文档。见[开发与发布策略](docs/私有开发与公开下载.md)。

把网站、提示词和设计素材放在随手可及的地方。一个会看着光标的小球，陪你完成「收集 → 整理 → 预览 → 复用」。

[![Windows](https://img.shields.io/badge/Windows-10%20%2F%2011%20x64-0078d6)](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/latest)
[![Release](https://img.shields.io/github/v/release/IYNAIT0110/Musy-desktop-assist-saftware)](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/latest)

**[下载安装](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/latest) · [使用指南](docs/使用指南.md) · [文档目录](docs/README.md) · [更新记录](CHANGELOG.md) · [问题反馈](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/issues)**

## 七个小入口

| 入口 | 用途 | v0.2.2 状态 |
| --- | --- | --- |
| 传送门 | 收藏网站、分组、搜索、打开链接 | 可用；内置 64 个网站，复制网址时可收到收藏邀请 |
| 卷轴 | 保存提示词、预览图和母子版本 | 可用；3 条原创示例，卡牌切换、编辑、复制、可选 AI 扩写与翻译 |
| 秘籍 | SketchUp / Rhino / AutoCAD 快捷键速查 | 可用；234 条离线参考资料，支持搜索 |
| 点睛笔 | 独立文字润色入口 | 规划中；当前显示占位说明 |
| 百宝匣 | 收集、分类、预览与复用本地设计素材 | 引用原件、批量标签、剪贴板和拖放、轻预览、并排参考、拖出文件 |
| 便签 | 快速记录、待办、分类文件夹与 AI 整理 | 自动保存、文件夹预览、专注书写、自定义提示词 / Skill |
| 织梦台 | 项目管理和统一资料索引 | 多项目关联、自动收集、继续工作、类型与标签筛选、关系备份 |

不需要账号。收藏、整理和离线资料可以直接使用；打开网站、抓取图标和自行配置的 AI 服务需要网络。

## v0.2.2 更新亮点

- **便签**：新增第七个入口，普通文本 / 待办模板、自动保存、分类文件夹与最近三条内容预览。
- **专注书写**：文件夹可收为分类条，笔记列表显示摘要与时间；选区加粗和列表，AI 结果内嵌预览并可撤销替换。
- **智能整理**：内置 CoCo meeting-notes Skill，读取电脑时间和时区整理相对日期，保留待确认信息；支持自定义提示词和 Skill。
- **交互优化**：导航拖动排序、文件夹平滑横向滚动与边缘渐隐、可爱的收藏气泡和滑动选择反馈。
- **项目维护**：删除项目支持确认和撤销，只清理项目及关联元数据，保留原始资料。

同时保留 v0.2.1 的功能：

- **织梦台**：第六个入口，支持项目创建、编辑、归档，多项目关联，不移动素材原件。
- **自动关联**：顶栏中间胶囊选择项目，右键或滑动开关控制快捷保存自动关联；也可本次仅存公共库。
- **统一索引**：搜索网站、母子卷轴和当前素材库，按类型、标签、关键词及项目筛选。
- **批量标签**：百宝匣批量添加、移除标签，详情可查看和调整所属项目。
- **整理与恢复**：继续工作、项目关系撤销与独立备份，回收区手动永久删除和 30 天自动清理。
- **外观与反馈**：13 套配色、7 种材质，新增云白、液态玻璃和致谢反馈页；统一标签、下拉菜单与开关动画，修复背景模糊抖动。

玻璃保留透明底色、高光和可选桌面模糊，真实桌面折射已关闭。完整内容见 [v0.2.2 发布说明](docs/releases/v0.2.2.md)。

## 下载与安装

到 [GitHub Releases](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/latest) 下载：

| 文件 | 用途 |
| --- | --- |
| `musy-desktop-assist-0.2.2-setup.exe` | 安装版，可选目录，创建桌面快捷方式 |
| `musy-desktop-assist-0.2.2-portable.exe` | 免安装启动版，首次运行需要解压时间 |
| `Musy-v0.2.2-docs.zip` | 离线使用文档 |
| `SHA256SUMS.txt` | 对应发布文件的 SHA-256 校验值 |

支持 Windows 10 / 11 x64，无需预装 Node.js、Python、Rhino 或 Office。外部编辑需要对应软件；部分系统缩略图依赖已注册的格式组件。

应用尚未签名。若显示未知发布者，请确认下载来自本仓库并核对校验值，再自行决定是否运行。便携版仍使用当前账户的应用数据目录，不会把所有数据自动存到 exe 旁边。

## 一分钟上手

1. 启动后找到桌面小球，按住拖动，单击展开功能入口。
2. **传送门**：复制网址后点收藏邀请，或在面板点「收藏剪贴板」。
3. **卷轴**：试用示例，拖动林间亭卡片查看日夜变体，再新增自己的提示词。
4. **百宝匣**：选择资料库后导入文件。单击选择、双击打开、右键编辑、空格轻预览。
5. **织梦台**：新建项目关联已有资料，或在顶栏开启新资料自动关联；公共资料库可统一搜索。
6. **便签**：点击文件夹开始新普通文本，左侧打开已有记录；使用专注书写、待办或 AI 优化。
7. 在设置中选择配色、质感和语言；需要 AI 时再填写自己的接口与密钥。

详细操作、快捷键和迁移方法见[使用指南](docs/使用指南.md)。

## 内置内容与数据边界

发布包只预置 **64 个公开网站、3 条原创卷轴示例及其示意插画**；秘籍的离线快捷键资料仍随功能提供。百宝匣、项目、便签内容和 AI 配置初始为空。不打包开发者的实际提示词、生成效果图、项目文件、素材索引、API Key 或运行缓存。

示例仅初始化未创建过卷轴数据的库，不覆盖已有内容；删除后不会自动补回。正文文件见 [examples/scrolls](examples/scrolls/README.md)。

- 收藏与卷轴保存在 `%APPDATA%\musy-desktop-assist\` 对应的本地浏览器存储中。选定备份文件夹后同步到 `musy-data.json`。
- 百宝匣有独立资料库。本地文件默认**引用原件**，不会搬动原文件；剪贴板图片保存到资料库 `clipboard/`。
- `musy-data.json` 不包含百宝匣、API Key 或外观设置。`.musybox` 包含百宝匣索引和封面，**不包含引用原件或剪贴板原图文件**。换电脑需另外复制原文件和 `clipboard/`。
- 织梦台使用 `.musyprojects` 独立备份项目和关系，不包含源素材；标签随百宝匣保存。回收区满 30 天或手动永久删除会清理库内条目及对应自有文件，外部引用原件保留。
- 便签保存在 `%APPDATA%\musy-desktop-assist\notes.json`，现有三种导出不包含便签；迁移时退出应用并单独复制主文件及 `.previous` 快照。
- AI 请求将当前操作内容交给你配置的接口；文档识别可能发送正文和参考图。网站图标抓取可能访问图标服务。详见[数据与迁移](docs/数据与迁移.md)。

## 开发与发布

公开 v0.2.0 源码和历史下载保留；后续源码私有开发，此仓库提供经批准的软件、用户文档和反馈入口。v0.2.2 Release 自动生成的 Source code 压缩包对应公开仓库文档树，不是新版完整源码。旧版构建说明见 [v0.2.0 源码](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/tree/v0.2.0)。

## 当前边界

- 只提供 Windows x64；macOS、Linux、ARM64 尚未提供成品。
- 点睛笔、全局快捷键、浏览器扩展、智能文件夹、AI 相似检索、完整托管副本迁移仍在规划中。
- 专业格式显示可读取的保存预览，未实现完整 3D 渲染或工程文件编辑。
- 含图卷轴使用 localStorage，有容量上限；百宝匣大文件走路径引用，不占用该配额。

后续方向见[开发优先级](docs/百宝匣开发优先级.md)及[路线图](docs/开发评估与路线图.md)。

## 致谢与许可

基于 Electron、React、TypeScript、electron-vite。吉祥物表情来自 [LaoA-GrokBot](https://github.com/zhulin025/LaoA-GrokBot) 的 MIT 代码；格式预览参考 cad-preview；Gooey Nav 改编自 React Bits。详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和 [licenses](licenses)。

Musy 原创代码采用 [MIT](LICENSE)。第三方组件各自适用其许可，其中 React Bits Gooey Nav 含 Commons Clause 条件，不能将仓库全部内容视为无附加条件的 MIT 组件包。

<details>
<summary>English</summary>

Musy is a local-first Windows desktop companion for designers: website bookmarks, prompt families, offline shortcut references, and a file-reference asset library. Copy a URL or drop files onto the companion to collect them. Preview images, compare references, and drag original files into your workflow. AI is optional and uses your own endpoint. v0.2.2 adds sticky notes, task lists, animated folders, focus writing, AI organization with local date context, reorderable navigation, and smoother collection feedback. Dreamloom provides projects, automatic collection, bulk tags and unified search across bookmarks, scrolls and the connected asset library. It includes 64 public bookmarks and 3 original teaching prompts, with no private projects or credentials. Download from [Releases](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/latest). Metadata backups do not include original asset files.

</details>
