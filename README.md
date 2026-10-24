# <img src="build/icon.png" width="34" align="top" /> Musy · 桌面悬窗助手

> 面向设计工作者的桌面挂件：一个常驻桌面的小球，点开就是你的链接收藏、提示词库和软件快捷键白皮书。

<p>
  <img alt="platform" src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?logo=windows&logoColor=white" />
  <img alt="electron" src="https://img.shields.io/badge/Electron-31-47848F?logo=electron&logoColor=white" />
  <img alt="react" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img alt="typescript" src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-3DA639" />
  <img alt="release" src="https://img.shields.io/github/v/release/IYNAIT0110/Musy-desktop-assist-saftware?include_prereleases&color=FF6B35" />
</p>

Musy（取自缪斯 Muse）把设计师每天都在翻的那几样东西收进一个不挡工作的悬浮窗里：收藏的网站、文生图提示词、Rhino / SketchUp / AutoCAD 的快捷键。全部数据存在本地，不需要登录，不联网也能用（除了你自己配置的大模型功能）。

**[下载安装](#下载安装) · [使用指南](docs/使用指南.md) · [SketchUp 快捷键](docs/shortcuts/sketchup.md) · [Rhino 快捷键](docs/shortcuts/rhino.md) · [AutoCAD 快捷键](docs/shortcuts/autocad.md) · [反馈问题](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/issues)**

---

## 界面一览

Musy 从悬浮球展开为功能胶囊，再展开为收藏、提示词和快捷键面板。提示词库首次启动为空；项目不附带效果图、演示提示词或个人收藏数据。

| 入口 | 用途 |
| --- | --- |
| 🔗 网站收藏 | 内置建筑设计常用网站和事务所官网；支持自行增删、分组、排序 |
| ✨ 提示词 | 保存自己的文字、标签与预览图，可选用自己的模型接口扩写或翻译 |
| ⌨️ 快捷键 | 离线查看 SketchUp、Rhino、AutoCAD 的分类速查表 |
| ⚙️ 设置 | 配置模型、数据备份路径与界面语言 |

---

## 功能

### 🔗 链接收藏
- 一键收藏剪贴板里的链接，自动按域名命名
- 分组管理（可新建 / 重命名 / 删除），卡片拖拽排序
- 网站图标本地缓存（下次打开秒出，不重复请求）；图标抓不到时回落首字母
- 鼠标悬停显示网站简介，右键可把链接移到其他分组

### ✨ 提示词收藏
- 卡片网格：预览图铺满卡片、标签浮在图上，悬停可滚动查看长提示词全文
- 标签筛选（混凝土 / 黄昏 / 鸟瞰…… 都可以当标签）
- 预览图支持**本地选图**或**直接 Ctrl+V 粘贴剪贴板截图**，入库自动压缩到 1280px
- 点开卡片进入**四级工作区**：左边主图 + 子提示词缩略图，右边正文 + 标签 + 操作条
- **母 / 子提示词**：一条母提示词下挂多个改写版本，点击缩略图即可切换，严格两级不嵌套
- **AI 扩写 / 翻译**：接你自己的大模型 API，一键扩写补充光线材质构图，或中英互译

### ⌨️ 软件快捷键
- 内置 SketchUp / Rhino / AutoCAD 三套白皮书，共 234 条，按功能分类
- 支持搜索（命令名、中文别名、英文命令代码都能搜）

### 🎛 其他
- 四段式形态：悬浮球 64×64 → 功能胶囊 → 完整面板 760×560 → 提示词工作区 760×980，展开/收起都带缓动动画
- 可拖拽到桌面任意位置，展开时自动避免超出屏幕
- 最小化到任务栏（保留当前面板状态），点任务栏图标原样恢复
- 中文 / English / 日本語 三语切换，也支持加载自定义 JSON 语言包
- 可选「数据文件夹」：选定后每次改动自动写一份 `musy-data.json`；新电脑可在设置中导入该文件

### 内置内容
首次启动会自动写入一批预置收藏，之后你可以随意增删改，不会被覆盖：

| 内容 | 数量 |
| --- | --- |
| 建筑师常用网站（灵感 / 图集 / 素材 / 理论） | 21 |
| 国内外知名建筑事务所官网（「事务所」分组） | 40 |
| SketchUp / Rhino / AutoCAD 快捷键 | 234 |

> 提示词库**不预置任何内容**，开箱是空的 —— 这是你自己的素材库。

---

## 下载安装

到 [Releases](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases) 下载：

| 文件 | 说明 |
| --- | --- |
| `musy-desktop-assist-x.y.z-setup.exe` | 安装版，可选安装目录，会创建桌面快捷方式 |
| `musy-desktop-assist-x.y.z-portable.exe` | 免安装版，双击即用（首次启动会自解压，稍慢几秒） |

系统要求：Windows 10 / 11（x64）。不需要安装 Node.js 或任何运行环境。

> 程序未做代码签名，Windows 可能显示「未知发布者」。请核对下载来源与发布页上的校验值后再运行。

---

## 使用

**上手三步**

1. 双击运行，桌面左侧出现一个黑色小球（缪斯），按住可拖到顺手的位置
2. 点小球 → 展开功能胶囊 → 点任一图标 → 面板向下展开
3. 点标题栏的 ⚙ 配置大模型（可选，只用链接和快捷键可以不配）

详细操作（提示词工作区、母子提示词、数据备份与迁移、自定义语言包等）见 **[使用指南](docs/使用指南.md)**。

**标题栏按钮**：⚙ 设置 ｜ ⤡ 收起/展开面板 ｜ — 最小化到任务栏 ｜ ⏻ 退出

---

## 数据与隐私

- 所有数据（链接、分组、提示词、图片、配置）**只存在本机**，路径为 `%APPDATA%\musy-desktop-assist\`
- API Key 只保存在本地，由主进程直接向你自己填写的接口地址发请求，不经过任何第三方中转
- 网络请求只有三类：抓取网站图标、你配置的大模型接口、打开外部链接
- 想换电脑：设置 → 数据路径 → 选一个文件夹，复制生成的 `musy-data.json`；新电脑在同一页点击「从 musy-data.json 恢复」

---

## 本地开发

```bash
# 环境：Node.js 18+（推荐 20/22）
npm install
npm run dev          # 开发模式（主进程 / 预加载改动需重启，渲染层改动热更新）
npm run typecheck    # 类型检查（node + web 两端）
npm run build        # 只编译产物到 out/
```

> 国内网络建议先设置镜像：`npm config set electron_mirror https://npmmirror.com/mirrors/electron/`

## 打包

```bash
npm run build:win       # NSIS 安装版 + 便携版，产物在 dist/
npm run build:portable  # 只打便携版
```

配置见 [`electron-builder.yml`](electron-builder.yml)；应用图标在 `build/icon.ico`（256×256，PNG 内嵌 ICO）。

推送 `v*` 标签后，[Windows 发布工作流](.github/workflows/release.yml)会在干净的 Windows 构建机上执行 `npm ci`、类型检查与打包，并将安装版、便携版和 SHA-256 校验文件上传到 GitHub Releases。手动触发时只保存构建产物，不创建正式 Release。

## 项目结构

```
src/
├── main/                 # 主进程
│   ├── index.ts          # IPC（图标缓存 / AI 调用 / 窗口形变 / 数据落盘）
│   └── windows/          # 悬浮条 & 主窗口的创建与生命周期
├── preload/              # contextBridge 白名单 API（渲染层只能看到这些）
└── renderer/
    ├── index.html
    └── src/
        ├── App.tsx       # 按窗口 hash 分发 FloatBar / MainWindow
        ├── store.ts      # localStorage 数据层 + 种子数据 + 配额保护
        ├── i18n.ts       # 中/英/日 字典 + 自定义语言包
        ├── components/   # FloatBar / MainWindow / PromptsPanel / Settings ...
        └── data/         # 快捷键白皮书、图标覆盖表
```

**形态切换原理**：渲染层只负责 UI，窗口尺寸由主进程按 `floatbar:set-level` 逐帧插值改变（先加宽再加高，收起反之），所以展开过程不会闪白。

## 常见问题

<details>
<summary>悬浮球不见了 / 点不出来？</summary>

可能被最小化到任务栏了，点任务栏图标即可恢复；也可以重新双击桌面快捷方式（单实例锁会把已有窗口唤到前台）。
</details>

<details>
<summary>网站图标显示成首字母？</summary>

图标是联网抓取并缓存的，个别站点拿不到图标（或站点本身没有 favicon）就会回落成首字母。重启后会重试。
</details>

<details>
<summary>AI 扩写 / 翻译没反应？</summary>

先确认设置里的接口地址、API Key、模型名三者匹配（接口需兼容 OpenAI 的 `/chat/completions`）。错误信息会直接显示在面板底部。
</details>

<details>
<summary>提示「本地存储空间已满」？</summary>

预览图存在浏览器本地存储里，配额约 5MB。删掉一些带图的提示词，或换用更小的截图（粘贴/选图时会自动压缩，但原图特别大仍会占用不少空间）。
</details>

---

## Roadmap

- [x] 链接收藏 / 提示词收藏 / 快捷键白皮书
- [x] 母子提示词 + AI 扩写翻译
- [x] 三语界面 + 自定义语言包
- [ ] 文本润色（面板已占位）
- [ ] 模型库 / 素材库（面板已占位）
- [ ] 全局快捷键唤起
- [ ] macOS 版本

## 致谢

- [Electron](https://www.electronjs.org/) / [React](https://reactjs.org/) / [electron-vite](https://electron-vite.org/)
- 吉祥物的表情与轮廓数据移植自 [LaoA-GrokBot](https://github.com/zhulin025/LaoA-GrokBot)（MIT License）
- 快捷键白皮书整理自各软件官方文档

## License

[MIT](LICENSE) © IYNAIT0110

---

<details>
<summary>English</summary>

**Musy** is a tiny always-on-top desktop companion for designers on Windows. One click expands it into a floating panel with your bookmarked links, a text-to-image prompt library (preview thumbnails, parent/child prompt variants, optional AI expand & translate), and quick-reference shortcut books for SketchUp, Rhino and AutoCAD.

Everything is stored locally — no account, no cloud. AI features are optional and use your own OpenAI-compatible endpoint. Download the installer or portable build from [Releases](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases).

</details>
