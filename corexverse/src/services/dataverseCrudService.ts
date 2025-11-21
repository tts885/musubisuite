/**
 * Dataverse CRUD 共通サービス
 * 
 * すべてのDataverseテーブルに対する汎用的なCRUD操作を提供します。
 * 型安全性を保ちながら、シンプルなAPIで操作できます。
 * 
 * @module services/dataverseCrudService
 */

import type { IGetOptions, IGetAllOptions } from '@/generated/models/CommonModels';
import { getClient } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo';
import { logger } from './loggerService';

/**
 * CRUD操作の結果型
 */
export interface CrudResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * クエリオプション
 */
export interface QueryOptions {
  /** 取得するフィールド名の配列 */
  select?: string[];
  /** 取得する最大レコード数 */
  top?: number;
  /** 並び替え条件 (例: ['createdon desc', 'name asc']) */
  orderBy?: string[];
  /** フィルター条件 (OData形式) */
  filter?: string;
  /** 展開する関連エンティティ */
  expand?: string[];
}

/**
 * Dataverse CRUD 共通サービスクラス
 * 
 * すべてのテーブルに対して統一されたCRUD操作を提供します。
 * 
 * @example
 * ```typescript
 * // レコード作成
 * const result = await DataverseCrudService.create('mdi_project_lists', {
 *   mdi_name: 'プロジェクト1',
 *   mdi_id: 'P001'
 * });
 * 
 * // レコード取得
 * const projects = await DataverseCrudService.getAll('mdi_project_lists', {
 *   select: ['mdi_name', 'mdi_id'],
 *   top: 10,
 *   orderBy: ['createdon desc']
 * });
 * 
 * // レコード更新
 * await DataverseCrudService.update('mdi_project_lists', 'record-id', {
 *   mdi_name: '更新されたプロジェクト'
 * });
 * 
 * // レコード削除
 * await DataverseCrudService.delete('mdi_project_lists', 'record-id');
 * ```
 */
export class DataverseCrudService {
  private static client = getClient(dataSourcesInfo);

  /**
   * レコードを作成
   * 
   * @template T レコードの型
   * @param tableName テーブル名 (例: 'mdi_project_lists')
   * @param record 作成するレコードデータ
   * @returns 作成結果
   */
  static async create<T>(
    tableName: string,
    record: Partial<T>
  ): Promise<CrudResult<T>> {
    try {
      logger.crud('CREATE', tableName, record);
      
      const result = await this.client.createRecordAsync<Partial<T>, T>(
        tableName,
        record
      );

      if (result.success === false) {
        logger.error(`Failed to create record in ${tableName}`, result.error, 'CRUD');
        return {
          success: false,
          error: result.error?.message || '作成に失敗しました',
          message: '作成に失敗しました'
        };
      }

      // result.dataまたはresult自体がレコードの場合
      const data = result.data || (result as any);
      
      logger.info('Successfully created record', data, 'CRUD');
      return {
        success: true,
        data: data,
        message: 'レコードを作成しました'
      };
    } catch (error: any) {
      logger.error(`Create error in ${tableName}`, error, 'CRUD');
      return {
        success: false,
        error: error.message || String(error),
        message: 'レコード作成中にエラーが発生しました'
      };
    }
  }

  /**
   * レコードを取得 (単一)
   * 
   * @template T レコードの型
   * @param tableName テーブル名
   * @param id レコードID
   * @param options 取得オプション
   * @returns 取得結果
   */
  static async get<T>(
    tableName: string,
    id: string,
    options?: QueryOptions
  ): Promise<CrudResult<T>> {
    try {
      logger.crud('READ', tableName, { id, options });
      
      const result = await this.client.retrieveRecordAsync<T>(
        tableName,
        id,
        options as IGetOptions
      );

      if (result.success === false) {
        logger.error(`Failed to get record from ${tableName}`, result.error, 'CRUD');
        return {
          success: false,
          error: result.error?.message || '取得に失敗しました',
          message: '取得に失敗しました'
        };
      }

      const data = result.data || (result as any);
      
      logger.info('Successfully retrieved record', { tableName, id }, 'CRUD');
      return {
        success: true,
        data: data,
        message: 'レコードを取得しました'
      };
    } catch (error: any) {
      logger.error(`Get error in ${tableName}`, error, 'CRUD');
      return {
        success: false,
        error: error.message || String(error),
        message: 'レコード取得中にエラーが発生しました'
      };
    }
  }

  /**
   * レコードを取得 (複数)
   * 
   * @template T レコードの型
   * @param tableName テーブル名
   * @param options クエリオプション
   * @returns 取得結果
   */
  static async getAll<T>(
    tableName: string,
    options?: QueryOptions
  ): Promise<CrudResult<T[]>> {
    try {
      logger.crud('READ', tableName, { operation: 'getAll', options });
      
      const result = await this.client.retrieveMultipleRecordsAsync<T>(
        tableName,
        options as IGetAllOptions
      );

      if (result.success === false) {
        logger.error(`Failed to get all records from ${tableName}`, result.error, 'CRUD');
        return {
          success: false,
          error: result.error?.message || '取得に失敗しました',
          message: '取得に失敗しました'
        };
      }

      const data = result.data || (result as any);
      const records = Array.isArray(data) ? data : [];
      
      logger.info(`Successfully retrieved ${records.length} records`, { tableName, count: records.length }, 'CRUD');
      return {
        success: true,
        data: records,
        message: `${records.length}件のレコードを取得しました`
      };
    } catch (error: any) {
      logger.error(`GetAll error in ${tableName}`, error, 'CRUD');
      return {
        success: false,
        error: error.message || String(error),
        message: 'レコード取得中にエラーが発生しました'
      };
    }
  }

  /**
   * レコードを更新
   * 
   * @template T レコードの型
   * @param tableName テーブル名
   * @param id レコードID
   * @param changedFields 更新するフィールド
   * @returns 更新結果
   */
  static async update<T>(
    tableName: string,
    id: string,
    changedFields: Partial<T>
  ): Promise<CrudResult<T>> {
    try {
      logger.crud('UPDATE', tableName, { id, changedFields });
      
      const result = await this.client.updateRecordAsync<Partial<T>, T>(
        tableName,
        id,
        changedFields
      );

      if (result.success === false) {
        logger.error(`Failed to update record in ${tableName}`, result.error, 'CRUD');
        return {
          success: false,
          error: result.error?.message || '更新に失敗しました',
          message: '更新に失敗しました'
        };
      }

      const data = result.data || (result as any);
      
      logger.info('Successfully updated record', { tableName, id }, 'CRUD');
      return {
        success: true,
        data: data,
        message: 'レコードを更新しました'
      };
    } catch (error: any) {
      logger.error(`Update error in ${tableName}`, error, 'CRUD');
      return {
        success: false,
        error: error.message || String(error),
        message: 'レコード更新中にエラーが発生しました'
      };
    }
  }

  /**
   * レコードを削除
   * 
   * @param tableName テーブル名
   * @param id レコードID
   * @returns 削除結果
   */
  static async delete(
    tableName: string,
    id: string
  ): Promise<CrudResult<void>> {
    try {
      logger.crud('DELETE', tableName, { id });
      
      await this.client.deleteRecordAsync(tableName, id);
      
      logger.info('Successfully deleted record', { tableName, id }, 'CRUD');
      return {
        success: true,
        message: 'レコードを削除しました'
      };
    } catch (error: any) {
      logger.error(`Delete error in ${tableName}`, error, 'CRUD');
      return {
        success: false,
        error: error.message || String(error),
        message: 'レコード削除中にエラーが発生しました'
      };
    }
  }

  /**
   * 条件に一致するレコード数を取得
   * 
   * @param tableName テーブル名
   * @param filter フィルター条件
   * @returns レコード数
   */
  static async count(
    tableName: string,
    filter?: string
  ): Promise<CrudResult<number>> {
    try {
      logger.crud('COUNT', tableName, { filter });
      
      const result = await this.getAll(tableName, {
        select: [],
        filter: filter
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'レコード数の取得に失敗しました'
        };
      }

      const count = result.data?.length || 0;
      
      logger.info(`Count result: ${count} records`, { tableName, count }, 'CRUD');
      return {
        success: true,
        data: count,
        message: `${count}件のレコードがあります`
      };
    } catch (error: any) {
      logger.error(`Count error in ${tableName}`, error, 'CRUD');
      return {
        success: false,
        error: error.message || String(error),
        message: 'レコード数取得中にエラーが発生しました'
      };
    }
  }

  /**
   * バッチ作成 (複数レコードを一度に作成)
   * 
   * @template T レコードの型
   * @param tableName テーブル名
   * @param records 作成するレコードの配列
   * @returns 作成結果の配列
   */
  static async createBatch<T>(
    tableName: string,
    records: Partial<T>[]
  ): Promise<CrudResult<T[]>> {
    try {
      logger.crud('BATCH', tableName, { count: records.length });
      
      const results: T[] = [];
      const errors: string[] = [];

      for (let i = 0; i < records.length; i++) {
        const result = await this.create<T>(tableName, records[i]);
        if (result.success && result.data) {
          results.push(result.data);
        } else {
          errors.push(`レコード${i + 1}: ${result.error}`);
        }
      }

      if (errors.length > 0) {
        logger.warn(`Batch create partially failed: ${errors.length}/${records.length}`, { successCount: results.length, errorCount: errors.length }, 'CRUD');
        return {
          success: false,
          data: results,
          error: errors.join(', '),
          message: `${results.length}件成功、${errors.length}件失敗しました`
        };
      }

      logger.info(`Successfully created ${results.length} records in batch`, { tableName, count: results.length }, 'CRUD');
      return {
        success: true,
        data: results,
        message: `${results.length}件のレコードを作成しました`
      };
    } catch (error: any) {
      logger.error(`Batch create error in ${tableName}`, error, 'CRUD');
      return {
        success: false,
        error: error.message || String(error),
        message: 'バッチ作成中にエラーが発生しました'
      };
    }
  }
}

/**
 * 型安全なCRUD操作用ヘルパー関数
 * 
 * 特定のテーブル専用のCRUDインスタンスを作成します。
 * 
 * @example
 * ```typescript
 * import { createCrudHelper } from '@/services/dataverseCrudService';
 * import type { Mdi_project_lists } from '@/generated/models/Mdi_project_listsModel';
 * 
 * const projectCrud = createCrudHelper<Mdi_project_lists>('mdi_project_lists');
 * 
 * // 型安全なCRUD操作
 * const result = await projectCrud.create({ mdi_name: 'test', mdi_id: 'T001' });
 * const projects = await projectCrud.getAll({ top: 10 });
 * await projectCrud.update('id', { mdi_name: 'updated' });
 * await projectCrud.delete('id');
 * ```
 */
export function createCrudHelper<T>(tableName: string) {
  return {
    create: (record: Partial<T>) => DataverseCrudService.create<T>(tableName, record),
    get: (id: string, options?: QueryOptions) => DataverseCrudService.get<T>(tableName, id, options),
    getAll: (options?: QueryOptions) => DataverseCrudService.getAll<T>(tableName, options),
    update: (id: string, changedFields: Partial<T>) => DataverseCrudService.update<T>(tableName, id, changedFields),
    delete: (id: string) => DataverseCrudService.delete(tableName, id),
    count: (filter?: string) => DataverseCrudService.count(tableName, filter),
    createBatch: (records: Partial<T>[]) => DataverseCrudService.createBatch<T>(tableName, records),
  };
}
