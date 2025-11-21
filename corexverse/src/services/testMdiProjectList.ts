/**
 * Dataverse mdi_project_list テーブルのテスト
 * 
 * 共通CRUDサービスを使用してレコードを操作します。
 */

import { createCrudHelper } from '@/services/dataverseCrudService';
import type { Mdi_project_lists } from '@/generated/models/Mdi_project_listsModel';
import { logger } from '@/services/loggerService';

// 型安全なCRUDヘルパーを作成
const projectCrud = createCrudHelper<Mdi_project_lists>('mdi_project_lists');

/**
 * mdi_project_listテーブルから全レコードを取得してログ出力
 */
export async function testFetchMdiProjects() {
  logger.grouped('MDI Project List - レコード取得テスト', () => {
    logger.info('Test started', undefined, 'TEST');
  });

  try {
    // 全レコードを取得 (共通 CRUDサービスを使用)
    logger.debug('Fetching records...');
    const result = await projectCrud.getAll({
      // 取得するフィールドを指定(パフォーマンス向上)
      select: [
        'mdi_project_listid',
        'mdi_name',
        'createdon',
        'modifiedon',
        'statecode',
        'statuscode'
      ],
      // 最大100件まで取得
      top: 100,
      // 作成日時の降順でソート
      orderBy: ['createdon desc']
    });

    if (!result.success || !result.data) {
      logger.warn('No data retrieved', result.error, 'TEST');
      return;
    }

    const projects = result.data;
    logger.info(`Retrieved ${projects.length} records`, { count: projects.length }, 'TEST');

    // 各レコードの詳細をログ出力
    projects.forEach((project: Mdi_project_lists, index: number) => {
      logger.debug(`Project #${index + 1}`, {
        id: project.mdi_project_listid,
        name: project.mdi_name,
        created: project.createdon,
        modified: project.modifiedon,
        state: project.statecode,
        status: project.statuscode
      }, 'TEST');
    });

    // サマリー情報
    if (projects.length > 0) {
      const activeProjects = projects.filter(p => p.statecode === 0);
      const inactiveProjects = projects.filter(p => p.statecode === 1);
      logger.info('Summary', {
        total: projects.length,
        active: activeProjects.length,
        inactive: inactiveProjects.length
      }, 'TEST');
    }

    logger.info('Test completed successfully', undefined, 'TEST');

    return projects;

  } catch (error) {
    logger.error('Test failed', error, 'TEST');
    throw error;
  }
}

/**
 * 特定のIDでレコードを取得してログ出力
 */
export async function testFetchMdiProjectById(projectId: string) {
  logger.grouped(`Get Project by ID: ${projectId}`, () => {
    logger.info('Test started', { projectId }, 'TEST');
  });

  try {
    logger.debug('Fetching record...', { projectId });
    const result = await projectCrud.get(projectId);

    if (!result.success || !result.data) {
      logger.warn('Record not found', { projectId, error: result.error }, 'TEST');
      return null;
    }

    const project = result.data;
    logger.info('Successfully retrieved record', {
      id: project.mdi_project_listid,
      name: project.mdi_name,
      created: project.createdon,
      modified: project.modifiedon,
      state: project.statecode,
      status: project.statuscode
    }, 'TEST');

    return project;

  } catch (error) {
    logger.error('Test failed', error, 'TEST');
    throw error;
  }
}

/**
 * レコードの詳細情報を構造化してログ出力
 */
export function logProjectDetails(project: Mdi_project_lists) {
  logger.debug('Project details', project, 'TEST');
}

/**
 * mdi_project_listテーブルにテストデータを1件作成
 */
export async function testCreateMdiProject() {
  logger.grouped('MDI Project List - テストデータ作成', () => {
    logger.info('Test started', undefined, 'TEST');
  });

  try {
    // mdi_idは最大10文字なので、短い形式で生成
    const now = new Date();
    const shortId = now.getTime().toString().slice(-8); // 最後の8桁を使用
    const timestamp = now.toLocaleString('ja-JP');
    
    // 最小限の必須フィールドのみを設定
    // Dataverseが自動的に設定するフィールド(createdby, owneridなど)は含めない
    const testData: Partial<Mdi_project_lists> = {
      mdi_name: `テストプロジェクト_${shortId}`,
      mdi_id: `T${shortId}`, // 最大10文字: T + 8桁 = 9文字
      mdi_project_description: `これは ${timestamp} に作成されたテストプロジェクトです。`,
      mdi_wbscode: `WBS${shortId}`, // WBS + 8桁 = 11文字
      mdi_workload_mm: '12',
    };

    logger.debug('Creating test data', testData, 'TEST');
    
    const result = await projectCrud.create(testData);
    
    logger.debug('API Response', { result, hasData: !!result.data }, 'TEST');

    if (!result || !result.data) {
      logger.warn('Failed to create record', result, 'TEST');
      
      // resultがオブジェクトの場合、作成されたレコードがresult自体に含まれている可能性
      if (result && typeof result === 'object' && 'mdi_project_listid' in result) {
        const createdProject = result as unknown as Mdi_project_lists;
        logger.info('Successfully created record (from result itself)', {
          id: createdProject.mdi_project_listid,
          name: createdProject.mdi_name,
          projectId: createdProject.mdi_id,
          created: createdProject.createdon
        }, 'TEST');
        
        return createdProject;
      }
      
      return null;
    }

    const createdProject = result.data;
    logger.info('Successfully created record', {
      id: createdProject.mdi_project_listid,
      name: createdProject.mdi_name,
      projectId: createdProject.mdi_id,
      description: createdProject.mdi_project_description,
      wbsCode: createdProject.mdi_wbscode,
      workload: createdProject.mdi_workload_mm,
      created: createdProject.createdon,
      state: createdProject.statecode,
      status: createdProject.statuscode
    }, 'TEST');

    return createdProject;

  } catch (error: any) {
    logger.error('Test data creation failed', error, 'TEST');
    
    if (error.response) {
      logger.error('Response details', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      }, 'TEST');
    }
    
    logger.warn('Troubleshooting tips', {
      tips: [
        'Check Power Apps environment connection',
        'Verify write permissions to mdi_project_list table',
        'Confirm required fields (mdi_id, mdi_name) are properly set',
        'Ensure app is running with pac code run'
      ]
    }, 'TEST');
    
    throw error;
  }
}
