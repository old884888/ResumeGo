/**
 * 自动备份文件夹 —— 基于 File System Access API。
 *
 * 用户在设置里绑定一个本地文件夹，句柄持久化到 IndexedDB；此后每次保存简历，
 * 防抖把全量备份写入 `简白备份.json`。数据依旧不出本机 —— 这只是往用户自己
 * 指定的文件夹写一个文件，浏览器数据被清空也炸不掉它。
 *
 * 权限模型（Chrome 行为）：句柄持久化后每次启动 queryPermission 通常返回
 * 'prompt'，需要一次用户手势 re-request；'granted' 则静默写盘。
 */

const DIR_KEY = 'backupDir'
export const BACKUP_FILENAME = '简白备份.json'

import { idbGet, idbSet, idbDel } from './idb'

export function fsSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export type FsPerm = 'granted' | 'prompt' | 'denied'

interface DirInfo {
  handle: FileSystemDirectoryHandle
  name: string
}

/** 弹出文件夹选择器（需用户手势）。成功后句柄持久化。 */
export async function pickBackupDir(): Promise<DirInfo | null> {
  if (!fsSupported()) return null
  try {
    const handle = await (
      window as unknown as {
        showDirectoryPicker: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle>
      }
    ).showDirectoryPicker({ mode: 'readwrite' })
    // 选择器带 mode:'readwrite' 时授权通常即刻生效，这里查询确认
    const perm = await queryBackupPerm(handle)
    if (perm === 'denied') return null
    await saveDir(handle)
    return { handle, name: handle.name }
  } catch {
    return null // 用户取消选择
  }
}

export async function loadBackupDir(): Promise<DirInfo | null> {
  try {
    const handle = await idbGet<FileSystemDirectoryHandle>(DIR_KEY)
    if (!handle) return null
    return { handle, name: handle.name }
  } catch {
    return null
  }
}

export async function clearBackupDir(): Promise<void> {
  await idbDel(DIR_KEY)
}

async function saveDir(handle: FileSystemDirectoryHandle): Promise<void> {
  await idbSet(DIR_KEY, handle)
}

/** 查询已保存句柄的当前权限（不弹任何窗） */
export async function queryBackupPerm(handle: FileSystemDirectoryHandle): Promise<FsPerm> {
  const h = handle as unknown as {
    queryPermission?: (d?: { mode?: string }) => Promise<FsPerm>
  }
  if (!h.queryPermission) return 'granted'
  try {
    return await h.queryPermission({ mode: 'readwrite' })
  } catch {
    return 'denied'
  }
}

/** 请求读写权限（必须在用户手势的调用栈里） */
export async function requestBackupPerm(handle: FileSystemDirectoryHandle): Promise<FsPerm> {
  const h = handle as unknown as {
    requestPermission?: (d?: { mode?: string }) => Promise<FsPerm>
  }
  if (!h.requestPermission) return 'granted'
  try {
    return await h.requestPermission({ mode: 'readwrite' })
  } catch {
    return 'denied'
  }
}

/** 把备份文本写入绑定文件夹；失败（权限丢失/磁盘问题）返回 false */
export async function writeBackupFile(handle: FileSystemDirectoryHandle, content: string): Promise<boolean> {
  try {
    const fh = await handle.getFileHandle(BACKUP_FILENAME, { create: true })
    const w = await fh.createWritable()
    await w.write(content)
    await w.close()
    return true
  } catch {
    return false
  }
}
