import LZString from 'lz-string';

export interface CompressionResult {
  compressed: string;
  originalBytes: number;
  compressedBytes: number;
  savedBytes: number;
  reductionPercentage: number;
  timestamp: string;
}

/**
 * Losslessly compresses any JSON serializable object using LZ-String Base64 encoding.
 * Base64 output is 100% safe to store in PostgreSQL text/varchar columns, JSON fields, or Supabase Storage.
 */
export function compressData<T>(data: T): CompressionResult {
  try {
    const jsonString = JSON.stringify(data);
    const originalBytes = new Blob([jsonString]).size;
    
    // Compress into safe URL-safe / standard Base64 representation
    const compressed = LZString.compressToBase64(jsonString) || '';
    const compressedBytes = new Blob([compressed]).size;
    const savedBytes = Math.max(0, originalBytes - compressedBytes);
    const reductionPercentage = originalBytes > 0 
      ? Number(((savedBytes / originalBytes) * 100).toFixed(1)) 
      : 0;

    return {
      compressed,
      originalBytes,
      compressedBytes,
      savedBytes,
      reductionPercentage,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Compression failed:', error);
    // Fallback in case of unexpected stringification issue
    const fallbackStr = String(data);
    return {
      compressed: fallbackStr,
      originalBytes: fallbackStr.length,
      compressedBytes: fallbackStr.length,
      savedBytes: 0,
      reductionPercentage: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Decompresses a Base64-compressed string back into its original typed TypeScript object.
 * Also handles uncompressed fallback gracefully if legacy data exists.
 */
export function decompressData<T>(compressedString: string): T | null {
  if (!compressedString) return null;

  try {
    // Attempt LZ-String Base64 decompression first
    const decompressed = LZString.decompressFromBase64(compressedString);
    if (decompressed) {
      return JSON.parse(decompressed) as T;
    }

    // Fallback: If it was stored as raw JSON string without compression
    return JSON.parse(compressedString) as T;
  } catch (error) {
    console.error('Decompression failed:', error);
    return null;
  }
}

/**
 * Helper to display human-readable byte sizes (B, KB, MB)
 */
export function formatByteSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
