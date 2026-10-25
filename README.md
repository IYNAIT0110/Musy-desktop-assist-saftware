# <img src="build/icon.png" width="36" align="top" /> Musy · 桌面悬窗助手

把网站、提示词和设计素材放在随手可及的地方。一个会看着光标的小球，陪你完成「收集 → 整理 → 预览 → 复用」。

[![Windows](https://img.shields.io/badge/Windows-10%20%2F%2011%20x64-0078d6)](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/latest)
[![Release](https://img.shields.io/github/v/release/IYNAIT0110/Musy-desktop-assist-saftware)](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/latest)
[![Build](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/actions/workflows/release.yml/badge.svg)](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/actions/workflows/release.yml)

**[下载安装](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/latest) · [使用指南](docs/使用指南.md) · [文档目录](docs/README.md) · [更新记录](CHANGELOG.md) · [问题反馈](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/issues)**

## 五个小入口

| 入口 | 用途 | v0.2.0 状态 |
| --- | --- | --- |
| 传送门 | 收藏网站、分组、搜索、打开链接 | 可用；内置 64 个网站，复制网址时可收到收藏邀请 |
| 卷轴 | 保存提示词、预览图和母子版本 | 可用；3 条原创示例，卡牌切换、编辑、复制、可选 AI 扩写与翻译 |
| 秘籍 | SketchUp / Rhino / AutoCAD 快捷键速查 | 可用；234 条离线参考资料，支持搜索 |
| 点睛笔 | 独立文字润色入口 | 规划中；当前显示占位说明 |
| 百宝匣 | 收集、分类、预览与复用本地设计素材 | P0 与部分 P1 可用；引用原件、剪贴板和拖放收集、轻预览、并排参考、拖出文件 |

不需要账号。收藏、整理和离线资料可以直接使用；打开网站、抓取图标和自行配置的 AI 服务需要网络。

## v0.2.0 更新亮点

- **收集更顺手**：小球识别剪贴板中的完整网址并邀请收藏；文件或图片可拖到小球收进百宝匣。
- **素材有了去处**：导入文件或文件夹、按顶层文件夹建分组、剪贴板导入、标签与元数据、回收恢复、备份与路径重新关联。
- **先看再打开**：空格轻预览、滚轮缩放、两张图片并排参考、预览置顶、外部打开与拖出原件。专业设计文件优先读取保存时的缩略图，范围见[格式说明](docs/百宝匣缩略图支持.md)。
- **卷轴有了版本感**：母子提示词组成卡牌堆，用拖动或箭头切换。点击封面查看对应正文，悬停不再用长文本遮挡图片。
- **外观更自由**：12 套配色、6 种质感与强度调节；导航黏液切换、按钮水波与悬停反馈、方向感应卡片反馈。
- **细节修复**：分组过多时固定收藏按钮、圆形选择框、统一单层卡片描边、三语文案补齐、小球展开时固定纵向画布和自身样式。

完整内容见 [v0.2.0 发布说明](docs/releases/v0.2.0.md)。

## 下载与安装

到 [GitHub Releases](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/latest) 下载：

| 文件 | 用途 |
| --- | --- |
| `musy-desktop-assist-0.2.0-setup.exe` | 安装版，可选目录，创建桌面快捷方式 |
| `musy-desktop-assist-0.2.0-portable.exe` | 免安装启动版，首次运行需要解压时间 |
| `SHA256SUMS.txt` | 对应发布文件的 SHA-256 校验值 |

支持 Windows 10 / 11 x64，无需预装 Node.js、Python、Rhino 或 Office。外部编辑需要对应软件；部分系统缩略图依赖已注册的格式组件。

应用尚未签名。若显示未知发布者，请确认下载来自本仓库并核对校验值，再自行决定是否运行。便携版仍使用当前账户的应用数据目录，不会把所有数据自动存到 exe 旁边。

## 一分钟上手

1. 启动后找到桌面小球，按住拖动，单击展开功能入口。
2. **传送门**：复制网址后点收藏邀请，或在面板点「收藏剪贴板」。
3. **卷轴**：试用示例，拖动林间亭卡片查看日夜变体，再新增自己的提示词。
4. **百宝匣**：选择资料库后导入文件。单击选择、双击打开、右键编辑、空格轻预览。
5. 在设置中选择配色、质感和语言；需要 AI 时再填写自己的接口与密钥。

详细操作、快捷键和迁移方法见[使用指南](docs/使用指南.md)。

## 内置内容与数据边界

发布包只预置 **64 个公开网站、3 条原创卷轴示例及其示意插画**；秘籍的离线快捷键资料仍随功能提供。百宝匣和 AI 配置初始为空。不打包开发者的实际提示词、生成效果图、项目文件、素材索引、API Key 或运行缓存。

示例仅初始化未创建过卷轴数据的库，不覆盖已有内容；删除后不会自动补回。正文文件见 [examples/scrolls](examples/scrolls/README.md)。

- 收藏与卷轴保存在 `%APPDATA%\musy-desktop-assist\` 对应的本地浏览器存储中。选定备份文件夹后同步到 `musy-data.json`。
- 百宝匣有独立资料库。本地文件默认**引用原件**，不会搬动原文件；剪贴板图片保存到资料库 `clipboard/`。
- `musy-data.json` 不包含百宝匣、API Key 或外观设置。`.musybox` 包含百宝匣索引和封面，**不包含引用原件或剪贴板原图文件**。换电脑需另外复制原文件和 `clipboard/`。
- AI 请求将当前操作内容交给你配置的接口；文档识别可能发送正文和参考图。网站图标抓取可能访问图标服务。详见[数据与迁移](docs/数据与迁移.md)。

## 本地开发与验证

建议 Node.js 22 LTS，使用 lockfile 安装依赖：

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run build:win
```

`build:win` 生成安装版和便携版；`build:portable` 只生成便携版。配置见 [electron-builder.yml](electron-builder.yml)。Windows CI 在干净环境执行类型检查、单元测试、构建和安装启动验证。

发布检查项见[发布与验证](docs/发布与验证.md)。日常本地修改不会自动发布；显式推送版本标签才触发 Release 工作流。

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

Musy is a local-first Windows desktop companion for designers: website bookmarks, prompt families, offline shortcut references, and a file-reference asset library. Copy a URL or drop files onto the companion to collect them. Preview images, compare references, and drag original files into your workflow. AI is optional and uses your own endpoint. v0.2.0 includes 64 public bookmarks and 3 original teaching prompts, with no private projects or credentials. Download from [Releases](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/latest). Metadata backups do not include original asset files.

</details>
