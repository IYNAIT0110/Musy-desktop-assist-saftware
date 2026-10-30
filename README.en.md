# STArra

**Give your creativity its own constellation.**

A local-first Windows desktop workspace for designers. A floating companion brings project files, notes, prompts, reference assets, and tasks within reach, connecting the work of collecting, organizing, creating, and picking up where you left off.

**[简体中文](README.md) · English**

[![Version](https://img.shields.io/badge/version-v0.3.4-536d8a)](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/tag/v0.3.4)
![Platform](https://img.shields.io/badge/platform-Windows_10%20%2F%2011_x64-626b78)
![Interface languages](https://img.shields.io/badge/UI-Chinese%20%7C%20English%20%7C%20Japanese-687e70)

[Download](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/latest) · [Documentation](docs/README.md) · [Changelog](CHANGELOG.md) · [Report an issue](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/issues)

> This README provides an English overview and setup guide. Most linked detailed guides and release notes are currently in Simplified Chinese. The application interface supports Chinese, English, and Japanese.

## What STArra is for

A design project's context often lives across folders, browser bookmarks, conversations, and temporary notes. STArra gives that material a shared desktop entry point while keeping original files in place and letting you continue using your existing design applications.

- **Organize around projects.** Connect directory files, version groups, references, prompts, and assets. The project you are browsing can be different from your active collection target.
- **Keep history you can inspect.** Explicitly save real file snapshots, then use relationship and time views to understand sources, changes, and purpose.
- **Let AI perform specific operations.** Optional model-based assistance and local MCP access can query application data, organize tasks, and generate files, with confirmation for state-changing operations.
- **Stay close to your desktop.** Left-click the floating ball for the main toolbar, right-click for mini tools, and middle-click for the assistant. Local features do not require an account.

STArra is intended for architecture, interior, landscape, and other design workflows involving models, drawings, images, documents, and references. It does not replace design software or treat manually confirmed file relationships as automatically parsed professional dependencies.

## New in v0.3.4

Drag the collapsed ball to the top edge and release to morph it continuously into Star Island. Its robot eyes blink and reflect app states. Right-click the island for three horizontally aligned mini tools. Right-click Star Note for individual pill-shaped task bubbles; click the island to dismiss them. Time editing now uses in-app hour/minute menus, with recovery when the task window fails. Use the toolbar search button or Ctrl+K for global search. Docking is currently per session.

[Star Island guide (Chinese)](docs/星岛顶部停泊.md) · [Release notes](docs/releases/v0.3.4.md)

## Installation and first steps

Requires **Windows 10 or 11, x64**. Choose your interface language in Settings.

| Download | Purpose |
| --- | --- |
| [starra-0.3.4-setup.exe](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/download/v0.3.4/starra-0.3.4-setup.exe) | Standard installer for regular use |
| [starra-0.3.4-portable.exe](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/download/v0.3.4/starra-0.3.4-portable.exe) | Launch without installing. Application data still resides in the current Windows user profile; it does not automatically travel with the executable |
| [STArra-v0.3.4-docs.zip](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/download/v0.3.4/STArra-v0.3.4-docs.zip) | Guides, workflows, examples, and third-party notices |
| [SHA256SUMS.txt](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/releases/download/v0.3.4/SHA256SUMS.txt) | SHA-256 checksums for the release files |

1. Run the installer from Downloads or your desktop. **Do not run it from inside the existing installation directory.** Create a Capsule backup before upgrading.
2. Left-click the ball to open the toolbar. Create a project in the project workspace and select its directory.
3. Confirm a directory scan in the file board, or start by writing a note and saving reference websites.
4. Configure a trusted model provider only if you want AI features. Enable MCP and authorize directories only if you want an external agent to connect. Both are optional.

[Troubleshooting installation and upgrades — Chinese](docs/安装升级排错.md) · [User guide — Chinese](docs/使用指南.md)

## Main tools

The Chinese names below help identify the corresponding modules in screenshots and detailed guides.

| Module | Capabilities |
| --- | --- |
| **Star Sand · Notes (星砂)** | Plain text, checklists, Markdown editing and export, focused writing, and optional AI organization; includes 16 guide notes and 3 demonstrations |
| **Project workspace (织梦台)** | Project file board, time view, relationship graph, manually confirmed version groups, real content snapshots, project checkpoints, and linked resources |
| **Scroll · Prompts (卷轴)** | Parent/child prompts, preview images, tags, copying, card switching, and optional AI expansion or translation; agents can save images, prompts, and generation parameters |
| **Treasure Box · Assets (百宝匣)** | Folder and clipboard imports, references to original files, tags, thumbnails and lightweight previews for supported formats, side-by-side reference, and dragging originals out |
| **Portal · Bookmarks (传送门)** | Save, group, and search reference websites; includes 64 public links |
| **Codex · Shortcuts (秘籍)** | Offline shortcut references for SketchUp, Rhino, and AutoCAD |
| **Capsule · Backup (胶囊)** | Package application records and original files, select project/date scopes, verify integrity, restore on another computer, and rebuild included paths |

The right-click mini toolbar includes **Star Notes (星笺)**, a task-based timeline synchronized with linked checklists and extracted tasks in Star Sand. **星轨 and 星镜 remain planned tools.** Middle-click opens the **STArra assistant (星灵)**.

## Desktop interaction and appearance

Reorder the main toolbar by dragging its tools. The main toolbar, mini tools, and assistant retain separate mouse entry points. Choose from 13 color themes and 8 materials, with independent theme and material-strength settings. Liquid glass retains rim highlights and optional system background blur; continuous desktop refraction is disabled.

MCP feedback can use a twin-star orbit or a flowing halo, with adjustable halo size and thickness. Speech bubbles follow the ball as it moves. Relevant feedback becomes static when the system requests reduced motion.

## v0.3.4: project files, versions, and provenance

### Three views of your work

The file board reads a project directory after you confirm its scope. Scanning does not move, rename, or delete originals. Switch between cards and lists, filter by type, status, or date, and sort by modification time, name, or size. Refresh manually after files change.

The relationship graph uses nodes, lines, and filenames, with panning, zooming, node arrangement, and focused scopes. **Export/generation, reference, design-reference, and branch relationships are confirmed by the user.** Changes in a source file prompt a review; STArra does not automatically change downstream files.

### Version groups and actual content snapshots

Files with the same extension can be manually grouped as versions. The active working version, approved version, and delivery version are distinct states. Similar filenames are suggestions, not proof of version order.

Saving a snapshot or a named project checkpoint copies real file content and records its SHA-256 hash. You can preview history, compare references side by side, and restore a verified copy to a new path. Existing files are not overwritten. **History that was never saved cannot be recovered**, and a checkpoint covering multiple files is not an atomic save inside your design application.

The default snapshot budget is 5 GB, configurable from 1–100 GB. Individual files are limited to 2 GB, with up to 60 files per snapshot operation. Scans support up to 12,000 entries per project; a graph displays up to 180 files at once. Search and filter to narrow larger projects.

[File board guide — Chinese](docs/织梦台文件看板.md) · [v0.3.4 release notes — Chinese](docs/releases/v0.3.4.md)

## An end-to-end design workflow

1. **Collect context.** Create a project, choose the active collection target, and associate websites, assets, and prompts with it.
2. **Plan the work.** Record decisions and action items in Star Sand, then schedule tasks in Star Notes. AI-extracted tasks are collected in the relevant category's AI Stream checklist (AI星流).
3. **Understand the files.** Scan the project directory, filter models and drawings, and confirm version groups and export, reference, or branch relationships.
4. **Save a milestone.** Explicitly capture content snapshots or a project checkpoint before a review or delivery.
5. **Continue elsewhere.** Use Capsule to package the required originals, application records, and snapshots, then restore them and rebuild included paths on another computer.

[Workflow guide — Chinese](docs/使用文档/13-工作流.md) · [Backup and migration — Chinese](docs/备份与迁移.md)

## Optional AI and external agents

### The assistant: models working through application tools

Middle-click the ball to ask your configured model to look up information, manage tasks, read application content, or generate real Word, Excel, PDF, Markdown, and other files. Tool results are returned to the model, and generated files have open and save-as actions.

The model endpoint must support Chat Completions-compatible function calling. Web search requires a separate Tavily configuration. A provider's website having a feature does not mean its API automatically includes the same tools.

### MCP: connect an external agent to your local workspace

Open **Settings → External Agent**, enable access, authorize folders, and add the generated MCP configuration to your client. **STArra must remain running, and Node.js must be installed on the computer running the external agent.**

- Read-only queries can run directly. Creation, modification, deletion, and other side-effecting operations require confirmation of the proposed operation list. A declared batch can use one confirmation.
- File access is limited to explicitly authorized directories. Connecting an agent does not expose arbitrary terminal execution or general computer-control tools through STArra.
- Agents can register the real paths of generated files and associate them with a project. They can also save images, prompts, and parameters to Scroll for later inspection.
- The ball's halo and follow-along speech bubbles indicate connection, execution, approval, and results. Appearance settings include animation styles, halo size, and thickness.

[Assistant guide — Chinese](docs/使用文档/15-小球助手.md) · [MCP setup, permissions, and operations — Chinese](docs/使用文档/16-外部Agent.md)

## Data, privacy, and backup scope

Local features do not require an account. Application records retain the compatible default data location, `%APPDATA%\musy-desktop-assist`. Project originals and externally referenced assets stay in their selected locations.

| Content | Storage and use |
| --- | --- |
| Bookmarks, notes, prompts, and project records | Stored in the local application profile |
| Treasure Box assets | Originals are referenced by default; clipboard images are stored in the library. Expiring recycle-bin entries remove library-owned files while preserving external originals |
| Project indexes and content snapshots | Stored under `project-files` in the active profile; explicit snapshots use additional disk space |
| AI and online operations | Relevant content, instructions, or tool results are sent as needed to services you configure, which may charge fees. Local-first does not mean every optional feature runs offline |
| External agents | Access follows application permissions and authorized directories. Actions an external agent performs independently on the operating system are outside STArra's confirmation mechanism |

**A Capsule is a personal backup and migration package, not a sanitized client-delivery package.** Project/date filters apply to original files; complete application records and library-owned files may still include other projects and model credentials. Review a package before sharing it. Older JSON/index exports do not contain every original file. External-agent authorizations and connection settings need to be configured again after migration.

First-run content consists of public websites, original prompt examples and illustrations, offline shortcuts, guides, and demonstrations. It does not include the developer's private projects, assets, or credentials. Updated guide notes do not forcibly replace copies users have edited.

[Data and migration — Chinese](docs/数据与迁移.md) · [Detailed backup scope — Chinese](docs/备份与迁移.md)

## Current scope and roadmap

| Available | Requires explicit user action | Not implemented |
| --- | --- | --- |
| File board, version groups, relationship graph, and content snapshots | Confirm scans, refresh directories, verify relationships, and save snapshots | Automatic professional dependency parsing, scheduled snapshots, and geometric difference analysis |
| Notes, task timeline, optional AI, and local MCP | Configure model providers, authorize folders, and approve changes | Cloud collaboration and general computer control |
| Star Notes task entry point | Associate and review task content | Full functionality planned for 星轨 and 星镜 |

v0.3.4 passed both TypeScript checks, 238 regression tests, and isolated-data interface and package validation. Preview availability and visual effects still depend on file structure, Windows thumbnail providers, and graphics hardware. Files without previews can be opened in their original applications.

## Documentation and support

- [Documentation index — Chinese](docs/README.md)
- [Project file board — Chinese](docs/织梦台文件看板.md) · [Appearance — Chinese](docs/外观配色与质感.md)
- [Release notes — Chinese](docs/releases/v0.3.4.md) · [Changelog — Chinese](CHANGELOG.md)
- [Product story — Chinese](docs/STARRA-闪星品牌故事.md)

For a bug report, open a [GitHub issue](https://github.com/IYNAIT0110/Musy-desktop-assist-saftware/issues) with the application version, Windows version, reproduction steps, and a screenshot. For preview problems, include the file extension and relevant thumbnail-provider information. Do not attach credentials or private project originals.

## Source availability and licensing

Current application source is developed in a private repository. This public repository preserves the v0.2.0 source and historical releases, and distributes approved binaries, user documentation, notices, and issue tracking. **The automatically generated Source code archives on a Release page are not the complete source for the current application.**

Original project code is covered by the [MIT license](LICENSE). Third-party components retain their own terms: Bodoni Moda uses the OFL, and React Bits components include MIT + Commons Clause conditions restricting resale or redistribution as standalone component products. See [Third-party notices](THIRD_PARTY_NOTICES.md).
