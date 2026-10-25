# Eagle 功能与开源情况调研

> 2026-10-26 / v0.2.0 文档校准：保留 2026-10-25 的历史调研记录。本文描述 Eagle，不是 Musy 已实现功能；当前 Musy 功能与边界见使用指南。外部产品信息以原文调研日期为准。 [使用指南](使用指南.md) · [发布说明](releases/v0.2.0.md)

更新：2026-10-25。对象是 [eagle.cool](https://en.eagle.cool/) 的设计素材管理软件 Eagle，不是同名的 PCB、数据安全或 AI 模型项目。本清单按 Eagle 官方产品页、桌面帮助目录、浏览器扩展页和开发者文档整理，覆盖其公开说明的主要功能。具体菜单、插件可用性和系统支持以当前安装版本为准。

## 一、产品定位与工作方式

- Eagle 是面向设计、摄影、建筑、视频等视觉工作的本地素材库。保存图像、设计文件、视频、音频、字体、网页书签等，在统一界面中采集、分类、搜索、预览和导出。
- 素材放在用户选择的本地资源库中；可创建、切换、导入、合并、备份资源库。跨设备使用依靠用户选用的云同步工具或移动硬盘，而非 Eagle 自带云空间。官方列出 Dropbox、Google Drive、OneDrive、Synology Drive 和移动硬盘的同步指南。
- 官方下载页列有 Windows 和 macOS 客户端；浏览器扩展支持 Chrome、Edge、Safari、Firefox。

来源：[官网](https://en.eagle.cool/)、[桌面功能目录](https://en.eagle.cool/support/desktop)、[下载页](https://en.eagle.cool/download)。

## 二、完整功能清单

### 1. 采集与导入

| 功能 | 用途 |
| --- | --- |
| 本地文件导入 | 导入电脑中的图片、设计文件及其他格式；支持拖入 Eagle。 |
| 网页图片采集 | 浏览器扩展拖拽保存、右键保存、Alt + 右键保存。 |
| 网页批量采集 | 抓取当前页面中的多张图片，按尺寸、格式等筛选，采集时指定文件夹和标签；Eagle 4 还增加来源域名筛选。 |
| 高清图识别 | 扩展尝试找到网页图片的更高分辨率版本。 |
| 截图 | 桌面截图；浏览器扩展支持区域、元素和整页截图。截图格式、质量、快捷键及是否复制到剪贴板可配置。 |
| 剪贴板与采集窗口 | 将复制的图片粘贴到素材库；使用采集窗口接收素材。 |
| 网页和视频书签 | 保存网页书签，以及 YouTube/Vimeo 视频链接并在 Eagle 中预览。 |
| 批量导入链接 | 一次导入多个链接。 |
| 专项导入 | 官方列有 Pinterest、ArtStation 图片导入，字体、音频导入。 |
| 文本素材 | 创建文本笔记及文件模板。 |
| 自动导入 | 监控指定文件夹，把新文件自动加入资源库。 |

来源：[采集帮助](https://en.eagle.cool/support/desktop/collect)、[浏览器扩展](https://en.eagle.cool/extensions)、[Eagle 4 说明](https://en.eagle.cool/blog/post/eagle4)、[自动导入说明](https://en.eagle.cool/support/article/the-auto-import)。

### 2. 组织与管理

| 功能 | 用途 |
| --- | --- |
| 文件夹 | 多级文件夹、批量建文件夹、批量移动和重命名；素材可按项目和主题整理。 |
| 智能文件夹 | 用名称、标签、颜色、格式等规则动态汇集素材。 |
| 标签 | 单项或批量打标签、批量建标签、标签分组和管理、快捷标签。 |
| 自动标签 | 可配置文件夹自动标签。 |
| 元数据 | 为素材填写注释、笔记、来源 URL、星级评分；视频可记笔记。 |
| 批量操作 | 批量选择、改名、移动、打标签和分类；可调整扩展名、组合图片。 |
| 去重 | 查找完全相同文件及视觉相似图片，并按范围扫描、选择保留或合并。 |
| 密码保护 | 给指定文件夹或应用设置密码；部分设备支持 Touch ID。 |
| Action | 创建可重复执行的素材处理动作。 |

来源：[整理帮助](https://en.eagle.cool/support/desktop/organize)、[官网功能概览](https://en.eagle.cool/)、[Eagle 4 说明](https://en.eagle.cool/blog/post/eagle4)。

### 3. 搜索与筛选

| 功能 | 用途 |
| --- | --- |
| 关键词搜索 | 按名称等文字信息查找，可使用模糊搜索。 |
| 标签与文件夹搜索 | 按分类、标签组合检索；可保存筛选条件。 |
| 多维筛选 | 颜色、形状、尺寸、长宽比、类型、评分、日期、文件大小、注释、笔记、来源 URL；音频还可按 BPM。 |
| 快速切换 | 在大量文件夹、智能文件夹和标签之间快速定位。 |
| 反向搜图 | 调用外部图片搜索服务寻找来源或相似参考。 |
| 随机浏览 | 将素材打乱，用于重新发现灵感。 |

来源：[搜索帮助](https://en.eagle.cool/support/desktop/search)、[官网功能概览](https://en.eagle.cool/)、[Eagle 4 说明](https://en.eagle.cool/blog/post/eagle4)。

### 4. 浏览与预览

| 功能 | 用途 |
| --- | --- |
| 缩略图和布局 | 调整网格布局、大小、排序和缩略图背景，可自定义封面。 |
| 悬停预览 | 不打开文件就预览图片、GIF、视频和音频。 |
| 快速预览 | 空格键预览，左右切换；可在新窗口打开多个素材或固定到桌面。 |
| 图像操作 | 缩放、聚焦缩放、右键手势、灰度、旋转、裁剪、水平翻转。 |
| 视频与 GIF | 视频播放器、GIF 查看器、播放控制及相关偏好设置。 |
| 字体与音频 | 不安装字体即可预览和分类字体；音频可预览及管理。 |
| 展示方式 | 详情模式、演示模式、随机模式、显示子文件夹内容。 |
| 外部打开 | 可用其他应用打开已收集文件。 |

来源：[浏览帮助](https://en.eagle.cool/support/desktop/browse)、[官网功能概览](https://en.eagle.cool/)。

### 5. 导出、共享与资源库维护

- 用 `.eaglepack` 导入、导出和分享素材包；导出到电脑、指定格式或尺寸，或导出整个文件夹。
- 支持 WebP 转换、无损压缩、视频转 GIF、CSV 导出和复制链接等工具。
- 提供资源库备份、合并、迁移与导入说明。同步通常由用户选择的第三方云盘工具完成；同步文件夹不等于 Eagle 提供在线浏览空间。

来源：[导入导出帮助](https://en.eagle.cool/support/desktop/import-and-export)、[资源库帮助](https://en.eagle.cool/support/desktop/library)、[同步帮助](https://en.eagle.cool/support/desktop/sync)。

### 6. 个性化与效率

- 可改界面主题、语言、缩放、侧栏计数和显示内容、双击行为、鼠标滚轮和空格键行为、视频与 GIF 自动播放、截图选项、快捷键、提示音和通知。
- 支持开机启动、应用密码锁；macOS 的部分功能含菜单栏/Dock 设置与 Touch ID。
- Eagle 4 增强右键菜单搜索、标签面板、文件夹面板、检查器项目排序、筛选栏自定义和资源库切换界面。

来源：[偏好设置目录](https://en.eagle.cool/support/desktop/preferences)、[Eagle 4 说明](https://en.eagle.cool/blog/post/eagle4)。

### 7. 插件及 AI 功能

- 插件中心提供窗口插件、后台服务、格式扩展、右侧检查器扩展。官方举例包括图片去背、放大、擦除、压缩、格式转换、图片比较、OCR、视频转 GIF、媒体信息、EXIF/直方图和额外文件格式预览。部分能力需要单独安装插件，不能视作基础安装自带。
- **AI Search 插件**：以参考图搜索本地相似图片；自然语言搜索目前主要匹配已有文件名、描述、笔记等文本元数据，并非直接理解每张图片内容。官方说明其索引和搜索在本机离线完成。
- **AI Action 插件**：按自定义指令批量执行 AI 命名、写描述、归入已有文件夹、打标签，操作可组合成流程。它依赖配置的模型；具体数据处理方式取决于所用模型和插件设置。
- **AI Models / AI SDK**：统一配置多家在线或本地模型，供依赖它的插件使用。
- **MCP / Skill 与 API**：官方提供 AI 代理集成方向、运行于 Eagle 内部的 JavaScript Plugin API，以及运行在应用外部的本地 HTTP Web API V2。Web API V2 要求 Eagle 4.0 Build 21 或更新版本。

来源：[插件 API](https://developer.eagle.cool/plugin-api)、[AI Search](https://en.eagle.cool/blog/post/eagle-plugin-ai-search)、[AI Action](https://en.eagle.cool/blog/post/eagle-plugin-ai-action)、[AI SDK](https://developer.eagle.cool/plugin-api/extra-module/ai-sdk)、[Web API V2](https://developer.eagle.cool/web-api)、[Eagle 4 插件清单](https://en.eagle.cool/blog/post/eagle4)。

## 三、是否开源、有哪些代码

**结论：截至本次查询，未找到 Eagle 桌面主程序的官方公开源代码。** 官方提供下载、付费授权及开发接口；其 [最终用户许可协议](https://en.eagle.cool/eula) 限制复制、反编译等行为。公开 API 让开发者扩展或连接 Eagle，不代表核心程序开源。

| 代码/资料 | 状态与用途 |
| --- | --- |
| [Eagle 官方 GitHub 组织](https://github.com/eagle-app) | 有公开仓库，主要是插件、示例、属性说明和已归档测试项目；未见桌面主程序源码仓库。 |
| [插件示例](https://github.com/eagle-app/eagle-plugin-examples) | 公开的窗口、服务、预览、检查器等插件示例，可学习接口与项目结构。仓库公开不自动意味着可按开源许可复用；使用前需逐仓库核对许可证。 |
| [Eagle Attributes](https://github.com/eagle-app/eagle-attributes) | 官方公开属性规范与示例，该仓库明确标注 MIT 许可。 |
| [Custom Export 插件](https://github.com/eagle-app/eagle-custom-export) | 公开插件实现，README 称其为开源；复用代码前仍需核对仓库中具体许可文件及依赖许可。 |
| [FFmpeg 插件](https://github.com/eagle-app/eagle-plugin-ffmpeg)、[EXIF Inspector 插件](https://github.com/eagle-app/eagle-plugin-exif-inspector) | 有公开代码，属于扩展，不是 Eagle 桌面主程序。 |
| [Plugin API 文档](https://developer.eagle.cool/plugin-api)、[Web API V2 文档](https://developer.eagle.cool/web-api) | 可用于自行开发插件或外部集成；它们是开放接口，不是主程序源码。 |

**对 Musy 的可借鉴点（产品设计层面）**：快速采集、分组/标签/智能规则、多维筛选、悬停预览、批量去重、原始来源保存、可迁移资源库和插件接口。可按需求独立实现；不要直接复制 Eagle 的界面素材或未获许可的代码。

## 四、官方资料入口

- [产品功能总览](https://en.eagle.cool/)
- [桌面帮助目录](https://en.eagle.cool/support/desktop)
- [浏览器扩展](https://en.eagle.cool/extensions)
- [所有帮助文章](https://en.eagle.cool/support/all-articles)
- [Eagle 4 功能更新](https://en.eagle.cool/blog/post/eagle4)
- [官方 GitHub](https://github.com/eagle-app)
- [Plugin API](https://developer.eagle.cool/plugin-api)
- [Web API V2](https://developer.eagle.cool/web-api)
