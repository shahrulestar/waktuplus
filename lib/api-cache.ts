/**
 * Utility untuk caching API responses dalam localStorage
 * dengan auto-sync selepas beberapa saat
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  key: string
}

const CACHE_PREFIX = "waktuplus_api_cache_"
const SYNC_DELAY = 3000 // 3 saat sebelum sync dengan API

/**
 * Dapatkan data dari cache atau fetch dari API
 * @param cacheKey - Kunci untuk cache
 * @param fetchFn - Function untuk fetch dari API
 * @param ttl - Time to live dalam milliseconds (default: 24 jam)
 */
export async function getCachedData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = 24 * 60 * 60 * 1000,
): Promise<T> {
  const fullKey = `${CACHE_PREFIX}${cacheKey}`
  
  // Dapatkan dari cache terlebih dahulu
  const cached = getFromCache<T>(fullKey, ttl)
  
  if (cached) {
    // Return cached data immediately
    // Sync dengan API selepas delay
    setTimeout(async () => {
      try {
        const freshData = await fetchFn()
        saveToCache(fullKey, freshData)
      } catch (error) {
        console.error(`Failed to sync ${cacheKey}:`, error)
      }
    }, SYNC_DELAY)
    
    return cached
  }
  
  // Jika tiada cache, fetch dari API
  try {
    const data = await fetchFn()
    saveToCache(fullKey, data)
    return data
  } catch (error) {
    console.error(`Failed to fetch ${cacheKey}:`, error)
    throw error
  }
}

/**
 * Dapatkan data dari cache
 */
function getFromCache<T>(key: string, ttl: number): T | null {
  if (typeof window === "undefined") return null
  
  try {
    const item = localStorage.getItem(key)
    if (!item) return null
    
    const entry: CacheEntry<T> = JSON.parse(item)
    const now = Date.now()
    
    // Check if cache is still valid
    if (now - entry.timestamp > ttl) {
      localStorage.removeItem(key)
      return null
    }
    
    return entry.data
  } catch (error) {
    console.error("Error reading from cache:", error)
    return null
  }
}

/**
 * Simpan data ke cache
 */
function saveToCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return
  
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      key,
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch (error) {
    console.error("Error saving to cache:", error)
    // Jika storage penuh, cuba clear cache lama
    try {
      clearOldCache()
      localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now(), key }))
    } catch (e) {
      console.error("Failed to save to cache after cleanup:", e)
    }
  }
}

/**
 * Clear cache lama (lebih dari 7 hari)
 */
function clearOldCache(): void {
  if (typeof window === "undefined") return
  
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const item = localStorage.getItem(key)
          if (item) {
            const entry = JSON.parse(item)
            if (entry.timestamp < sevenDaysAgo) {
              localStorage.removeItem(key)
            }
          }
        } catch (e) {
          // Jika corrupt, remove
          localStorage.removeItem(key)
        }
      }
    }
  } catch (error) {
    console.error("Error clearing old cache:", error)
  }
}

/**
 * Clear semua cache
 */
export function clearAllCache(): void {
  if (typeof window === "undefined") return
  
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  } catch (error) {
    console.error("Error clearing all cache:", error)
  }
}
