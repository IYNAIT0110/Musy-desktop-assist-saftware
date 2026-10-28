# STArra · 闪星

**让创造，自有星图。**

本地优先的 Windows 桌面创作伙伴，把灵感、提示词、素材、文档与项目放在随手可及的小球里。当前版本 **v0.2.3**。

**[下载 v0.2.3](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/tag/v0.2.3) · [使用指南](docs/使用指南.md) · [文档目录](docs/README.md) · [更新记录](CHANGELOG.md) · [问题反馈](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/issues)**

## 八个入口

| 默认顺序 | 功能 | v0.2.3 能力 |
| --- | --- | --- |
| 1 | 星砂 | 普通文本、待办、Markdown 编辑与导出、专注书写、可选 AI 优化；内置 14 篇使用文档与 3 篇演示 |
| 2 | 织梦台 | 项目关联、统一索引、自动收集与继续工作 |
| 3 | 卷轴 | 母子提示词、预览图、卡牌切换、复制与可选 AI 扩写/翻译 |
| 4 | 百宝匣 | 文件夹与剪贴板导入、原件引用、标签分组、轻预览、并排参考、拖出原件 |
| 5 | 传送门 | 收藏、分组和搜索网站，内置 64 个公开网址 |
| 6 | 秘籍 | SketchUp、Rhino、AutoCAD 离线快捷键参考 |
| 7 | 点睛笔 | 独立润色 UI 占位，尚未接入全局润色 |
| 8 | 胶囊 | 原文件与应用记录统一备份，按项目/日期导出，换机恢复与路径重建 |

右键小球呼出 **星笺、星轨、星镜** mini 功能栏：独立圆形按钮、跟随材质、展开收回和边缘翻转。目前只做 UI 和反馈，未接入今日待办、日程与截图。

## v0.2.3 亮点

- 产品正式统一为 STArra，沿用原数据目录和升级标识，已有内容保留。
- 「胶囊」生成可整体携带的 `.starrapack` 文件夹，支持扫描清单、缺失确认、取消和校验，恢复到独立新配置。
- 星砂「使用文档」按功能分篇，附工作流、产品故事；「功能演示」可试用两种预设和 AI 优化。只初始化一次，不覆盖个人编辑。
- 右键 mini 栏加入星芒主题新图标，52px 独立按钮更贴近小球，名称通过悬停提示显示。
- 完善 Markdown 预览和编辑、列表平滑收放、页面切换、设置布局与默认外观恢复，新增静态磨砂颗粒。13 套配色、8 种材质。

## 从收集到换机继续

创建织梦台项目 → 开启当前项目收集 → 收集网站、卷轴与素材 → 星砂记录与待办 → 预览和复用 → 胶囊扫描并打包 → 新电脑恢复并重建路径。

详细见[工作流](docs/使用文档/13-工作流.md)、[完整产品工作流与规划](docs/STARRA-闪星设计师端完整工作流-v1.0.md)、[品牌故事](docs/STARRA-闪星品牌故事.md)。规划中的云同步、Agent 接力和完整时间线与当前能力分别标注。

## 安装与数据边界

提供 Windows 10 / 11 x64 安装版和免安装启动版。安装包应从桌面或下载目录运行，不要置于旧安装目录内。无账号也可使用本地功能，网络抓取与自配 AI 需要联网。

默认仅含 64 个公开网站、3 条原创卷轴示例与示意插画、离线快捷键、14 篇使用文档和 3 篇演示，不包含开发者私人提示词、生成效果图、项目、素材或密钥。

应用继续使用原 `%APPDATA%\musy-desktop-assist` 存储路径及兼容键。百宝匣默认引用原件，剪贴板图片由资料库保存；回收区 30 天到期会清理对应自有文件，外部引用原件保留。

胶囊的项目/日期范围**只筛选原文件**，完整应用记录与当前资料库自有文件始终包含，可能含其他项目记录及模型密钥。适合个人备份迁移，不应直接作为脱敏交付包分享。未连接资料库需手动添加目录，第三方设计软件需另行安装。

AI 可选，仅向你配置的接口发送当前操作内容与所选指令，可能产生费用。旧 JSON / 索引备份不含所有原件。详见[胶囊说明](docs/备份与迁移.md)。

## 开发与许可

后续源码仅在私有仓库开发。公开仓库保留 v0.2.0 源码与历史版本，提供当前安装包、用户文档、许可和反馈入口；Release 自动生成的 Source code 压缩包不是新版完整源码。

本项目原创代码采用 [MIT](LICENSE)，第三方各自适用其许可。Bodoni Moda 字体采用 OFL；React Bits 含 MIT + Commons Clause 条件。见[第三方说明](THIRD_PARTY_NOTICES.md)。

STArra is a local-first desktop companion for designers. v0.2.3 adds self-contained Capsule backups, path-remapped restoration, a UI-only mini toolbar, and built-in Markdown guides and examples. Project/date filters select original files only; full app metadata is still included. Future source development is private; the public repository distributes approved binaries and documentation.
