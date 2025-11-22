/**
 * OCR管理 - Dataverse連携サービス
 * 
 * OCRメニューセクション、フォルダ、ドキュメント、処理結果の
 * Dataverse CRUD操作を提供します。
 * 
 * @module ocrDataverseService
 */

import { Cx_ocrmenusectionsesService } from '@/generated/services/Cx_ocrmenusectionsesService';
import { Cx_ocrfoldersService } from '@/generated/services/Cx_ocrfoldersService';
import { Cx_ocrdocumentsesService } from '@/generated/services/Cx_ocrdocumentsesService';
import type { Cx_ocrmenusectionses } from '@/generated/models/Cx_ocrmenusectionsesModel';
import type { Cx_ocrfolders } from '@/generated/models/Cx_ocrfoldersModel';
import type { Cx_ocrdocumentses } from '@/generated/models/Cx_ocrdocumentsesModel';
import type { MenuSection, OcrFolder, OcrDocument } from '@/types';

/**
 * OCR管理Dataverseサービス
 * 
 * Dataverseとの連携を行うメインサービスクラスです。
 * 生成されたサービスをラップし、アプリケーション型とDataverse型の変換を行います。
 */
export class OcrDataverseService {
  /**
   * メニューセクション一覧を取得
   */
  async getMenuSections(): Promise<MenuSection[]> {
    try {
      const result = await Cx_ocrmenusectionsesService.getAll({
        orderBy: ['cx_displayorder asc'],
      });

      if (result.success === false) {
        console.warn('⚠️ メニューセクション取得失敗、モックデータを返します');
        return [
          {
            id: 'all-docs',
            name: 'すべてのドキュメント',
            description: 'すべてのOCRドキュメント',
            displayOrder: 1,
            isDefault: true,
            color: '#3b82f6',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        ];
      }

      const data = result.data || (result as any);
      const records = Array.isArray(data) ? data : [];
      return records.map((record: Cx_ocrmenusectionses) => ({
        id: record.cx_ocrmenusectionsid || '',
        name: record.cx_name || '',
        description: record.cx_description,
        displayOrder: parseInt(record.cx_displayorder || '0'),
        isDefault: record.cx_isdefault === 1,
        color: record.cx_color,
        createdAt: record.createdon ? new Date(record.createdon) : new Date(),
        updatedAt: record.modifiedon ? new Date(record.modifiedon) : new Date(),
      }));
    } catch (error) {
      console.error('❌ メニューセクション取得エラー:', error);
      return [
        {
          id: 'all-docs',
          name: 'すべてのドキュメント',
          description: 'すべてのOCRドキュメント',
          displayOrder: 1,
          isDefault: true,
          color: '#3b82f6',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
    }
  }

  /**
   * メニューセクションを追加
   */
  async createMenuSection(section: Partial<MenuSection>): Promise<MenuSection> {
    try {
      // 表示順序を自動設定
      if (!section.displayOrder) {
        const allSections = await this.getMenuSections();
        section.displayOrder = allSections.length + 1;
      }

      const record: Omit<Cx_ocrmenusectionses, 'cx_ocrmenusectionsid'> = {
        cx_name: section.name,
        cx_description: section.description,
        cx_displayorder: section.displayOrder?.toString(),
        cx_isdefault: section.isDefault === true ? true : false, // Boolean型
        cx_color: section.color || '#3b82f6',
      } as any;

      const result = await Cx_ocrmenusectionsesService.create(record);

      if (result.success === false) {
        const errorMsg = result.error?.message || 'メニューセクションの作成に失敗しました';
        console.error('❌ Create failed:', {
          success: result.success,
          error: result.error,
          sentData: record
        });
        throw new Error(errorMsg);
      }

      const data = result.data || (result as any);
      return {
        id: data.cx_ocrmenusectionsid || '',
        name: data.cx_name || '',
        description: data.cx_description,
        displayOrder: parseInt(data.cx_displayorder || '0'),
        isDefault: data.cx_isdefault === 1,
        color: data.cx_color,
        createdAt: data.createdon ? new Date(data.createdon) : new Date(),
        updatedAt: data.modifiedon ? new Date(data.modifiedon) : new Date(),
      };
    } catch (error) {
      console.error('❌ メニューセクション追加エラー:', error);
      throw error;
    }
  }

  /**
   * メニューセクションを更新
   */
  async updateMenuSection(id: string, updates: Partial<MenuSection>): Promise<MenuSection> {
    try {
      const record: Partial<Omit<Cx_ocrmenusectionses, 'cx_ocrmenusectionsid'>> = {};
      if (updates.name !== undefined) record.cx_name = updates.name;
      if (updates.description !== undefined) record.cx_description = updates.description;
      if (updates.displayOrder !== undefined) record.cx_displayorder = updates.displayOrder.toString();
      if (updates.isDefault !== undefined) record.cx_isdefault = (updates.isDefault === true ? true : false) as any; // Boolean型
      if (updates.color !== undefined) record.cx_color = updates.color;

      const result = await Cx_ocrmenusectionsesService.update(id, record as any);

      if (result.success === false) {
        throw new Error('メニューセクションの更新に失敗しました');
      }

      const data = result.data || (result as any);
      return {
        id: data.cx_ocrmenusectionsid || id,
        name: data.cx_name || '',
        description: data.cx_description,
        displayOrder: parseInt(data.cx_displayorder || '0'),
        isDefault: data.cx_isdefault === 1,
        color: data.cx_color,
        createdAt: data.createdon ? new Date(data.createdon) : new Date(),
        updatedAt: data.modifiedon ? new Date(data.modifiedon) : new Date(),
      };
    } catch (error) {
      console.error('❌ メニューセクション更新エラー:', error);
      throw error;
    }
  }

  /**
   * メニューセクションを削除
   */
  async deleteMenuSection(id: string): Promise<void> {
    try {
      await Cx_ocrmenusectionsesService.delete(id);
    } catch (error) {
      console.error('❌ メニューセクション削除エラー:', error);
      throw error;
    }
  }

  /**
   * フォルダ一覧を取得
   */
  async getFolders(menuSectionId?: string): Promise<OcrFolder[]> {
    try {
      const options: any = {
        orderBy: ['cx_name asc']
      };

      if (menuSectionId) {
        options.filter = `cx_menusectionid eq '${menuSectionId}'`;
      }

      const result = await Cx_ocrfoldersService.getAll(options);

      if (result.success === false) {
        console.warn('⚠️ フォルダ取得失敗、空配列を返します');
        return [];
      }

      const data = result.data || (result as any);
      const records = Array.isArray(data) ? data : [];
      return records.map(this.mapFolder);
    } catch (error) {
      console.error('❌ フォルダ取得エラー:', error);
      return [];
    }
  }

  /**
   * フォルダを追加
   */
  async createFolder(folder: Partial<OcrFolder>): Promise<OcrFolder> {
    try {
      // Lookupフィールドは@odata.bind形式で指定
      const record: any = {
        cx_name: folder.name,
        cx_description: folder.description,
        cx_path: folder.path,
        cx_documentcount: '0',
        cx_foldercount: '0',
      };

      // 親フォルダIDがある場合
      if (folder.parentId) {
        record['cx_parentfolderid@odata.bind'] = `/cx_ocrfolders(${folder.parentId})`;
      }

      // メニューセクションIDがある場合（Lookup形式で設定）
      if (folder.menuSection) {
        record['cx_menusectionid@odata.bind'] = `/cx_ocrmenusectionses(${folder.menuSection})`;
      }

      const result = await Cx_ocrfoldersService.create(record);

      if (result.success === false) {
        const errorMsg = result.error?.message || 'フォルダの作成に失敗しました';
        console.error('❌ Folder create failed:', {
          success: result.success,
          error: result.error,
          sentData: record
        });
        throw new Error(errorMsg);
      }

      const data = result.data || (result as any);
      return this.mapFolder(data);
    } catch (error) {
      console.error('❌ フォルダ追加エラー:', error);
      throw error;
    }
  }

  /**
   * フォルダを更新
   */
  async updateFolder(folderId: string, updates: Partial<OcrFolder>): Promise<OcrFolder> {
    try {
      const record: any = {};
      if (updates.name !== undefined) record.cx_name = updates.name;
      if (updates.description !== undefined) record.cx_description = updates.description;
      if (updates.path !== undefined) record.cx_path = updates.path;

      // 親フォルダIDの更新（Lookup形式）
      if (updates.parentId !== undefined) {
        if (updates.parentId === null) {
          record['cx_parentfolderid@odata.bind'] = null;
        } else {
          record['cx_parentfolderid@odata.bind'] = `/cx_ocrfolders(${updates.parentId})`;
        }
      }

      // メニューセクションIDの更新（Lookup形式）
      if (updates.menuSection !== undefined) {
        if (updates.menuSection === null || updates.menuSection === '') {
          record['cx_menusectionid@odata.bind'] = null;
        } else {
          record['cx_menusectionid@odata.bind'] = `/cx_ocrmenusectionses(${updates.menuSection})`;
        }
      }

      const result = await Cx_ocrfoldersService.update(folderId, record);

      if (result.success === false) {
        throw new Error('フォルダの更新に失敗しました');
      }

      const data = result.data || (result as any);
      return this.mapFolder(data);
    } catch (error) {
      console.error('❌ フォルダ更新エラー:', error);
      throw error;
    }
  }

  /**
   * フォルダを削除
   */
  async deleteFolder(folderId: string): Promise<void> {
    try {
      await Cx_ocrfoldersService.delete(folderId);
    } catch (error) {
      console.error('❌ フォルダ削除エラー:', error);
      throw error;
    }
  }

  /**
   * ドキュメント一覧を取得
   */
  async getDocuments(folderId?: string): Promise<OcrDocument[]> {
    try {
      const options: any = {
        orderBy: ['createdon desc']
      };

      if (folderId) {
        options.filter = `_cx_folderid_value eq '${folderId}'`;
      }

      const result = await Cx_ocrdocumentsesService.getAll(options);

      if (result.success === false) {
        console.warn('⚠️ ドキュメント取得失敗、空配列を返します');
        return [];
      }

      const data = result.data || (result as any);
      const records = Array.isArray(data) ? data : [];
      return records.map(this.mapDocument);
    } catch (error) {
      console.error('❌ ドキュメント取得エラー:', error);
      return [];
    }
  }

  /**
   * ドキュメントを追加（ファイルアップロード）
   */
  async createDocument(document: Partial<OcrDocument>, file: File): Promise<OcrDocument> {
    try {
      // まず基本レコードを作成（ファイル列なし）
      const record: any = {
        cx_name: document.name || file.name,
        cx_filename: file.name,
        cx_filetype: file.type,
        cx_filesize: file.size.toString(), // 文字列に変換
        cx_status: 0, // アップロード済み
      };

      if (document.description) {
        record.cx_description = document.description;
      }

      if (document.tags && document.tags.length > 0) {
        record.cx_tags = document.tags.join(',');
      }

      // フォルダIDをLookup形式で設定
      if (document.folderId) {
        record['cx_folderid@odata.bind'] = `/cx_ocrfolders(${document.folderId})`;
      }

      // レコードを作成
      const result = await Cx_ocrdocumentsesService.create(record);

      if (result.success === false) {
        const errorMsg = result.error?.message || 'ドキュメントのアップロードに失敗しました';
        throw new Error(errorMsg);
      }

      const data = result.data || (result as any);
      const documentId = data.cx_ocrdocumentsid;

      // ファイルを別途アップロード（PATCH リクエスト）
      await this.uploadFileData(documentId, file);

      return this.mapDocument(data);
    } catch (error) {
      console.error('❌ ドキュメントアップロードエラー:', error);
      throw error;
    }
  }

  /**
   * ファイルデータをアップロード（PATCH）
   */
  private async uploadFileData(documentId: string, file: File): Promise<void> {
    try {
      const fileBase64 = await this.fileToBase64(file);

      // Dataverse File列の形式
      const fileData = {
        cx_filedata: fileBase64
      };

      await Cx_ocrdocumentsesService.update(documentId, fileData);
    } catch (error) {
      console.error('❌ ファイルデータアップロードエラー:', error);
      throw error;
    }
  }

  /**
   * ファイルをBase64文字列に変換
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // data:image/jpeg;base64, の部分を除去
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * ドキュメントを削除
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await Cx_ocrdocumentsesService.delete(documentId);
    } catch (error) {
      console.error('❌ ドキュメント削除エラー:', error);
      throw error;
    }
  }

  /**
   * DataverseレコードをOcrFolder型に変換
   */
  private mapFolder(record: Cx_ocrfolders): OcrFolder {
    // Lookupフィールドは _fieldname_value 形式で取得
    const recordAny = record as any;
    const menuSectionId = recordAny['_cx_menusectionid_value'] || '';
    const parentFolderId = recordAny['_cx_parentfolderid_value'] || null;

    return {
      id: record.cx_ocrfolderid || '',
      name: record.cx_name || '',
      description: record.cx_description,
      color: '#3b82f6', // フォルダの色はメニューセクションから取得するため、デフォルト色を設定
      parentId: parentFolderId,
      menuSection: menuSectionId,
      path: record.cx_path || '',
      documentCount: parseInt(record.cx_documentcount || '0'),
      folderCount: parseInt(record.cx_foldercount || '0'),
      createdAt: record.createdon ? new Date(record.createdon) : new Date(),
      updatedAt: record.modifiedon ? new Date(record.modifiedon) : new Date(),
      createdBy: record.createdby || '',
    };
  }


  /**
   * 複数のドキュメントを一括削除
   */
  async deleteDocuments(documentIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of documentIds) {
      try {
        await this.deleteDocument(id);
        success++;
      } catch (error) {
        console.error(`❌ ドキュメント削除失敗 (ID: ${id}):`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * DataverseレコードをOcrDocument型に変換
   */
  private mapDocument(record: Cx_ocrdocumentses): OcrDocument {
    // Lookupフィールドは _fieldname_value 形式で取得
    const recordAny = record as any;
    const folderId = recordAny['_cx_folderid_value'] || '';

    // ステータスを文字列に変換
    const statusMap: Record<number, OcrDocument['status']> = {
      0: 'uploaded',
      1: 'pending',
      2: 'processing',
      3: 'completed',
      4: 'error'
    };
    const status = statusMap[record.cx_status as number] || 'uploaded';

    return {
      id: record.cx_ocrdocumentsid || '',
      name: record.cx_name || '',
      fileName: record.cx_filename || '',
      fileType: record.cx_filetype || '',
      fileSize: parseInt(record.cx_filesize || '0'),
      fileUrl: record.cx_fileurl || '',
      thumbnailUrl: record.cx_thumbnailurl,
      folderId: folderId,
      status: status,
      tags: record.cx_tags ? record.cx_tags.split(',').map(t => t.trim()) : undefined,
      description: record.cx_description,
      uploadedBy: recordAny['_cx_uploadedby_value'] || '',
      uploadedDate: record.cx_uploadeddate ? new Date(record.cx_uploadeddate) : new Date(),
      createdAt: record.createdon ? new Date(record.createdon) : new Date(),
      updatedAt: record.modifiedon ? new Date(record.modifiedon) : new Date(),
    };
  }
}

/**
 * シングルトンインスタンス
 */
const ocrDataverseService = new OcrDataverseService();

export default ocrDataverseService;
