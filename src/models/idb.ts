/**
 * 极简 IndexedDB KV 封装 —— 简历数据的主存储。
 *
 * 为什么不用 localStorage：5-10MB 上限，照片一多就爆；IndexedDB 起步几百 MB。
 * value 支持字符串与结构化克隆值（如 FileSystemDirectoryHandle）。
 */

const DB_NAME = 'pdfgo'
const DB_VERSION = 1
const STORE = 'kv'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    let settled = false
    // 打开失败即重置缓存，下次调用重新尝试；超时熔断防止 pending 删除请求导致永久白屏
    const fail = (err: unknown) => {
      if (settled) return
      settled = true
      dbPromise = null
      clearTimeout(timer)
      reject(err instanceof Error ? err : new Error(String(err)))
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    const timer = setTimeout(() => fail(new Error('IndexedDB 打开超时')), 8000)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => {
      if (settled) {
        req.result.close()
        return
      }
      settled = true
      clearTimeout(timer)
      resolve(req.result)
    }
    req.onerror = () => fail(req.error ?? new Error('IndexedDB 打开失败'))
    req.onblocked = () => fail(new Error('IndexedDB 被其他页面阻塞'))
  })
  return dbPromise
}

function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        let result: T
        const tx = db.transaction(STORE, mode)
        const req = run(tx.objectStore(STORE))
        // 以事务提交为准 —— 请求成功不代表落盘，提前 resolve 会在页面关闭等场景丢数据
        tx.oncomplete = () => resolve(result)
        tx.onabort = () => reject(tx.error ?? new Error('IndexedDB 事务中止'))
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB 事务失败'))
        req.onsuccess = () => {
          result = req.result
        }
      }),
  )
}

export async function idbGet<T = unknown>(key: string): Promise<T | null> {
  try {
    const v = await withStore<T | undefined>('readonly', (s) => s.get(key) as IDBRequest<T | undefined>)
    return v === undefined ? null : v
  } catch {
    return null
  }
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  await withStore('readwrite', (s) => s.put(value, key))
}

export async function idbDel(key: string): Promise<void> {
  await withStore('readwrite', (s) => s.delete(key))
}

/** IDB 完全不可用（隐私模式禁用等）时为 true，上层据此切换只读警示 */
export async function idbHealthy(): Promise<boolean> {
  try {
    await idbSet('__probe__', 1)
    await idbDel('__probe__')
    return true
  } catch {
    return false
  }
}
