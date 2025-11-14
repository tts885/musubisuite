/**
 * Dataverse設定ページ
 * 
 * Dataverse接続の作成、編集、削除、アクティブ化機能を提供します。
 * LocalStorageに接続情報を保存し、複数の環境を管理できます。
 * 
 * @module pages/dataverse-settings
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { dataverseStore } from "@/lib/dataverseStore";
import type { DataverseConnection } from "@/types/dataverse";

/**
 * Dataverse設定ページコンポーネント
 * 
 * Dataverse環境への接続設定を管理します。
 * 以下の機能を含みます:
 * - 新規接続作成フォーム
 * - 接続一覧表示
 * - アクティブ接続の切り替え
 * - 接続の削除
 * - 接続テスト機能(将来的に実装予定)
 * 
 * @component
 * @returns {JSX.Element} Dataverse設定ページ
 * 
 * @example
 * ```tsx
 * // router.tsx
 * { path: "dataverse-settings", element: <SettingsPage /> }
 * ```
 * 
 * @remarks
 * - LocalStorageへの永続化
 * - 複数接続の管理可能
 * - アクティブ接続は1つのみ
 * - APIバージョンはデフォルト9.2
 */
export default function SettingsPage() {
  const [connections, setConnections] = useState<DataverseConnection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [newConnection, setNewConnection] = useState({
    name: "",
    environment: "",
    baseUrl: "",
    apiVersion: "9.2"
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = () => {
    const storedConnections = dataverseStore.getConnections();
    const activeId = dataverseStore.getActiveConnectionId();
    setConnections(storedConnections);
    setActiveConnectionId(activeId);
  };

  const handleCreateConnection = () => {
    if (!newConnection.name || !newConnection.environment || !newConnection.baseUrl) {
      alert('すべての必須フィールドを入力してください');
      return;
    }

    const connection: DataverseConnection = {
      id: crypto.randomUUID(),
      name: newConnection.name,
      environment: newConnection.environment,
      baseUrl: newConnection.baseUrl.endsWith('/') ? newConnection.baseUrl.slice(0, -1) : newConnection.baseUrl,
      apiVersion: newConnection.apiVersion,
      isActive: connections.length === 0,
      createdAt: new Date().toISOString()
    };

    dataverseStore.saveConnection(connection);
    
    if (connections.length === 0) {
      dataverseStore.setActiveConnection(connection.id);
    }
    
    loadConnections();
    setNewConnection({ name: "", environment: "", baseUrl: "", apiVersion: "9.2" });
    setIsCreateMode(false);
  };

  const handleDeleteConnection = (id: string) => {
    dataverseStore.deleteConnection(id);
    loadConnections();
  };

  const handleSetActiveConnection = (id: string) => {
    dataverseStore.setActiveConnection(id);
    setActiveConnectionId(id);
  };

  const handleSetPowerAppsPreset = () => {
    setNewConnection({
      name: "Power Apps環境",
      environment: "84b2150b-4384-eee2-b20e-ee25b862d314",
      baseUrl: "https://org288e66ae.crm.dynamics.com",
      apiVersion: "9.2"
    });
    setIsCreateMode(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">設定</h1>
        <p className="text-gray-600">アプリケーションの各種設定を管理します</p>
      </div>

      <div className="space-y-6">
        {/* Dataverse接続設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Dataverse接続設定
            </CardTitle>
            <CardDescription>
              Dataverse環境への接続を設定・管理します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">接続一覧</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSetPowerAppsPreset}
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Power Apps環境
                  </Button>
                  <Button
                    onClick={() => setIsCreateMode(true)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新しい接続
                  </Button>
                </div>
              </div>

              {connections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Dataverse接続が設定されていません</p>
                  <p className="text-sm">上のボタンから新しい接続を作成してください</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className={`p-4 border rounded-lg ${
                        activeConnectionId === connection.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{connection.name}</h4>
                            {activeConnectionId === connection.id && (
                              <Badge variant="default">アクティブ</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{connection.baseUrl}</p>
                          <p className="text-xs text-gray-500">環境: {connection.environment}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {activeConnectionId !== connection.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetActiveConnection(connection.id)}
                            >
                              アクティブに設定
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteConnection(connection.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 新しい接続作成フォーム */}
              {isCreateMode && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-4">新しい接続を作成</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">接続名</Label>
                      <Input
                        id="name"
                        value={newConnection.name}
                        onChange={(e) => setNewConnection(prev => ({...prev, name: e.target.value}))}
                        placeholder="例: 本番環境"
                      />
                    </div>
                    <div>
                      <Label htmlFor="environment">環境ID</Label>
                      <Input
                        id="environment"
                        value={newConnection.environment}
                        onChange={(e) => setNewConnection(prev => ({...prev, environment: e.target.value}))}
                        placeholder="例: 12345678-1234-1234-1234-123456789012"
                      />
                    </div>
                    <div>
                      <Label htmlFor="baseUrl">ベースURL</Label>
                      <Input
                        id="baseUrl"
                        value={newConnection.baseUrl}
                        onChange={(e) => setNewConnection(prev => ({...prev, baseUrl: e.target.value}))}
                        placeholder="例: https://org12345.crm.dynamics.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="apiVersion">APIバージョン</Label>
                      <Input
                        id="apiVersion"
                        value={newConnection.apiVersion}
                        onChange={(e) => setNewConnection(prev => ({...prev, apiVersion: e.target.value}))}
                        placeholder="9.2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateConnection}>
                        作成
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreateMode(false)}>
                        キャンセル
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* テーブル設定情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Dataverseテーブル設定
            </CardTitle>
            <CardDescription>
              手動でDataverseにテーブルを作成してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">📋 必要なテーブル</h4>
              <div className="text-sm text-yellow-700 space-y-4">
                <div>
                  <strong>1. プロジェクトテーブル</strong><br />
                  <strong>テーブル名:</strong> cr0d2_projects<br />
                  <strong>表示名:</strong> Projects
                </div>
                <div>
                  <strong>必要なフィールド:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• cr0d2_name (一行テキスト) - プロジェクト名 ※必須</li>
                    <li>• cr0d2_description (複数行テキスト) - 説明</li>
                    <li>• cr0d2_status (選択肢) - ステータス</li>
                    <li className="ml-4 text-xs">値: planning, in_progress, completed, on_hold</li>
                    <li>• cr0d2_startdate (日付のみ) - 開始日</li>
                    <li>• cr0d2_enddate (日付のみ) - 終了日</li>
                    <li>• cr0d2_progress (整数) - 進捗率 (0-100)</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-yellow-300">
                  <div className="text-xs text-yellow-600">
                    💡 <strong>ヒント:</strong> Dataverse で「テーブル」→「新しいテーブル」から作成してください。<br />
                    フィールドタイプは正確に設定し、選択肢フィールドには上記の値を追加してください。
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}