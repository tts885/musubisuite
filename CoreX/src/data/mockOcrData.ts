/**
 * OCR機能用モックデータ
 * 
 * ファイル単位でのOCRドキュメント管理用テストデータ
 * 
 * @module mockOcrData
 */

import type { OcrDocument, OcrResult, OcrField, OcrFolder } from '@/types'

/**
 * モックOCRフォルダ
 * 階層構造のフォルダツリー
 */
export const mockOcrFolders: OcrFolder[] = [
  // ルートフォルダ
  {
    id: 'folder_root_1',
    name: '請求書',
    description: '取引先からの請求書類',
    color: '#3b82f6',
    parentId: null,
    path: '/請求書',
    createdAt: new Date('2024-11-01T10:00:00'),
    updatedAt: new Date('2024-11-17T10:00:00'),
    createdBy: 'user_001',
    documentCount: 3,
    folderCount: 2,
    isExpanded: true,
    menuSection: 'all-docs',
  },
  {
    id: 'folder_root_2',
    name: '見積書',
    description: 'クライアント向け見積書類',
    color: '#10b981',
    parentId: null,
    path: '/見積書',
    createdAt: new Date('2024-11-05T14:00:00'),
    updatedAt: new Date('2024-11-17T11:00:00'),
    createdBy: 'user_002',
    documentCount: 1,
    folderCount: 1,
    isExpanded: true,
    menuSection: 'all-docs',
  },
  {
    id: 'folder_root_3',
    name: '契約書',
    description: '契約関連書類',
    color: '#8b5cf6',
    parentId: null,
    path: '/契約書',
    createdAt: new Date('2024-11-10T09:00:00'),
    updatedAt: new Date('2024-11-15T16:00:00'),
    createdBy: 'user_001',
    documentCount: 0,
    folderCount: 1,
    isExpanded: false,
    menuSection: 'all-docs',
  },
  // サブフォルダ - 請求書配下
  {
    id: 'folder_invoice_2024',
    name: '2024年度',
    description: '2024年度の請求書',
    color: '#3b82f6',
    parentId: 'folder_root_1',
    path: '/請求書/2024年度',
    createdAt: new Date('2024-11-01T10:30:00'),
    updatedAt: new Date('2024-11-17T10:30:00'),
    createdBy: 'user_001',
    documentCount: 4,
    folderCount: 0,
    isExpanded: true,
    menuSection: 'all-docs',
  },
  {
    id: 'folder_invoice_2023',
    name: '2023年度',
    description: '2023年度の請求書',
    color: '#3b82f6',
    parentId: 'folder_root_1',
    path: '/請求書/2023年度',
    createdAt: new Date('2023-11-01T10:00:00'),
    updatedAt: new Date('2023-12-31T23:59:00'),
    createdBy: 'user_001',
    documentCount: 2,
    folderCount: 0,
    isExpanded: false,
    menuSection: 'all-docs',
  },
  // サブフォルダ - 見積書配下
  {
    id: 'folder_estimate_2024',
    name: '2024年度',
    description: '2024年度の見積書',
    color: '#10b981',
    parentId: 'folder_root_2',
    path: '/見積書/2024年度',
    createdAt: new Date('2024-11-05T14:30:00'),
    updatedAt: new Date('2024-11-17T11:00:00'),
    createdBy: 'user_002',
    documentCount: 2,
    folderCount: 0,
    isExpanded: true,
    menuSection: 'all-docs',
  },
  // サブフォルダ - 契約書配下
  {
    id: 'folder_contract_pending',
    name: '承認待ち',
    description: '未承認の契約書',
    color: '#f59e0b',
    parentId: 'folder_root_3',
    path: '/契約書/承認待ち',
    createdAt: new Date('2024-11-10T09:30:00'),
    updatedAt: new Date('2024-11-15T16:00:00'),
    createdBy: 'user_001',
    documentCount: 2,
    folderCount: 0,
    isExpanded: false,
    menuSection: 'all-docs',
  },
]

/**
 * モックOCRフィールドデータ - 請求書1
 */
const mockOcrFields1: OcrField[] = [
  {
    id: 'field_1_1',
    label: '請求書番号',
    value: 'INV-2024-001',
    confidence: 0.98,
    boundingBox: { x: 450, y: 80, width: 200, height: 30 },
    type: 'text',
    isEdited: false,
  },
  {
    id: 'field_1_2',
    label: '発行日',
    value: '2024年11月15日',
    confidence: 0.95,
    boundingBox: { x: 450, y: 120, width: 180, height: 30 },
    type: 'date',
    isEdited: false,
  },
  {
    id: 'field_1_3',
    label: '請求先会社名',
    value: '株式会社サンプル商事',
    confidence: 0.97,
    boundingBox: { x: 100, y: 200, width: 300, height: 35 },
    type: 'text',
    isEdited: false,
  },
  {
    id: 'field_1_9',
    label: '合計金額',
    value: '¥935,000',
    confidence: 0.99,
    boundingBox: { x: 500, y: 680, width: 150, height: 35 },
    type: 'number',
    isEdited: false,
  },
]

/**
 * モックOCRフィールドデータ - 請求書2
 */
const mockOcrFields2: OcrField[] = [
  {
    id: 'field_2_1',
    label: '請求書番号',
    value: 'INV-2024-002',
    confidence: 0.96,
    boundingBox: { x: 450, y: 80, width: 200, height: 30 },
    type: 'text',
    isEdited: false,
  },
  {
    id: 'field_2_2',
    label: '発行日',
    value: '2024年11月16日',
    confidence: 0.94,
    boundingBox: { x: 450, y: 120, width: 180, height: 30 },
    type: 'date',
    isEdited: false,
  },
  {
    id: 'field_2_3',
    label: '請求先会社名',
    value: '株式会社テクノロジー',
    confidence: 0.95,
    boundingBox: { x: 100, y: 200, width: 300, height: 35 },
    type: 'text',
    isEdited: false,
  },
  {
    id: 'field_2_9',
    label: '合計金額',
    value: '¥1,250,000',
    confidence: 0.97,
    boundingBox: { x: 500, y: 680, width: 150, height: 35 },
    type: 'number',
    isEdited: false,
  },
]

/**
 * モックOCRフィールドデータ - 請求書3
 */
const mockOcrFields3: OcrField[] = [
  {
    id: 'field_3_1',
    label: '請求書番号',
    value: 'INV-2024-003',
    confidence: 0.99,
    boundingBox: { x: 450, y: 80, width: 200, height: 30 },
    type: 'text',
    isEdited: false,
  },
  {
    id: 'field_3_2',
    label: '発行日',
    value: '2024年11月16日',
    confidence: 0.93,
    boundingBox: { x: 450, y: 120, width: 180, height: 30 },
    type: 'date',
    isEdited: false,
  },
  {
    id: 'field_3_9',
    label: '合計金額',
    value: '¥680,000',
    confidence: 0.98,
    boundingBox: { x: 500, y: 680, width: 150, height: 35 },
    type: 'number',
    isEdited: false,
  },
]

/**
 * モックOCRフィールドデータ - 請求書4
 */
const mockOcrFields4: OcrField[] = [
  {
    id: 'field_4_1',
    label: '請求書番号',
    value: 'INV-2024-004',
    confidence: 0.92,
    boundingBox: { x: 450, y: 80, width: 200, height: 30 },
    type: 'text',
    isEdited: false,
  },
  {
    id: 'field_4_9',
    label: '合計金額',
    value: '¥1,580,000',
    confidence: 0.96,
    boundingBox: { x: 500, y: 680, width: 150, height: 35 },
    type: 'number',
    isEdited: false,
  },
]

/**
 * モックOCR結果データ
 */
const mockOcrResults: OcrResult[] = [
  {
    id: 'result_1',
    documentId: 'doc_1',
    fileName: '請求書サンプル１.png',
    fields: mockOcrFields1,
    status: 'completed',
    overallConfidence: 0.96,
    processedAt: new Date('2024-11-17T10:30:00'),
  },
  {
    id: 'result_2',
    documentId: 'doc_2',
    fileName: '請求書サンプル２.png',
    fields: mockOcrFields2,
    status: 'completed',
    overallConfidence: 0.95,
    processedAt: new Date('2024-11-17T10:35:00'),
  },
  {
    id: 'result_3',
    documentId: 'doc_3',
    fileName: '1012_請求書サンプル４.png',
    fields: mockOcrFields3,
    status: 'completed',
    overallConfidence: 0.97,
    processedAt: new Date('2024-11-17T10:40:00'),
  },
  {
    id: 'result_4',
    documentId: 'doc_4',
    fileName: '1013_請求書サンプル３.png',
    fields: mockOcrFields4,
    status: 'completed',
    overallConfidence: 0.94,
    processedAt: new Date('2024-11-17T10:45:00'),
  },
  {
    id: 'result_5',
    documentId: 'doc_5',
    fileName: '請求書サンプル５.png',
    fields: mockOcrFields1,
    status: 'completed',
    overallConfidence: 0.93,
    processedAt: new Date('2024-11-17T11:00:00'),
  },
  {
    id: 'result_6',
    documentId: 'doc_6',
    fileName: '請求書サンプル６.png',
    fields: mockOcrFields2,
    status: 'completed',
    overallConfidence: 0.96,
    processedAt: new Date('2024-11-17T11:05:00'),
  },
  {
    id: 'result_7',
    documentId: 'doc_7',
    fileName: '1010_サンプル請求書３.jpg',
    fields: mockOcrFields3,
    status: 'completed',
    overallConfidence: 0.95,
    processedAt: new Date('2024-11-17T11:10:00'),
  },
  {
    id: 'result_8',
    documentId: 'doc_8',
    fileName: '1011_サンプル請求書２.png',
    fields: mockOcrFields4,
    status: 'completed',
    overallConfidence: 0.92,
    processedAt: new Date('2024-11-17T11:15:00'),
  },
]

/**
 * モックOCRドキュメント一覧
 * 各ファイルが1つのドキュメント
 */
export const mockOcrDocuments: OcrDocument[] = [
  {
    id: 'doc_1',
    fileName: '請求書サンプル１.png',
    fileType: 'image/png',
    fileSize: 245600,
    fileUrl: '/src/data/testimages/請求書サンプル１.png',
    ocrResult: mockOcrResults[0],
    uploadedBy: 'user_001',
    uploadedAt: new Date('2024-11-17T10:00:00'),
    updatedAt: new Date('2024-11-17T10:15:00'),
    tags: ['請求書', '2024年11月'],
    folderId: 'folder_invoice_2024',
  },
  {
    id: 'doc_2',
    fileName: '請求書サンプル２.png',
    fileType: 'image/png',
    fileSize: 236789,
    fileUrl: '/src/data/testimages/請求書サンプル２.png',
    ocrResult: mockOcrResults[1],
    uploadedBy: 'user_002',
    uploadedAt: new Date('2024-11-17T10:15:00'),
    updatedAt: new Date('2024-11-17T10:30:00'),
    tags: ['請求書', '2024年10月'],
    folderId: 'folder_invoice_2024',
  },
  {
    id: 'doc_3',
    fileName: '1012_請求書サンプル４.png',
    fileType: 'image/png',
    fileSize: 212345,
    fileUrl: '/src/data/testimages/1012_請求書サンプル４.png',
    ocrResult: mockOcrResults[2],
    uploadedBy: 'user_002',
    uploadedAt: new Date('2024-11-17T10:27:00'),
    updatedAt: new Date('2024-11-17T10:40:00'),
    tags: ['請求書', '2024年11月'],
    folderId: 'folder_invoice_2024',
  },
  {
    id: 'doc_4',
    fileName: '1013_請求書サンプル３.png',
    fileType: 'image/png',
    fileSize: 256789,
    fileUrl: '/src/data/testimages/1013_請求書サンプル３.png',
    ocrResult: mockOcrResults[3],
    uploadedBy: 'user_002',
    uploadedAt: new Date('2024-11-17T10:32:00'),
    updatedAt: new Date('2024-11-17T10:50:00'),
    tags: ['請求書', '2024年9月'],
    folderId: 'folder_invoice_2024',
  },
  {
    id: 'doc_5',
    fileName: '請求書サンプル５.png',
    fileType: 'image/png',
    fileSize: 234567,
    fileUrl: '/src/data/testimages/請求書サンプル５.png',
    ocrResult: mockOcrResults[4],
    uploadedBy: 'user_001',
    uploadedAt: new Date('2024-11-17T10:50:00'),
    updatedAt: new Date('2024-11-17T11:00:00'),
    tags: ['請求書', '2024年11月'],
    folderId: 'folder_root_1',
  },
  {
    id: 'doc_6',
    fileName: '請求書サンプル６.png',
    fileType: 'image/png',
    fileSize: 242890,
    fileUrl: '/src/data/testimages/請求書サンプル６.png',
    ocrResult: mockOcrResults[5],
    uploadedBy: 'user_002',
    uploadedAt: new Date('2024-11-17T11:00:00'),
    updatedAt: new Date('2024-11-17T11:05:00'),
    tags: ['請求書', '2024年11月'],
    folderId: 'folder_root_1',
  },
  {
    id: 'doc_7',
    fileName: '1010_サンプル請求書３.jpg',
    fileType: 'image/jpeg',
    fileSize: 312456,
    fileUrl: '/src/data/testimages/1010_サンプル請求書３.jpg',
    ocrResult: mockOcrResults[6],
    uploadedBy: 'user_001',
    uploadedAt: new Date('2024-11-17T11:05:00'),
    updatedAt: new Date('2024-11-17T11:10:00'),
    tags: ['請求書', '2024年11月'],
    folderId: 'folder_root_2',
  },
  {
    id: 'doc_8',
    fileName: '1011_サンプル請求書２.png',
    fileType: 'image/png',
    fileSize: 267890,
    fileUrl: '/src/data/testimages/1011_サンプル請求書２.png',
    ocrResult: mockOcrResults[7],
    uploadedBy: 'user_002',
    uploadedAt: new Date('2024-11-17T11:10:00'),
    updatedAt: new Date('2024-11-17T11:15:00'),
    tags: ['請求書', '2024年11月'],
    folderId: 'folder_estimate_2024',
  },
  {
    id: 'doc_9',
    fileName: '請求書_2024_005.pdf',
    fileType: 'application/pdf',
    fileSize: 189234,
    fileUrl: '/uploads/doc_9.pdf',
    ocrResult: null,
    uploadedBy: 'user_001',
    uploadedAt: new Date('2024-11-17T11:20:00'),
    updatedAt: new Date('2024-11-17T11:20:00'),
    tags: ['請求書', '処理待ち'],
    folderId: 'folder_contract_pending',
  },
  {
    id: 'doc_10',
    fileName: '見積書_2024_128.pdf',
    fileType: 'application/pdf',
    fileSize: 201456,
    fileUrl: '/uploads/doc_10.pdf',
    ocrResult: null,
    uploadedBy: 'user_003',
    uploadedAt: new Date('2024-11-17T11:25:00'),
    updatedAt: new Date('2024-11-17T11:25:00'),
    tags: ['見積書', '処理待ち'],
    folderId: 'folder_contract_pending',
  },
]

/**
 * ドキュメントを検索
 */
export function searchDocuments(keyword: string): OcrDocument[] {
  if (!keyword.trim()) {
    return mockOcrDocuments
  }
  
  const lowerKeyword = keyword.toLowerCase()
  return mockOcrDocuments.filter(doc => 
    doc.fileName.toLowerCase().includes(lowerKeyword) ||
    doc.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
  )
}

/**
 * IDでドキュメントを取得
 */
export function getDocumentById(docId: string): OcrDocument | undefined {
  return mockOcrDocuments.find(doc => doc.id === docId)
}

/**
 * ステータス別の統計を取得
 */
export function getDocumentStats() {
  const total = mockOcrDocuments.length
  const completed = mockOcrDocuments.filter(doc => doc.ocrResult?.status === 'completed').length
  const pending = mockOcrDocuments.filter(doc => doc.ocrResult === null).length
  
  return {
    total,
    completed,
    pending,
    processing: 0, // 現在処理中のものはなし
    failed: 0,     // 現在失敗はなし
  }
}

/**
 * タグでフィルター
 */
export function filterDocumentsByTag(tag: string): OcrDocument[] {
  return mockOcrDocuments.filter(doc => doc.tags.includes(tag))
}

/**
 * 処理ステータスでフィルター
 */
export function filterDocumentsByStatus(status: 'completed' | 'pending' | 'processing' | 'failed'): OcrDocument[] {
  if (status === 'completed') {
    return mockOcrDocuments.filter(doc => doc.ocrResult?.status === 'completed')
  } else if (status === 'pending') {
    return mockOcrDocuments.filter(doc => doc.ocrResult === null)
  } else if (status === 'processing') {
    return mockOcrDocuments.filter(doc => doc.ocrResult?.status === 'processing')
  } else if (status === 'failed') {
    return mockOcrDocuments.filter(doc => doc.ocrResult?.status === 'failed')
  }
  return []
}

// ============================================
// フォルダ関連のヘルパー関数
// ============================================

/**
 * すべてのフォルダを取得
 */
export function getAllFolders(folders: OcrFolder[] = mockOcrFolders): OcrFolder[] {
  return folders
}

/**
 * IDでフォルダを取得
 */
export function getFolderById(folderId: string, folders: OcrFolder[] = mockOcrFolders): OcrFolder | undefined {
  return folders.find(folder => folder.id === folderId)
}

/**
 * フォルダに属するドキュメントを取得
 */
export function getDocumentsByFolder(folderId: string): OcrDocument[] {
  return mockOcrDocuments.filter(doc => doc.folderId === folderId)
}

/**
 * 子フォルダを取得
 */
export function getChildFolders(parentId: string | null, folders: OcrFolder[] = mockOcrFolders): OcrFolder[] {
  return folders.filter(folder => folder.parentId === parentId)
}

/**
 * ルートフォルダを取得
 */
export function getRootFolders(folders: OcrFolder[] = mockOcrFolders): OcrFolder[] {
  return getChildFolders(null, folders)
}

/**
 * フォルダツリーを構築(再帰的)
 */
export interface FolderTreeNode extends OcrFolder {
  children: FolderTreeNode[]
}

export function buildFolderTree(parentId: string | null = null, folderList: OcrFolder[] = mockOcrFolders): FolderTreeNode[] {
  const folders = getChildFolders(parentId, folderList)
  return folders.map(folder => ({
    ...folder,
    children: buildFolderTree(folder.id, folderList),
  }))
}

/**
 * フォルダ別の統計を取得
 */
export function getFolderStats(folderId: string, _folders?: OcrFolder[]) {
  const documents = getDocumentsByFolder(folderId)
  const total = documents.length
  const completed = documents.filter(doc => doc.ocrResult?.status === 'completed').length
  const pending = documents.filter(doc => doc.ocrResult === null).length
  
  return {
    total,
    completed,
    pending,
    processing: 0,
    failed: 0,
  }
}

/**
 * 全フォルダの統計を取得
 */
export function getAllFoldersWithStats() {
  return mockOcrFolders.map(folder => ({
    ...folder,
    stats: getFolderStats(folder.id),
  }))
}
