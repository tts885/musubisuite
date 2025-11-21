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
  console.log('='.repeat(80));
  console.log('🏗️  環境設定テーブル作成開始');
  console.log('='.repeat(80));

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

    console.log('\n📋 テーブル情報:');
    console.log(`  表示名: ${environmentSettingSchema.displayName}`);
    console.log(`  複数形名: ${environmentSettingSchema.pluralName}`);
    console.log(`  説明: ${environmentSettingSchema.description}`);
    console.log(`  主キー属性: ${environmentSettingSchema.primaryNameAttribute}`);
    
    console.log('\n📊 カラム定義:');
    environmentSettingSchema.columns.forEach((column, index) => {
      console.log(`  ${index + 1}. ${column.displayName} (${column.name})`);
      console.log(`     型: ${column.type}`);
      console.log(`     説明: ${column.description}`);
      console.log(`     必須: ${column.required ? 'はい' : 'いいえ'}`);
      if (column.maxLength) {
        console.log(`     最大長: ${column.maxLength}`);
      }
    });

    console.log('\n⚠️  注意: テーブル作成にはPower Platform管理センターを使用してください');
    console.log('\n📝 テーブル作成手順 (方法1: Power Platform管理センター - 推奨):');
    console.log('  1. Power Platform管理センターにアクセス:');
    console.log('     https://admin.powerplatform.microsoft.com/');
    console.log('\n  2. 環境を選択 → Dataverse → テーブル → 「新しいテーブル」をクリック');
    console.log('\n  3. テーブル情報を入力:');
    console.log(`     - 表示名: ${environmentSettingSchema.displayName}`);
    console.log(`     - 複数形の名前: ${environmentSettingSchema.pluralName}`);
    console.log(`     - 説明: ${environmentSettingSchema.description}`);
    console.log(`     - 主列の名前: mdi_name`);
    console.log('\n  4. 以下の列を追加:');
    environmentSettingSchema.columns.forEach((column, index) => {
      if (index > 0) { // mdi_nameは主列として自動作成される
        console.log(`     ${index}. ${column.displayName} (${column.name})`);
        console.log(`        - 型: ${column.type === 'memo' ? 'Multiple lines of text' : column.type === 'boolean' ? 'Yes/No' : 'Single line of text'}`);
        console.log(`        - 必須: ${column.required ? 'はい' : 'いいえ'}`);
        if (column.maxLength) {
          console.log(`        - 最大長: ${column.maxLength}`);
        }
      }
    });
    console.log('\n  5. テーブル作成後、PAC CLIでデータソースとして追加:');
    console.log('     pac code add-data-source -a dataverse -t mdi_environment_settings');
    console.log('\n📝 テーブル作成手順 (方法2: Power Apps Maker Portal):');
    console.log('  1. Power Apps (https://make.powerapps.com/) にアクセス');
    console.log('  2. 左メニュー → テーブル → 新しいテーブル → テーブルを作成');
    console.log('  3. 上記の方法1と同じ情報を入力して作成');

    console.log('\n' + '='.repeat(80));
    console.log('ℹ️  現在のSDKバージョンでは、プログラムからのテーブル作成はサポートされていません');
    console.log('💡 Power Platform管理センターまたはPower Appsポータルを使用してテーブルを作成してください');
    console.log('='.repeat(80));

    // 実際の作成処理はPower Platform管理センターで行う必要があるため、
    // ここでは情報のみ表示して、手動作成を促す
    return {
      success: false,
      message: 'テーブル作成にはPower Platform管理センターを使用してください',
      tableName: 'mdi_environment_settings',
      error: 'Programmatic table creation is not supported. Please use Power Platform Admin Center or Power Apps Maker Portal.'
    };

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    console.error('エラー詳細:', error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && error.stack) {
      console.error('スタックトレース:', error.stack);
    }
    
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
    console.error('クリップボードへのコピーに失敗しました:', error);
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
