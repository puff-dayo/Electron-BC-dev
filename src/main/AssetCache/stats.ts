let hits = 0;
let misses = 0;
let bytesSaved = 0;

export function recordHit(bytes: number) {
  hits++;
  if (bytes > 0) bytesSaved += bytes;
}

export function recordMiss() {
  misses++;
}

export interface CacheStats {
  hits: number;
  misses: number;
  bytesSaved: number;
}

export function getStats(): CacheStats {
  return { hits, misses, bytesSaved };
}
