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
import { logger } from '@/lib/logger';

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
        logger.warn('メニューセクション取得失敗、モックデータを返します', result.error);
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
      logger.error('メニューセクション取得エラー', error);
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
        logger.error('メニューセクション作成失敗', result.error, { sentData: record });
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
      logger.error('メニューセクション追加エラー', error);
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
      logger.error('メニューセクション更新エラー', error);
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
      logger.error('メニューセクション削除エラー', error);
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
        logger.warn('フォルダ取得失敗、空配列を返します', result.error);
        return [];
      }

      const data = result.data || (result as any);
      const records = Array.isArray(data) ? data : [];
      return records.map(this.mapFolder);
    } catch (error) {
      logger.error('フォルダ取得エラー', error);
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
        logger.error('フォルダ作成失敗', result.error, { sentData: record });
        throw new Error(errorMsg);
      }

      const data = result.data || (result as any);
      return this.mapFolder(data);
    } catch (error) {
      logger.error('フォルダ追加エラー', error);
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
      logger.error('フォルダ更新エラー', error);
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
      logger.error('フォルダ削除エラー', error);
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
        // 注意: cx_filedata_fullqualityはカスタム列のため、自動的に含まれる
        // select オプションで明示的に指定するとエラーになる
      };

      if (folderId) {
        options.filter = `_cx_folderid_value eq '${folderId}'`;
      }

      const result = await Cx_ocrdocumentsesService.getAll(options);

      if (result.success === false) {
        logger.warn('ドキュメント取得失敗、空配列を返します', result.error);
        return [];
      }

      const data = result.data || (result as any);
      const records = Array.isArray(data) ? data : [];
      return records.map(this.mapDocument);
    } catch (error) {
      logger.error('ドキュメント取得エラー', error);
      return [];
    }
  }

  /**
   * 特定のドキュメントを取得
   */
  async getDocumentById(documentId: string): Promise<OcrDocument | null> {
    try {
      // getメソッドで単一レコードを取得
      // 注意: cx_filedata_fullqualityはカスタム列のため、デフォルトで含まれる
      const result = await Cx_ocrdocumentsesService.get(documentId);

      if (result.success === false) {
        logger.warn('ドキュメント取得失敗', result.error);
        return null;
      }

      const record = result.data || (result as any);
      
      if (!record) {
        logger.warn('ドキュメントが見つかりません', { documentId });
        return null;
      }

      logger.info('[Dataverse取得] ドキュメントレコード取得', {
        id: record.cx_ocrdocumentsid,
        fileName: record.cx_filename,
        hasFileData: !!record.cx_filedata,
        fileDataLength: record.cx_filedata ? record.cx_filedata.length : 0,
        fileType: record.cx_filetype,
        fileUrl: record.cx_fileurl
      });

      const document = this.mapDocument(record);

      // ファイルデータがある場合、Blob URLを生成
      const base64Data = record.cx_filedata;
      
      if (base64Data) {
        try {
          logger.info('[データ取得確認]', {
            fileName: record.cx_filename,
            hasImageData: !!base64Data,
            imageDataLength: base64Data?.length || 0
          });
          
          const dataSource = 'cx_filedata (画像列)';
          
          logger.info('[Base64→Blob変換] 開始', { 
            fileName: record.cx_filename,
            fileType: record.cx_filetype,
            base64Length: base64Data.length,
            estimatedSizeMB: (base64Data.length * 0.75 / 1024 / 1024).toFixed(2),
            dataSource: dataSource,
            base64Preview: base64Data.substring(0, 50) + '...' // Base64の最初の50文字を確認
          });
          
          // 正しいMIMEタイプを使用して高品質な画像を保持
          const mimeType = record.cx_filetype || 'image/jpeg';
          const blob = this.base64ToBlob(base64Data, mimeType);
          
          // Blobから実際の画像サイズを確認
          const blobUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            logger.info('[画像サイズ検証] Dataverseから取得した画像の実際のサイズ', {
              fileName: record.cx_filename,
              width: img.width,
              height: img.height,
              blobSize: blob.size,
              blobSizeMB: (blob.size / 1024 / 1024).toFixed(2),
              mimeType: blob.type,
              expectedSize: record.cx_filesize
            });
            
            // サイズが小さすぎる場合は警告
            if (img.width < 200 || img.height < 200) {
              logger.error('[画像品質問題] Dataverseに保存された画像が低解像度です!', {
                fileName: record.cx_filename,
                width: img.width,
                height: img.height,
                message: 'アップロード時に画像が圧縮またはリサイズされている可能性があります'
              });
            }
          };
          img.src = blobUrl;
          
          logger.info('[Blob URL生成] 成功', { 
            fileName: record.cx_filename,
            blobSize: blob.size,
            blobSizeMB: (blob.size / 1024 / 1024).toFixed(2),
            mimeType: blob.type
          });
          
          document.fileUrl = blobUrl;
        } catch (error) {
          logger.error('[Base64→Blob変換] エラー', error);
        }
      } else {
        logger.warn('cx_filedata フィールドが空です');
        // Dataverseのファイル列は特別なダウンロードURLを使用する必要がある
        // ファイルダウンロード用のURLを構築
        try {
          const fileDownloadUrl = await this.getFileDownloadUrl(documentId, 'cx_filedata');
          if (fileDownloadUrl) {
            document.fileUrl = fileDownloadUrl;
            logger.debug('ファイルダウンロードURLを使用', { fileUrl: document.fileUrl });
          }
        } catch (error) {
          logger.error('ファイルダウンロードURL取得エラー', error);
        }
      }

      return document;
    } catch (error) {
      logger.error('ドキュメント取得エラー', error);
      return null;
    }
  }

  /**
   * Dataverseファイル列のダウンロードURLを取得
   * 
   * 注意: Power Apps内では直接Web APIを呼び出すことができないため、
   * ファイルデータはレコード作成時にBase64として保存し、
   * cx_fileurlフィールドに保存されたBlobURLを使用する必要があります。
   */
  private async getFileDownloadUrl(_recordId: string, _fileColumnName: string): Promise<string | null> {
    logger.warn('ファイル列の直接ダウンロードはPower Apps環境では制限されています。');
    logger.info('ヒント: アップロード時にcx_fileurlフィールドにBlobURLを保存してください。');
    return null;
  }

  /**
   * Base64文字列をBlobに変換
   * 
   * @param base64 - Base64エンコードされた文字列（プレフィックス付きでも可）
   * @param contentType - MIMEタイプ（例: image/jpeg, image/png）
   * @returns Blobオブジェクト
   */
  private base64ToBlob(base64: string, contentType: string): Blob {
    try {
      // Data URLプレフィックス（data:image/jpeg;base64,）を除去
      let base64Data = base64;
      if (base64.includes(',')) {
        base64Data = base64.split(',')[1];
      }
      
      // Base64デコード
      const byteCharacters = atob(base64Data);
      const byteArrays: Uint8Array[] = [];
      
      // 大きなファイルのため、チャンク単位で処理
      const sliceSize = 8192;
      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      
      return new Blob(byteArrays, { type: contentType });
    } catch (error) {
      logger.error('Base64→Blob変換エラー', error);
      throw new Error('画像データの変換に失敗しました');
    }
  }

  /**
   * ドキュメントを追加（ファイルアップロード）
   */
  async createDocument(document: Partial<OcrDocument>, file: File): Promise<OcrDocument> {
    try {
      // サポートされている画像形式を検証
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      if (!supportedTypes.includes(file.type)) {
        throw new Error(`サポートされていないファイル形式です: ${file.type}`);
      }
      
      logger.debug('ファイルアップロード開始', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      // ファイルからBlobURLを生成
      const blobUrl = URL.createObjectURL(file);
      
      // まず基本レコードを作成（ファイル列なし）
      const record: any = {
        cx_name: document.name || file.name,
        cx_filename: file.name,
        cx_filetype: file.type,
        cx_filesize: file.size.toString(), // 文字列に変換
        cx_fileurl: blobUrl, // BlobURLを保存（フォールバック用）
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

      // レコードを再取得してfileUrlを含めて返す
      const uploadedDoc = await this.getDocumentById(documentId);
      return uploadedDoc || this.mapDocument(data);
    } catch (error) {
      logger.error('ドキュメントアップロードエラー', error);
      throw error;
    }
  }

  /**
   * ファイルデータをアップロード（PATCH）
   * 
   * Dataverseの画像列(cx_filedata)に画像をアップロード
   */
  private async uploadFileData(documentId: string, file: File): Promise<void> {
    try {
      logger.debug('ファイルデータアップロード開始', {
        documentId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
      
      const fileBase64 = await this.fileToBase64(file);
      
      logger.info('[Base64変換] 完了', {
        fileName: file.name,
        base64Length: fileBase64.length,
        estimatedSizeMB: (fileBase64.length * 0.75 / 1024 / 1024).toFixed(2),
        originalSizeMB: (file.size / 1024 / 1024).toFixed(2)
      });

      // cx_filedata（画像列）にBase64データを保存
      // 注意: Dataverseの画像列は自動的にリサイズされる可能性があります
      const fileData = {
        cx_filedata: fileBase64
      };

      await Cx_ocrdocumentsesService.update(documentId, fileData);
      
      logger.info('[Dataverse保存] ファイルデータアップロード成功', { 
        documentId,
        fileName: file.name,
        base64Length: fileBase64.length,
        savedTo: 'cx_filedata (画像列)'
      });
    } catch (error) {
      logger.error('ファイルデータアップロードエラー', { 
        documentId, 
        fileName: file.name,
        error 
      });
      throw new Error(`画像のアップロードに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * ファイルをBase64文字列に変換
   * 
   * @param file - 変換するファイル
   * @returns Data URLプレフィックスを除いたBase64文字列
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const result = reader.result as string;
          
          if (!result) {
            throw new Error('ファイルの読み込みに失敗しました');
          }
          
          // Data URLプレフィックス（data:image/jpeg;base64,）を除去
          const base64Data = result.includes(',') ? result.split(',')[1] : result;
          
          if (!base64Data || base64Data.length === 0) {
            throw new Error('Base64データが空です');
          }
          
          logger.debug('ファイル→Base64変換成功', {
            fileName: file.name,
            fileType: file.type,
            originalSize: file.size,
            base64Length: base64Data.length
          });
          
          resolve(base64Data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        logger.error('FileReader エラー', error);
        reject(new Error('ファイルの読み込み中にエラーが発生しました'));
      };
      
      // 画像ファイルをData URLとして読み込み（品質を保持）
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
      logger.error('ドキュメント削除エラー', error);
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
        logger.error(`ドキュメント削除失敗 (ID: ${id})`, error);
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
