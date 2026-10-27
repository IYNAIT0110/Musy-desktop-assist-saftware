# 第三方组件与版权说明

Musy 原创代码见根目录 MIT LICENSE。依赖和改编内容保留各自许可，不能将所有第三方文件自动视为 Musy 原创代码。

| 内容 | 来源 | 随附说明 |
| --- | --- | --- |
| 吉祥物轮廓与表情数据 | LaoA-GrokBot / zhulin025 | [MIT](licenses/LaoA-GrokBot-MIT.txt) |
| 部分设计格式预览解析 | cinderblock/cad-preview | [MIT](licenses/cad-preview-MIT.txt)，已增加读取、解压和像素边界 |
| Gooey Nav 导航 | DavidHDev/react-bits / David Haz | [MIT + Commons Clause](licenses/react-bits-GooeyNav-LICENSE.txt)，保留附加条件；不得将该组件独立或作为组件包转售/再分发 |
| Jelly Radio 标签切换动画 | DavidHDev/react-bits / David Haz | [MIT + Commons Clause](licenses/react-bits-JellyRadio-LICENSE.txt)，沿用原版运动目标与弹簧参数，适配本地主题及共享按钮 |
| Glide Select 下拉动画 | DavidHDev/react-bits / David Haz | [MIT + Commons Clause](licenses/react-bits-JellyRadio-LICENSE.txt)，同一上游许可；适配角落展开与滑动高亮，保留现有尺寸、主题和菜单定位 |
| Squish Switch 项目关联开关 | DavidHDev/react-bits / David Haz | [MIT + Commons Clause](licenses/react-bits-JellyRadio-LICENSE.txt)，适配速度驱动拉伸及弹簧位移，原生实现，不新增运行依赖 |
| Folder / Book 便签分类书册 | DavidHDev/react-bits / David Haz | [MIT + Commons Clause](licenses/react-bits-Folder-LICENSE.txt)，官方 TypeScript + CSS 组件，用于便签分类的悬停翻开；缩小尺寸、关闭拖出与缩放 |
| Obsidian Markdown Skill | kepano/obsidian-skills / Steph Ango | [MIT](licenses/obsidian-markdown-LICENSE.txt)，固定提交 `3ccff5338ea700537839b21900aa5358a0402c98` 的 obsidian-markdown SKILL.md 与三个参考文档；用于便签 AI 整理的文本指令，Musy 另加通用 Markdown、事实与待办状态保留要求 |
| Meeting Notes Skill | coco-research/coco / Coco Inc. | [MIT](licenses/coco-meeting-notes-LICENSE.txt)，固定提交 `2e838244a0c6a2309e51752fa151b6e335f99b78` 的 skills/meeting-notes/SKILL.md；现为便签默认智能整理指令，应用适配限制为当前便签内容并注入本机时间 |
| GlassSurface 表面材质 | DavidHDev/react-bits / David Haz | [MIT + Commons Clause](licenses/react-bits-JellyRadio-LICENSE.txt)，直接集成用户提供的官方 JavaScript + CSS 完整源码；原文、哈希和许可位于组件目录。独立的 Windows 背景模糊为 Musy 实现，原分层桌面透镜已退出材质路径 |
| Electron、React、Vite、TypeScript、mammoth、pdfjs-dist 等 | 各上游项目 | 各依赖包自身许可；Electron 随运行时提供相应许可文件 |
| 软件与网站字标 | 对应权利人及图标数据来源 | 用于识别软件/网站，不表示官方合作或背书 |

Gooey Nav 随 Musy 应用使用，未作为可单独下载的组件产品发布。修改或再分发时请同时查看并遵守原始许可全文。

`src/renderer/src/assets/examples/` 的三幅示意插画和对应卷轴示例为本项目原创教学内容，随项目 MIT 许可提供；不是第三方生成效果图或用户项目。
