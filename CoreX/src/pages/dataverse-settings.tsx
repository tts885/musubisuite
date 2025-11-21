/**
 * Dataverse設定ページ
 * 
 * Dataverse接続の作成、編集、削除、テスト、履歴管理機能を提供します。
 * LocalStorageに接続情報を保存し、Power Apps SDKを使用して直接接続テストを実行します。
 * 
 * @module pages/dataverse-settings
 */

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Database, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dataverseStore } from "@/lib/dataverseStore";
import type { DataverseConnection } from "@/types/powerplatform";
import { ConnectionCard } from "@/components/powerplatform/ConnectionCard";
import { ConnectionForm } from "@/components/powerplatform/ConnectionForm";
import { ConnectionTestDialog } from "@/components/powerplatform/ConnectionTestDialog";
import { StatusSummaryCards } from "@/components/powerplatform/StatusSummaryCards";
import { TestHistoryTable } from "@/components/powerplatform/TestHistoryTable";
import { ConnectionLogTable } from "@/components/powerplatform/ConnectionLogTable";
import { ErrorAlert, getErrorType } from "@/components/powerplatform/ErrorAlert";
import { toast } from "sonner";
import { testFetchMdiProjects, testCreateMdiProject } from "@/services/testMdiProjectList";
import { 
  createEnvironmentSettingsTable, 
  getTableCreationCommands,
  copyTableCreationCommandsToClipboard 
} from "@/services/tableCreationService";

export default function DataverseSettingsPage() {
  const [connections, setConnections] = useState<DataverseConnection[]>([]);
  const [editingConnection, setEditingConnection] = useState<DataverseConnection | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [testingConnection, setTestingConnection] = useState<DataverseConnection | null>(null);
  const [error, setError] = useState<{ type: any; message: string; details?: string } | null>(null);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [isCreatingTestData, setIsCreatingTestData] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = () => {
    try {
      const storedConnections = dataverseStore.getConnections();
      setConnections(storedConnections);
      setError(null);
    } catch (err: any) {
      setError({
        type: getErrorType(err),
        message: "接続情報の読み込みに失敗しました",
        details: err.message
      });
    }
  };

  const handleCreateConnection = (connection: Omit<DataverseConnection, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newConn: DataverseConnection = {
        ...connection,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dataverseStore.saveConnection(newConn);
      
      // 最初の接続は自動的にアクティブに
      if (connections.length === 0) {
        dataverseStore.setActiveConnection(newConn.id);
      }

      loadConnections();
      setIsFormOpen(false);
      toast.success(`接続 "${newConn.name}" を作成しました`);
    } catch (err: any) {
      toast.error("接続の作成に失敗しました");
      setError({
        type: getErrorType(err),
        message: "接続の作成に失敗しました",
        details: err.message
      });
    }
  };

  const handleUpdateConnection = (connection: DataverseConnection) => {
    try {
      const updatedConn = {
        ...connection,
        updatedAt: new Date().toISOString(),
      };
      
      dataverseStore.updateConnection(updatedConn);
      loadConnections();
      setEditingConnection(null);
      setIsFormOpen(false);
      toast.success(`接続 "${connection.name}" を更新しました`);
    } catch (err: any) {
      toast.error("接続の更新に失敗しました");
      setError({
        type: getErrorType(err),
        message: "接続の更新に失敗しました",
        details: err.message
      });
    }
  };

  const handleDeleteConnection = (id: string) => {
    try {
      const connection = connections.find(c => c.id === id);
      dataverseStore.deleteConnection(id);
      loadConnections();
      toast.success(`接続 "${connection?.name}" を削除しました`);
    } catch (err: any) {
      toast.error("接続の削除に失敗しました");
      setError({
        type: getErrorType(err),
        message: "接続の削除に失敗しました",
        details: err.message
      });
    }
  };

  const handleSetActiveConnection = (id: string) => {
    try {
      dataverseStore.setActiveConnection(id);
      loadConnections();
      const connection = connections.find(c => c.id === id);
      toast.success(`"${connection?.name}" をアクティブにしました`);
    } catch (err: any) {
      toast.error("アクティブ接続の設定に失敗しました");
    }
  };

  const handleTestConnection = (connection: DataverseConnection) => {
    setTestingConnection(connection);
  };

  const handleEditConnection = (connection: DataverseConnection) => {
    setEditingConnection(connection);
    setIsFormOpen(true);
  };

  const handleOpenCreateForm = () => {
    setEditingConnection(null);
    setIsFormOpen(true);
  };

  const handleFetchMdiProjects = async () => {
    setIsFetchingProjects(true);
    try {
      toast.info("mdi_project_listレコードを取得中...");
      console.log("\n" + "=".repeat(80));
      console.log("🚀 MDI Project List データ取得を開始します");
      console.log("=".repeat(80));
      
      const projects = await testFetchMdiProjects();
      
      toast.success(`${projects?.length || 0}件のレコードを取得しました。コンソールを確認してください。`);
      console.log("\n💡 ヒント: ブラウザの開発者ツール(F12)のコンソールタブで詳細を確認できます");
    } catch (err: any) {
      toast.error("レコード取得に失敗しました");
      console.error("\n❌ エラー:", err);
      setError({
        type: getErrorType(err),
        message: "mdi_project_listレコードの取得に失敗しました",
        details: err.message
      });
    } finally {
      setIsFetchingProjects(false);
    }
  };

  const handleCreateTestData = async () => {
    setIsCreatingTestData(true);
    try {
      toast.info("テストデータを作成中...");
      console.log("\n" + "=".repeat(80));
      console.log("✨ MDI Project List テストデータ作成を開始します");
      console.log("=".repeat(80));
      
      const createdProject = await testCreateMdiProject();
      
      if (createdProject) {
        toast.success(
          `テストデータを作成しました\n名前: ${createdProject.mdi_name}`,
          { duration: 5000 }
        );
        console.log("\n💡 ヒント: 'MDI Project List テスト'ボタンで作成されたデータを確認できます");
      } else {
        toast.error("テストデータの作成に失敗しました");
      }
      
    } catch (err: any) {
      toast.error("テストデータ作成に失敗しました");
      console.error("\n❌ エラー:", err);
      setError({
        type: getErrorType(err),
        message: "テストデータの作成に失敗しました",
        details: err.message
      });
    } finally {
      setIsCreatingTestData(false);
    }
  };

  const handleCreateEnvironmentSettingsTable = async () => {
    setIsCreatingTable(true);
    try {
      toast.info("環境設定テーブルの作成準備中...");
      console.log("\n" + "=".repeat(80));
      console.log("🏗️  環境設定テーブル作成処理を開始します");
      console.log("=".repeat(80));
      
      const result = await createEnvironmentSettingsTable();
      
      if (!result.success) {
        // PAC CLIコマンドをコンソールに表示
        console.log("\n📋 テーブル作成手順:");
        const commands = getTableCreationCommands();
        commands.forEach(cmd => console.log(cmd));
        
        // クリップボードにコピー
        const copied = await copyTableCreationCommandsToClipboard();
        
        if (copied) {
          toast.info(
            "PAC CLIコマンドをクリップボードにコピーしました。\nターミナルで実行してください。",
            { duration: 5000 }
          );
          console.log("\n✅ コマンドをクリップボードにコピーしました");
        } else {
          toast.warning(
            "コンソールに表示されたPAC CLIコマンドを\nターミナルで実行してください。",
            { duration: 5000 }
          );
        }
        
        console.log("\n💡 ヒント:");
        console.log("  1. 上記のコマンドをコピーしてターミナルで実行");
        console.log("  2. テーブル作成後、データソースとして追加");
        console.log("  3. アプリを再起動して新しいテーブルを使用");
      } else {
        toast.success("環境設定テーブルを作成しました");
      }
      
    } catch (err: any) {
      toast.error("テーブル作成処理に失敗しました");
      console.error("\n❌ エラー:", err);
      setError({
        type: getErrorType(err),
        message: "環境設定テーブルの作成に失敗しました",
        details: err.message
      });
    } finally {
      setIsCreatingTable(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ページヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-600" />
              Power Platform 接続設定
            </h1>
            <p className="text-muted-foreground mt-2">
              Dataverse環境への接続を管理し、接続テストを実行します
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleOpenCreateForm}>
              <Plus className="mr-2 h-4 w-4" />
              新しい接続
            </Button>
            <Button 
              onClick={handleFetchMdiProjects} 
              disabled={isFetchingProjects}
              variant="outline"
            >
              {isFetchingProjects ? (
                <>データ取得中...</>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  MDI Project List テスト
                </>
              )}
            </Button>
            <Button 
              onClick={handleCreateTestData} 
              disabled={isCreatingTestData}
              variant="outline"
            >
              {isCreatingTestData ? (
                <>作成中...</>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  テストデータ作成
                </>
              )}
            </Button>
            <Button 
              onClick={handleCreateEnvironmentSettingsTable} 
              disabled={isCreatingTable}
              variant="secondary"
            >
              {isCreatingTable ? (
                <>作成準備中...</>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  環境設定テーブル作成
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6">
          <ErrorAlert
            type={error.type}
            message={error.message}
            details={error.details}
            onDismiss={() => setError(null)}
            onRetry={loadConnections}
          />
        </div>
      )}

      {/* ステータスサマリーカード */}
      <div className="mb-8">
        <StatusSummaryCards connections={connections} />
      </div>

      {/* タブコンテンツ */}
      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            接続管理
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            テスト履歴
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            接続ログ
          </TabsTrigger>
        </TabsList>

        {/* 接続管理タブ */}
        <TabsContent value="connections" className="space-y-4">
          {connections.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">接続が登録されていません</h3>
              <p className="text-muted-foreground mb-6">
                Dataverse環境への接続を作成して、Power Platform と連携しましょう
              </p>
              <Button onClick={handleOpenCreateForm}>
                <Plus className="mr-2 h-4 w-4" />
                最初の接続を作成
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {connections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  onEdit={handleEditConnection}
                  onDelete={handleDeleteConnection}
                  onTest={handleTestConnection}
                  onSetActive={handleSetActiveConnection}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* テスト履歴タブ */}
        <TabsContent value="history">
          <TestHistoryTable connections={connections} />
        </TabsContent>

        {/* 接続ログタブ */}
        <TabsContent value="logs">
          <ConnectionLogTable 
            connections={connections} 
            logs={dataverseStore.getConnectionLogs()} 
          />
        </TabsContent>
      </Tabs>

      {/* 接続作成/編集ダイアログ */}
      <ConnectionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        connection={editingConnection || undefined}
        onSubmit={editingConnection ? handleUpdateConnection : handleCreateConnection}
      />

      {/* 接続テストダイアログ */}
      {testingConnection && (
        <ConnectionTestDialog
          connection={testingConnection}
          open={!!testingConnection}
          onOpenChange={(open) => !open && setTestingConnection(null)}
          onTestComplete={() => {
            loadConnections();
            setTestingConnection(null);
          }}
        />
      )}
    </div>
  );
}