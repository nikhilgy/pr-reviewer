// Utility functions to ensure data is serializable

/**
 * Deep clone and serialize an object to ensure it's safe to pass between server and client
 */
export function serializeForClient<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeForClient) as T
  }
  
  if (typeof obj === 'object') {
    // Handle Date objects
    if (obj instanceof Date) {
      return obj.toISOString() as T
    }
    
    // Handle plain objects
    const serialized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip functions and symbols
      if (typeof value === 'function' || typeof value === 'symbol') {
        continue
      }
      serialized[key] = serializeForClient(value)
    }
    return serialized as T
  }
  
  return obj
}

/**
 * Test if an object can be serialized
 */
export function isSerializable(obj: any): boolean {
  try {
    JSON.stringify(obj)
    return true
  } catch {
    return false
  }
}

/**
 * Create a safe version of an object that can be passed to client components
 */
export function createSafeObject<T>(obj: T): T {
  const serialized = serializeForClient(obj)
  
  if (!isSerializable(serialized)) {
    throw new Error('Object cannot be serialized for client components')
  }
  
  return serialized
} 