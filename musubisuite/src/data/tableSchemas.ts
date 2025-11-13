import type { TableSchema } from '@/types/dataverse';

// 案件テーブルのスキーマ定義
export const projectTableSchema: TableSchema = {
  logicalName: "new_project",
  displayName: "案件",
  pluralName: "案件",
  description: "プロジェクト管理用のテーブル",
  columns: [
    {
      logicalName: "new_name",
      displayName: "案件名",
      type: "string",
      required: true,
      maxLength: 200
    },
    {
      logicalName: "new_description",
      displayName: "説明",
      type: "string",
      required: false,
      maxLength: 2000
    },
    {
      logicalName: "new_status",
      displayName: "ステータス",
      type: "choice",
      required: true,
      choices: [
        { value: 1, label: "計画中" },
        { value: 2, label: "進行中" },
        { value: 3, label: "保留" },
        { value: 4, label: "完了" },
        { value: 5, label: "中止" }
      ]
    },
    {
      logicalName: "new_priority",
      displayName: "優先度",
      type: "choice",
      required: true,
      choices: [
        { value: 1, label: "低" },
        { value: 2, label: "中" },
        { value: 3, label: "高" },
        { value: 4, label: "緊急" }
      ]
    },
    {
      logicalName: "new_startdate",
      displayName: "開始日",
      type: "date",
      required: false
    },
    {
      logicalName: "new_duedate",
      displayName: "期限",
      type: "date",
      required: true
    },
    {
      logicalName: "new_budget",
      displayName: "予算",
      type: "currency",
      required: false
    },
    {
      logicalName: "new_progress",
      displayName: "進捗率",
      type: "number",
      required: false
    }
  ]
};

// クライアントテーブルのスキーマ定義
export const clientTableSchema: TableSchema = {
  logicalName: "new_client",
  displayName: "クライアント",
  pluralName: "クライアント",
  description: "顧客管理用のテーブル",
  columns: [
    {
      logicalName: "new_companyname",
      displayName: "会社名",
      type: "string",
      required: true,
      maxLength: 200
    },
    {
      logicalName: "new_contactname",
      displayName: "担当者名",
      type: "string",
      required: false,
      maxLength: 100
    },
    {
      logicalName: "new_email",
      displayName: "メールアドレス",
      type: "string",
      required: false,
      maxLength: 100
    },
    {
      logicalName: "new_phone",
      displayName: "電話番号",
      type: "string",
      required: false,
      maxLength: 50
    },
    {
      logicalName: "new_industry",
      displayName: "業種",
      type: "choice",
      required: false,
      choices: [
        { value: 1, label: "IT・通信" },
        { value: 2, label: "製造" },
        { value: 3, label: "金融" },
        { value: 4, label: "小売" },
        { value: 5, label: "サービス" },
        { value: 6, label: "その他" }
      ]
    },
    {
      logicalName: "new_isactive",
      displayName: "アクティブ",
      type: "boolean",
      required: false
    }
  ]
};

export const presetSchemas = {
  project: projectTableSchema,
  client: clientTableSchema
};
