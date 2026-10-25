import { stat } from 'fs/promises'
import type { TreasureStore } from './treasureStore'

export async function resolveDragFiles(store: TreasureStore, ids: string[]): Promise<string[]> {
  if (!ids.length || ids.length > 60) throw new Error('请选中 1–60 个素材后拖出')
  const files = await Promise.all([...new Set(ids)].map(async id => {
    const item = store.item(id)
    if (item.deletedAt) throw new Error('请先从回收区恢复素材，再拖出使用')
    const file = store.path(item)
    if (!(await stat(file).then(info => info.isFile()).catch(() => false))) throw new Error('原文件缺失，请先重新定位：' + item.name)
    return file
  }))
  return [...new Set(files)]
}
