export interface AssetRoot { id: string; path: string }
export interface AssetGroup { id: string; name: string }
export interface AssetItem {
  id: string
  name: string
  originalName: string
  ext: string
  kind: 'image' | 'model' | 'document' | 'video' | 'audio' | 'font' | 'other'
  storageMode: 'reference'
  rootId: string
  relativePath: string
  size: number
  modifiedAt: number
  createdAt: number
  updatedAt: number
  lastOpenedAt?: number
  groupId: string
  tags: string[]
  note: string
  sourceUrl: string
  author: string
  licenseNote: string
  cover?: string
  deletedAt?: number
}
export interface AssetView extends AssetItem { absolutePath: string; available: boolean }
export interface ImportJob {
  id: string
  inputs: string[]
  state: 'running' | 'completed' | 'canceled' | 'interrupted' | 'failed'
  scanned: number
  imported: number
  duplicates: number
  failed: number
  errors: string[]
  startedAt: number
}
export interface AssetCatalog {
  version: 1
  folderGrouping?: 'root'
  libraryId: string
  roots: AssetRoot[]
  groups: AssetGroup[]
  items: AssetItem[]
  job?: ImportJob
  lastBackup?: number
}
export interface TreasureStatus {
  path: string | null
  count: number
  trashCount: number
  groups: AssetGroup[]
  roots: AssetRoot[]
  job?: ImportJob
  lastBackup?: number
  recovery?: string
}
export interface AssetQuery { text?: string; tag?: string; groupId?: string; kind?: string; sort?: 'newest' | 'name' | 'recent' | 'modified' | 'size'; trash?: boolean; offset?: number }
export type AssetPatch = Partial<Pick<AssetItem, 'name' | 'groupId' | 'tags' | 'note' | 'sourceUrl' | 'author' | 'licenseNote'>>
export interface TreasureDrop {
  paths: string[]
  images: { name: string; bytes: Uint8Array }[]
}
export interface AssetPreviewSession {
  ids: string[]
  mode: 'single' | 'compare'
  index: number
  pinned: boolean
}
export interface TreasureApi {
  status(): Promise<TreasureStatus>
  chooseLibrary(): Promise<boolean>
  query(query: AssetQuery): Promise<{ items: AssetView[]; total: number }>
  get(id: string): Promise<AssetView>
  importFiles(mode: 'files' | 'folder' | 'retry'): Promise<boolean>
  importPaths(paths: string[]): Promise<boolean>
  importClipboard(): Promise<'files' | 'image'>
  importDrop(drop: TreasureDrop): Promise<boolean>
  dragOut(ids: string[]): Promise<void>
  openPreview(ids: string[], mode: 'single' | 'compare', index?: number): Promise<void>
  previewSession(): Promise<AssetPreviewSession | null>
  previewControl(action: 'close' | 'pin'): Promise<boolean>
  onPreviewChange(callback: () => void): () => void
  onDragState(callback: (active: boolean) => void): () => void
  cancelImport(): Promise<void>
  update(ids: string[], patch: AssetPatch): Promise<void>
  group(action: 'add' | 'rename' | 'delete' | 'move', name: string, id?: string, direction?: number): Promise<void>
  remove(ids: string[], restore?: boolean): Promise<void>
  thumbnail(id: string, large?: boolean, refresh?: boolean): Promise<string | null>
  setCover(id: string): Promise<boolean>
  open(id: string, action: 'open' | 'folder' | 'copy'): Promise<void>
  relink(rootId: string): Promise<boolean>
  locate(id: string): Promise<boolean>
  backup(): Promise<boolean>
  restore(): Promise<boolean>
}
