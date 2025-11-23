/**
 * アプリケーション全体で使用する定数
 */

// ページネーション設定
export const PAGINATION = {
  ITEMS_PER_PAGE: 20,
  ITEMS_PER_PAGE_OPTIONS: [10, 20, 50, 100],
} as const

// ポーリング間隔（ミリ秒）
export const POLLING_INTERVALS = {
  DOCUMENT_STATUS: 30_000, // 30秒
  FOLDER_SYNC: 60_000, // 1分
  ACTIVITY_LOG: 15_000, // 15秒
} as const

// ファイルアップロード制限
export const FILE_UPLOAD = {
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.bmp'] as const,
  MIME_TYPES: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/tiff',
    'image/bmp'
  ] as const,
} as const

// タイムアウト設定（ミリ秒）
export const TIMEOUTS = {
  API_REQUEST: 30_000, // 30秒
  FILE_UPLOAD: 120_000, // 2分
  OCR_PROCESSING: 300_000, // 5分
} as const

// ローカルストレージキー
export const STORAGE_KEYS = {
  LAST_PATH: 'app-last-path',
  EXPLICIT_HOME: 'app-explicit-home',
  OCR_STATE: 'ocr-state',
  USER_PREFERENCES: 'user-preferences',
} as const

// OCRステータス
export const OCR_STATUS = {
  UPLOADED: 'uploaded',
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

// メニューセクション
export const MENU_SECTIONS = {
  DOCUMENT_MANAGEMENT: 'document-management',
  CONTRACT_MANAGEMENT: 'contract-management',
  INVOICE_MANAGEMENT: 'invoice-management',
  RECEIPT_MANAGEMENT: 'receipt-management',
  CUSTOM: 'custom',
} as const

// デフォルトフォルダID
export const DEFAULT_FOLDER_IDS = {
  ALL_DOCUMENTS: 'all-docs',
  RECENT: 'recent',
  ARCHIVED: 'archived',
  TRASH: 'trash',
} as const

// アニメーション設定（ミリ秒）
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const

// Debounce/Throttle時間（ミリ秒）
export const TIMING = {
  DEBOUNCE_SEARCH: 300,
  DEBOUNCE_INPUT: 500,
  THROTTLE_SCROLL: 100,
  THROTTLE_RESIZE: 200,
} as const

// APIエンドポイント（環境変数で上書き可能）
export const API_ENDPOINTS = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  DATAVERSE_URL: import.meta.env.VITE_DATAVERSE_URL || '',
} as const

// 日付フォーマット
export const DATE_FORMATS = {
  DISPLAY: 'yyyy/MM/dd',
  DISPLAY_WITH_TIME: 'yyyy/MM/dd HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
} as const

// カラーパレット（TailwindCSSクラス名）
export const COLORS = {
  STATUS: {
    SUCCESS: 'bg-green-500',
    WARNING: 'bg-yellow-500',
    ERROR: 'bg-red-500',
    INFO: 'bg-blue-500',
    PENDING: 'bg-gray-400',
  },
  PRIMARY: 'bg-indigo-600',
  SECONDARY: 'bg-gray-600',
} as const

// アクセシビリティ設定
export const A11Y = {
  MIN_CONTRAST_RATIO: 4.5,
  MIN_TOUCH_TARGET_SIZE: 44, // px
  FOCUS_VISIBLE_CLASS: 'ring-2 ring-indigo-500 ring-offset-2',
} as const
