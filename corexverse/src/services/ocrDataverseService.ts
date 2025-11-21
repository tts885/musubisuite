/**
 * OCR管理 - Dataverse連携サービス
 * 
 * OCRメニューセクション、フォルダ、ドキュメント、処理結果の
 * Dataverse CRUD操作を提供します。
 * 
 * @module ocrDataverseService
 * 
 * @remarks
 * このサービスを使用する前に、以下のテーブルをDataverseに作成する必要があります:
 * - cr_ocrmenusections (メニューセクション)
 * - cr_ocrfolders (フォルダ)
 * - cr_ocrdocuments (ドキュメント)
 * - cr_ocrresults (OCR処理結果)
 * - cr_ocrfields (OCRフィールド)
 * 
 * @example
 * ```typescript
 * const service = new OcrDataverseService();
 * 
 * // メニューセクション取得
 * const sections = await service.getMenuSections();
 * 
 * // フォルダ取得
 * const folders = await service.getFolders('menu-section-id');
 * 
 * // フォルダ追加
 * const newFolder = await service.createFolder({
 *   name: '請求書',
 *   menuSection: 'menu-section-id',
 *   parentId: null
 * });
 * ```
 */

import type { 
  OcrFolder, 
  OcrDocument, 
  OcrResult, 
  OcrField,
  BoundingBox 
} from '@/types';

/**
 * メニューセクション型 (Dataverseレコード)
 */
export interface MenuSectionRecord {
  cr_ocrmenusectionid: string;
  cr_name: string;
  cr_description?: string;
  cr_displayorder: number;
  cr_isdefault: boolean;
  cr_color?: string;
  cr_createdby?: string;
  createdon: string;
  modifiedon: string;
}

/**
 * フォルダ型 (Dataverseレコード)
 */
export interface FolderRecord {
  cr_ocrfolderid: string;
  cr_name: string;
  cr_description?: string;
  cr_color?: string;
  cr_parentfolderid?: string;
  cr_menusectionid: string;
  cr_path: string;
  cr_documentcount: number;
  cr_foldercount: number;
  cr_createdby: string;
  createdon: string;
  modifiedon: string;
}

/**
 * ドキュメント型 (Dataverseレコード)
 */
export interface DocumentRecord {
  cr_ocrdocumentid: string;
  cr_filename: string;
  cr_filetype: string;
  cr_filesize: number;
  cr_fileurl: string;
  cr_thumbnailurl?: string;
  cr_folderid?: string;
  cr_projectid?: string;
  cr_tags?: string;
  cr_uploadedby: string;
  cr_uploadeddate: string;
  createdon: string;
  modifiedon: string;
}

/**
 * OCR処理結果型 (Dataverseレコード)
 */
export interface OcrResultRecord {
  cr_ocrresultid: string;
  cr_name: string;
  cr_documentid: string;
  cr_status: number; // 1: pending, 2: processing, 3: completed, 4: failed
  cr_rawtext?: string;
  cr_overallconfidence: number;
  cr_processeddate?: string;
  cr_errormessage?: string;
  createdon: string;
  modifiedon: string;
}

/**
 * OCRフィールド型 (Dataverseレコード)
 */
export interface OcrFieldRecord {
  cr_ocrfieldid: string;
  cr_ocrresultid: string;
  cr_label: string;
  cr_value: string;
  cr_confidence: number;
  cr_fieldtype: number; // 1: text, 2: number, 3: date, 4: datetime, 5: email, 6: phone, 7: address
  cr_boundingbox_x: number;
  cr_boundingbox_y: number;
  cr_boundingbox_width: number;
  cr_boundingbox_height: number;
  cr_isedited: boolean;
  createdon: string;
  modifiedon: string;
}

/**
 * OCR管理Dataverseサービス
 * 
 * Dataverseとの連携を行うメインサービスクラスです。
 * 生成されたサービス(CrOcrmenusectionsServiceなど)をラップし、
 * アプリケーション型とDataverse型の変換を行います。
 */
export class OcrDataverseService {
  /**
   * メニューセクション一覧を取得
   * 
   * @returns {Promise<MenuSectionRecord[]>} メニューセクション配列
   * 
   * @example
   * ```typescript
   * const sections = await service.getMenuSections();
   * console.log(sections[0].cr_name); // "すべてのドキュメント"
   * ```
   */
  async getMenuSections(): Promise<MenuSectionRecord[]> {
    try {
      // TODO: 生成されたサービスを使用
      // const records = await CrOcrmenusectionsService.getAll();
      // return records;
      
      console.log('📋 メニューセクション取得 (モック)');
      
      // モックデータ (開発用)
      return [
        {
          cr_ocrmenusectionid: 'all-docs',
          cr_name: 'すべてのドキュメント',
          cr_description: 'すべてのOCRドキュメント',
          cr_displayorder: 1,
          cr_isdefault: true,
          cr_color: '#3b82f6',
          createdon: new Date().toISOString(),
          modifiedon: new Date().toISOString(),
        }
      ];
    } catch (error) {
      console.error('❌ メニューセクション取得エラー:', error);
      throw error;
    }
  }

  /**
   * メニューセクションを追加
   * 
   * @param {Partial<MenuSectionRecord>} section - メニューセクション情報
   * @returns {Promise<MenuSectionRecord>} 作成されたメニューセクション
   */
  async createMenuSection(section: Partial<MenuSectionRecord>): Promise<MenuSectionRecord> {
    try {
      // TODO: 生成されたサービスを使用
      // const record = {
      //   cr_name: section.cr_name!,
      //   cr_description: section.cr_description,
      //   cr_displayorder: section.cr_displayorder!,
      //   cr_isdefault: section.cr_isdefault!,
      //   cr_color: section.cr_color,
      // };
      // const created = await CrOcrmenusectionsService.create(record);
      // return created;
      
      console.log('➕ メニューセクション追加 (モック):', section);
      
      return {
        cr_ocrmenusectionid: crypto.randomUUID(),
        cr_name: section.cr_name!,
        cr_description: section.cr_description,
        cr_displayorder: section.cr_displayorder!,
        cr_isdefault: section.cr_isdefault ?? false,
        cr_color: section.cr_color,
        createdon: new Date().toISOString(),
        modifiedon: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ メニューセクション追加エラー:', error);
      throw error;
    }
  }

  /**
   * フォルダ一覧を取得
   * 
   * @param {string} [menuSectionId] - メニューセクションID(省略時は全フォルダ)
   * @returns {Promise<OcrFolder[]>} フォルダ配列
   * 
   * @example
   * ```typescript
   * // 特定メニューのフォルダ取得
   * const folders = await service.getFolders('all-docs');
   * 
   * // 全フォルダ取得
   * const allFolders = await service.getFolders();
   * ```
   */
  async getFolders(menuSectionId?: string): Promise<OcrFolder[]> {
    try {
      // TODO: 生成されたサービスを使用
      // const records = await CrOcrfoldersService.getAll();
      
      console.log('📁 フォルダ取得 (モック):', menuSectionId);
      
      // モックデータ (開発用)
      const mockRecords: FolderRecord[] = [
        {
          cr_ocrfolderid: 'folder_1',
          cr_name: '請求書',
          cr_description: '取引先からの請求書類',
          cr_color: '#3b82f6',
          cr_parentfolderid: undefined,
          cr_menusectionid: 'all-docs',
          cr_path: '/請求書',
          cr_documentcount: 3,
          cr_foldercount: 1,
          cr_createdby: 'user_001',
          createdon: new Date().toISOString(),
          modifiedon: new Date().toISOString(),
        }
      ];
      
      const filtered = menuSectionId 
        ? mockRecords.filter(r => r.cr_menusectionid === menuSectionId)
        : mockRecords;
      
      return filtered.map(this.mapFolder);
    } catch (error) {
      console.error('❌ フォルダ取得エラー:', error);
      throw error;
    }
  }

  /**
   * フォルダを追加
   * 
   * @param {Partial<OcrFolder>} folder - フォルダ情報
   * @returns {Promise<OcrFolder>} 作成されたフォルダ
   * 
   * @example
   * ```typescript
   * const folder = await service.createFolder({
   *   name: '見積書',
   *   description: 'クライアント向け見積書類',
   *   color: '#10b981',
   *   menuSection: 'all-docs',
   *   parentId: null
   * });
   * ```
   */
  async createFolder(folder: Partial<OcrFolder>): Promise<OcrFolder> {
    try {
      // TODO: 生成されたサービスを使用
      // const record = {
      //   cr_name: folder.name!,
      //   cr_description: folder.description,
      //   cr_color: folder.color,
      //   cr_parentfolderid: folder.parentId ?? undefined,
      //   cr_menusectionid: folder.menuSection!,
      //   cr_path: folder.path!,
      //   cr_documentcount: 0,
      //   cr_foldercount: 0,
      // };
      // const created = await CrOcrfoldersService.create(record);
      // return this.mapFolder(created);
      
      console.log('➕ フォルダ追加 (モック):', folder);
      
      const newRecord: FolderRecord = {
        cr_ocrfolderid: crypto.randomUUID(),
        cr_name: folder.name!,
        cr_description: folder.description,
        cr_color: folder.color,
        cr_parentfolderid: folder.parentId ?? undefined,
        cr_menusectionid: folder.menuSection!,
        cr_path: folder.path!,
        cr_documentcount: 0,
        cr_foldercount: 0,
        cr_createdby: 'current-user',
        createdon: new Date().toISOString(),
        modifiedon: new Date().toISOString(),
      };
      
      return this.mapFolder(newRecord);
    } catch (error) {
      console.error('❌ フォルダ追加エラー:', error);
      throw error;
    }
  }

  /**
   * フォルダを更新
   * 
   * @param {string} folderId - フォルダID
   * @param {Partial<OcrFolder>} updates - 更新内容
   * @returns {Promise<OcrFolder>} 更新されたフォルダ
   */
  async updateFolder(folderId: string, updates: Partial<OcrFolder>): Promise<OcrFolder> {
    try {
      // TODO: 生成されたサービスを使用
      // const record = {
      //   cr_name: updates.name,
      //   cr_description: updates.description,
      //   cr_color: updates.color,
      // };
      // const updated = await CrOcrfoldersService.update(folderId, record);
      // return this.mapFolder(updated);
      
      console.log('✏️ フォルダ更新 (モック):', folderId, updates);
      
      // モック実装
      return {
        id: folderId,
        name: updates.name!,
        description: updates.description,
        color: updates.color,
        parentId: updates.parentId ?? null,
        menuSection: updates.menuSection!,
        path: updates.path!,
        documentCount: 0,
        folderCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user',
      };
    } catch (error) {
      console.error('❌ フォルダ更新エラー:', error);
      throw error;
    }
  }

  /**
   * フォルダを削除
   * 
   * @param {string} folderId - フォルダID
   * @returns {Promise<void>}
   */
  async deleteFolder(folderId: string): Promise<void> {
    try {
      // TODO: 生成されたサービスを使用
      // await CrOcrfoldersService.delete(folderId);
      
      console.log('🗑️ フォルダ削除 (モック):', folderId);
    } catch (error) {
      console.error('❌ フォルダ削除エラー:', error);
      throw error;
    }
  }

  /**
   * ドキュメント一覧を取得
   * 
   * @param {string} [folderId] - フォルダID(省略時は全ドキュメント)
   * @returns {Promise<OcrDocument[]>} ドキュメント配列
   */
  async getDocuments(folderId?: string): Promise<OcrDocument[]> {
    try {
      // TODO: 生成されたサービスを使用
      // const records = await CrOcrdocumentsService.getAll();
      
      console.log('📄 ドキュメント取得 (モック):', folderId);
      
      // モックデータ (開発用)
      const mockRecords: DocumentRecord[] = [];
      
      const filtered = folderId
        ? mockRecords.filter(r => r.cr_folderid === folderId)
        : mockRecords;
      
      return filtered.map(this.mapDocument);
    } catch (error) {
      console.error('❌ ドキュメント取得エラー:', error);
      throw error;
    }
  }

  /**
   * ドキュメントを追加
   * 
   * @param {Partial<OcrDocument>} document - ドキュメント情報
   * @returns {Promise<OcrDocument>} 作成されたドキュメント
   */
  async createDocument(document: Partial<OcrDocument>): Promise<OcrDocument> {
    try {
      console.log('➕ ドキュメント追加 (モック):', document);
      
      // モック実装
      return {
        id: crypto.randomUUID(),
        fileName: document.fileName!,
        fileType: document.fileType!,
        fileSize: document.fileSize!,
        fileUrl: document.fileUrl!,
        thumbnailUrl: document.thumbnailUrl,
        folderId: document.folderId,
        projectId: document.projectId,
        tags: document.tags || [],
        uploadedBy: 'current-user',
        uploadedAt: new Date(),
        updatedAt: new Date(),
        ocrResult: null,
      };
    } catch (error) {
      console.error('❌ ドキュメント追加エラー:', error);
      throw error;
    }
  }

  /**
   * OCR処理結果を取得
   * 
   * @param {string} documentId - ドキュメントID
   * @returns {Promise<OcrResult | null>} OCR処理結果
   */
  async getOcrResult(documentId: string): Promise<OcrResult | null> {
    try {
      // TODO: 生成されたサービスを使用
      console.log('🔍 OCR結果取得 (モック):', documentId);
      return null;
    } catch (error) {
      console.error('❌ OCR結果取得エラー:', error);
      throw error;
    }
  }

  // ============================================
  // マッピング関数
  // ============================================

  /**
   * DataverseレコードをOcrFolder型に変換
   * 
   * @private
   * @param {FolderRecord} record - Dataverseレコード
   * @returns {OcrFolder} フォルダオブジェクト
   */
  private mapFolder(record: FolderRecord): OcrFolder {
    return {
      id: record.cr_ocrfolderid,
      name: record.cr_name,
      description: record.cr_description,
      color: record.cr_color,
      parentId: record.cr_parentfolderid ?? null,
      menuSection: record.cr_menusectionid,
      path: record.cr_path,
      documentCount: record.cr_documentcount,
      folderCount: record.cr_foldercount,
      createdAt: new Date(record.createdon),
      updatedAt: new Date(record.modifiedon),
      createdBy: record.cr_createdby,
    };
  }

  /**
   * DataverseレコードをOcrDocument型に変換
   * 
   * @private
   * @param {DocumentRecord} record - Dataverseレコード
   * @returns {OcrDocument} ドキュメントオブジェクト
   */
  private mapDocument(record: DocumentRecord): OcrDocument {
    return {
      id: record.cr_ocrdocumentid,
      fileName: record.cr_filename,
      fileType: record.cr_filetype,
      fileSize: record.cr_filesize,
      fileUrl: record.cr_fileurl,
      thumbnailUrl: record.cr_thumbnailurl,
      folderId: record.cr_folderid,
      projectId: record.cr_projectid,
      tags: record.cr_tags ? record.cr_tags.split(',') : [],
      uploadedBy: record.cr_uploadedby,
      uploadedAt: new Date(record.cr_uploadeddate),
      updatedAt: new Date(record.modifiedon),
      ocrResult: null, // 別途取得が必要
    };
  }

  /**
   * DataverseレコードをOcrResult型に変換
   * 
   * @private
   * @param {OcrResultRecord} record - Dataverseレコード
   * @param {OcrField[]} fields - フィールド配列
   * @returns {OcrResult} OCR処理結果オブジェクト
   */
  private mapOcrResult(record: OcrResultRecord, fields: OcrField[]): OcrResult {
    // ステータスマッピング: 1=pending, 2=processing, 3=completed, 4=failed
    const statusMap: Record<number, OcrResult['status']> = {
      1: 'pending',
      2: 'processing',
      3: 'completed',
      4: 'failed',
    };

    return {
      id: record.cr_ocrresultid,
      documentId: record.cr_documentid,
      fileName: record.cr_name,
      fields,
      status: statusMap[record.cr_status] || 'pending',
      rawText: record.cr_rawtext,
      overallConfidence: record.cr_overallconfidence,
      processedAt: record.cr_processeddate ? new Date(record.cr_processeddate) : new Date(),
    };
  }

  /**
   * DataverseレコードをOcrField型に変換
   * 
   * @private
   * @param {OcrFieldRecord} record - Dataverseレコード
   * @returns {OcrField} フィールドオブジェクト
   */
  private mapOcrField(record: OcrFieldRecord): OcrField {
    // フィールドタイプマッピング: 1=text, 2=number, 3=date, 4=datetime, 5=email, 6=phone, 7=address
    const typeMap: Record<number, OcrField['type']> = {
      1: 'text',
      2: 'number',
      3: 'date',
      5: 'email',
      6: 'phone',
      7: 'address',
    };

    const boundingBox: BoundingBox = {
      x: record.cr_boundingbox_x,
      y: record.cr_boundingbox_y,
      width: record.cr_boundingbox_width,
      height: record.cr_boundingbox_height,
    };

    return {
      id: record.cr_ocrfieldid,
      label: record.cr_label,
      value: record.cr_value,
      confidence: record.cr_confidence,
      boundingBox,
      type: typeMap[record.cr_fieldtype],
      isEdited: record.cr_isedited,
    };
  }
}

/**
 * シングルトンインスタンス
 */
export const ocrDataverseService = new OcrDataverseService();
