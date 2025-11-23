/**
 * Dataverse CRUD 共通サービス - 使用例
 * 
 * DataverseCrudService の使い方を示すサンプルコードです。
 * 
 * @module services/examples/crudExamples
 */

import { DataverseCrudService, createCrudHelper } from '@/services/dataverseCrudService';
import type { Mdi_project_lists } from '@/generated/models/Mdi_project_listsModel';
import React from 'react';
import { logger } from '@/lib/logger';

// ============================================================================
// パターン1: 汎用サービスを直接使用 (すべてのテーブルに対応)
// ============================================================================

/**
 * 例1: レコードの作成
 */
export async function example1_CreateRecord() {
  const result = await DataverseCrudService.create('mdi_project_lists', {
    mdi_name: '新規プロジェクト',
    mdi_id: 'P001',
    mdi_project_description: 'プロジェクトの説明',
    mdi_wbscode: 'WBS001',
    mdi_workload_mm: '12'
  });

  if (result.success) {
    logger.info('✅ 作成成功:', result.data);
    logger.info('メッセージ:', result.message);
  } else {
    logger.error('❌ 作成失敗:', result.error);
  }

  return result;
}

/**
 * 例2: レコードの取得 (単一)
 */
export async function example2_GetRecord(recordId: string) {
  const result = await DataverseCrudService.get('mdi_project_lists', recordId, {
    select: ['mdi_name', 'mdi_id', 'mdi_project_description', 'createdon']
  });

  if (result.success) {
    logger.info('✅ 取得成功:', result.data);
  } else {
    logger.error('❌ 取得失敗:', result.error);
  }

  return result;
}

/**
 * 例3: レコードの取得 (複数)
 */
export async function example3_GetAllRecords() {
  const result = await DataverseCrudService.getAll('mdi_project_lists', {
    select: ['mdi_project_listid', 'mdi_name', 'mdi_id', 'createdon', 'statecode'],
    top: 20,
    orderBy: ['createdon desc'],
    filter: "statecode eq 0" // アクティブなレコードのみ
  });

  if (result.success) {
    logger.info(`✅ 取得成功: ${result.data?.length}件`);
    result.data?.forEach(record => {
      logger.info(`  - ${record.mdi_name} (ID: ${record.mdi_id})`);
    });
  } else {
    logger.error('❌ 取得失敗:', result.error);
  }

  return result;
}

/**
 * 例4: レコードの更新
 */
export async function example4_UpdateRecord(recordId: string) {
  const result = await DataverseCrudService.update('mdi_project_lists', recordId, {
    mdi_name: '更新されたプロジェクト名',
    mdi_workload_mm: '24'
  });

  if (result.success) {
    logger.info('✅ 更新成功:', result.data);
  } else {
    logger.error('❌ 更新失敗:', result.error);
  }

  return result;
}

/**
 * 例5: レコードの削除
 */
export async function example5_DeleteRecord(recordId: string) {
  const result = await DataverseCrudService.delete('mdi_project_lists', recordId);

  if (result.success) {
    logger.info('✅ 削除成功');
  } else {
    logger.error('❌ 削除失敗:', result.error);
  }

  return result;
}

/**
 * 例6: レコード数の取得
 */
export async function example6_CountRecords() {
  const result = await DataverseCrudService.count(
    'mdi_project_lists',
    "statecode eq 0" // アクティブなレコードのみ
  );

  if (result.success) {
    logger.info(`✅ レコード数: ${result.data}件`);
  } else {
    logger.error('❌ カウント失敗:', result.error);
  }

  return result;
}

/**
 * 例7: バッチ作成
 */
export async function example7_BatchCreate() {
  const records = [
    { mdi_name: 'プロジェクトA', mdi_id: 'PA001' },
    { mdi_name: 'プロジェクトB', mdi_id: 'PB001' },
    { mdi_name: 'プロジェクトC', mdi_id: 'PC001' }
  ];

  const result = await DataverseCrudService.createBatch('mdi_project_lists', records);

  if (result.success) {
    console.log(`✅ バッチ作成成功: ${result.data?.length}件`);
  } else {
    console.error('❌ バッチ作成失敗:', result.error);
  }

  return result;
}

// ============================================================================
// パターン2: 型安全なヘルパーを使用 (特定のテーブル専用)
// ============================================================================

// mdi_project_lists 専用のCRUDヘルパーを作成
const projectCrud = createCrudHelper<Mdi_project_lists>('mdi_project_lists');

/**
 * 例8: 型安全なレコード作成
 */
export async function example8_TypeSafeCreate() {
  // TypeScriptが型チェックしてくれる
  const result = await projectCrud.create({
    mdi_name: 'タイプセーフなプロジェクト',
    mdi_id: 'TS001',
    mdi_project_description: '型安全に作成されたプロジェクト'
    // 存在しないフィールドを指定するとコンパイルエラーになる
  });

  if (result.success) {
    console.log('✅ 型安全な作成成功:', result.data);
    // result.data は Mdi_project_lists 型として扱える
    console.log('プロジェクトID:', result.data?.mdi_project_listid);
  }

  return result;
}

/**
 * 例9: 型安全なレコード取得
 */
export async function example9_TypeSafeGetAll() {
  const result = await projectCrud.getAll({
    select: ['mdi_project_listid', 'mdi_name', 'mdi_id'],
    top: 10,
    orderBy: ['createdon desc']
  });

  if (result.success && result.data) {
    // result.data は Mdi_project_lists[] 型
    result.data.forEach(project => {
      console.log(`${project.mdi_name} - ${project.mdi_id}`);
      // TypeScriptの入力補完が効く
    });
  }

  return result;
}

// ============================================================================
// パターン3: Reactコンポーネントでの使用
// ============================================================================

/**
 * 例10: Reactコンポーネント内での使用
 */
export function ExampleComponent() {
  const [projects, setProjects] = React.useState<Mdi_project_lists[]>([]);
  const [loading, setLoading] = React.useState(false);

  // データ取得
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const result = await projectCrud.getAll({
        select: ['mdi_project_listid', 'mdi_name', 'mdi_id', 'createdon'],
        top: 50,
        orderBy: ['createdon desc']
      });

      if (result.success && result.data) {
        setProjects(result.data);
      } else {
        console.error('取得失敗:', result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  // レコード作成
  const createProject = async (name: string, id: string) => {
    const result = await projectCrud.create({
      mdi_name: name,
      mdi_id: id
    });

    if (result.success) {
      // 成功したら一覧を再取得
      await fetchProjects();
    } else {
      console.error('作成失敗:', result.error);
    }
  };

  // レコード更新
  const updateProject = async (projectId: string, name: string) => {
    const result = await projectCrud.update(projectId, {
      mdi_name: name
    });

    if (result.success) {
      await fetchProjects();
    } else {
      console.error('更新失敗:', result.error);
    }
  };

  // レコード削除
  const deleteProject = async (projectId: string) => {
    const result = await projectCrud.delete(projectId);

    if (result.success) {
      await fetchProjects();
    } else {
      console.error('削除失敗:', result.error);
    }
  };

  return { projects, loading, fetchProjects, createProject, updateProject, deleteProject };
}

// ============================================================================
// パターン4: 高度な検索
// ============================================================================

/**
 * 例11: 複雑な検索条件
 */
export async function example11_ComplexQuery() {
  const result = await projectCrud.getAll({
    select: [
      'mdi_project_listid',
      'mdi_name',
      'mdi_id',
      'mdi_workload_mm',
      'createdon'
    ],
    filter: "statecode eq 0 and mdi_workload_mm gt '10'", // アクティブで工数>10MM
    orderBy: ['mdi_workload_mm desc', 'createdon desc'],
    top: 20
  });

  if (result.success && result.data) {
    console.log(`✅ 検索結果: ${result.data.length}件`);
    result.data.forEach(project => {
      console.log(`${project.mdi_name} - 工数: ${project.mdi_workload_mm}MM`);
    });
  }

  return result;
}

/**
 * 例12: エラーハンドリング
 */
export async function example12_ErrorHandling() {
  try {
    const result = await projectCrud.create({
      mdi_name: 'テストプロジェクト',
      mdi_id: 'T001'
    });

    if (result.success) {
      console.log('✅ 成功:', result.message);
      return result.data;
    } else {
      // ビジネスロジックエラー
      console.error('❌ エラー:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    // 予期しないエラー
    console.error('❌ 例外:', error);
    throw error;
  }
}

// ============================================================================
// 使用方法のまとめ
// ============================================================================

/**
 * CRUD共通サービスの使い方まとめ
 * 
 * 【基本的な使い方】
 * 1. DataverseCrudService を直接使用 (汎用的)
 * 2. createCrudHelper で型安全なヘルパーを作成 (推奨)
 * 
 * 【利点】
 * - コードの統一性: すべてのテーブルで同じAPIを使用
 * - 型安全性: TypeScriptの型チェックが効く
 * - エラーハンドリング: 統一されたエラー処理
 * - ログ出力: 自動的にデバッグログが出力される
 * - シンプル: 複雑なPower Apps SDKのAPIを隠蔽
 * 
 * 【どこで使える?】
 * - Reactコンポーネント内
 * - カスタムフック内
 * - サービス層
 * - ユーティリティ関数
 * - どこからでも import して使用可能!
 */
