/**
 * Dataverseテーブル作成サービス
 * 
 * Dataverseに新しいカスタムテーブルを作成する機能を提供します。
 * 
 * @module services/tableCreation
 */

import { getContext } from '@microsoft/power-apps/app';

/**
 * テーブル作成結果
 */
export interface TableCreationResult {
  success: boolean;
  message: string;
  tableId?: string;
  tableName?: string;
  error?: string;
}

/**
 * 環境設定テーブルのスキーマ定義
 */
export interface EnvironmentSettingSchema {
  displayName: string;
  pluralName: string;
  description: string;
  primaryNameAttribute: string;
  columns: {
    name: string;
    displayName: string;
    type: string;
    description: string;
    required?: boolean;
    maxLength?: number;
  }[];
}

/**
 * 環境設定テーブルのスキーマ
 */
const environmentSettingSchema: EnvironmentSettingSchema = {
  displayName: '環境設定',
  pluralName: '環境設定一覧',
  description: 'システムの環境設定を管理するテーブル',
  primaryNameAttribute: 'mdi_name',
  columns: [
    {
      name: 'mdi_name',
      displayName: '設定名',
      type: 'string',
      description: '環境設定の名前',
      required: true,
      maxLength: 100
    },
    {
      name: 'mdi_setting_key',
      displayName: '設定キー',
      type: 'string',
      description: '設定の識別キー',
      required: true,
      maxLength: 100
    },
    {
      name: 'mdi_setting_value',
      displayName: '設定値',
      type: 'string',
      description: '設定の値',
      required: false,
      maxLength: 500
    },
    {
      name: 'mdi_description',
      displayName: '説明',
      type: 'memo',
      description: '設定の詳細説明',
      required: false,
      maxLength: 2000
    },
    {
      name: 'mdi_is_active',
      displayName: '有効',
      type: 'boolean',
      description: '設定が有効かどうか',
      required: false
    },
    {
      name: 'mdi_category',
      displayName: 'カテゴリ',
      type: 'string',
      description: '設定のカテゴリ',
      required: false,
      maxLength: 50
    }
  ]
};

/**
 * 環境設定テーブルを作成
 * 
 * Dataverseに「環境設定」テーブル(mdi_environment_settings)を作成します。
 * 
 * @returns テーブル作成結果
 */
export async function createEnvironmentSettingsTable(): Promise<TableCreationResult> {
  try {
    // Power Apps コンテキストを取得
    const context = getContext();
    
    if (!context) {
      return {
        success: false,
        message: 'Power Apps環境に接続されていません',
        error: 'Context is not available. Please ensure the app is running in Power Apps environment.'
      };
    }






    













    // 実際の作成処理はPower Platform管理センターで行う必要があるため、
    // ここでは情報のみ表示して、手動作成を促す
    return {
      success: false,
      message: 'テーブル作成にはPower Platform管理センターを使用してください',
      tableName: 'mdi_environment_settings',
      error: 'Programmatic table creation is not supported. Please use Power Platform Admin Center or Power Apps Maker Portal.'
    };

  } catch (error) {
    return {
      success: false,
      message: 'テーブル作成の準備中にエラーが発生しました',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * テーブル作成のPAC CLIコマンドを取得
 * 
 * @returns PAC CLIコマンドの配列
 */
export function getTableCreationCommands(): string[] {
  return [
    '# Power Platform管理センターでテーブルを作成する手順',
    '',
    '## 方法1: Power Platform管理センター (推奨)',
    '1. https://admin.powerplatform.microsoft.com/ にアクセス',
    '2. 環境を選択 → Dataverse → テーブル → 「新しいテーブル」',
    '3. テーブル情報を入力:',
    `   - 表示名: ${environmentSettingSchema.displayName}`,
    `   - 複数形の名前: ${environmentSettingSchema.pluralName}`,
    `   - 説明: ${environmentSettingSchema.description}`,
    '   - 主列の名前: mdi_name',
    '',
    '4. 以下の列を追加:',
    ...environmentSettingSchema.columns.slice(1).map((column, index) => {
      const typeMap: Record<string, string> = {
        'string': 'Single line of text',
        'memo': 'Multiple lines of text',
        'boolean': 'Yes/No',
        'number': 'Whole number'
      };
      return `   ${index + 1}. ${column.displayName} (${column.name}) - ${typeMap[column.type] || column.type}`;
    }),
    '',
    '## 方法2: Power Apps Maker Portal',
    '1. https://make.powerapps.com/ にアクセス',
    '2. 左メニュー → テーブル → 新しいテーブル → テーブルを作成',
    '3. 上記と同じ情報を入力',
    '',
    '## テーブル作成後、データソースとして追加',
    'pac code add-data-source -a dataverse -t mdi_environment_settings',
    '',
    '## 注意',
    '※ PAC CLIの "pac entity" コマンドは存在しません',
    '※ プログラムからのテーブル作成は現在サポートされていません',
    '※ Power Platform管理センターまたはPower Appsポータルを使用してください'
  ];
}

/**
 * テーブル作成コマンドをクリップボードにコピー
 * 
 * @returns コピー成功/失敗
 */
export async function copyTableCreationCommandsToClipboard(): Promise<boolean> {
  try {
    const commands = getTableCreationCommands().join('\n');
    await navigator.clipboard.writeText(commands);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * テーブルスキーマを取得
 * 
 * @returns 環境設定テーブルのスキーマ
 */
export function getEnvironmentSettingSchema(): EnvironmentSettingSchema {
  return environmentSettingSchema;
}
