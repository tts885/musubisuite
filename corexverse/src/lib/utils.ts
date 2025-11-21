import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * バイト数を人間が読みやすい形式に変換
 * 
 * @param {number} bytes - バイト数
 * @param {number} decimals - 小数点以下の桁数
 * @returns {string} フォーマットされた文字列
 * 
 * @example
 * ```ts
 * formatBytes(1024)       // "1 KB"
 * formatBytes(1234567)    // "1.18 MB"
 * formatBytes(1234567, 0) // "1 MB"
 * ```
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
