import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import type { DataverseConnection, ConnectionTestResult } from '@/types/powerplatform';
import { testConnection } from '@/services/powerplatform/connectionTestService';

interface ConnectionTestDialogProps {
  connection: DataverseConnection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTestComplete?: () => void;
}

export function ConnectionTestDialog({
  connection,
  open,
  onOpenChange,
  onTestComplete
}: ConnectionTestDialogProps) {
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    if (!connection) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testConnection(connection);
      setTestResult(result);
      onTestComplete?.();
    } catch (error) {
      const errorResult: ConnectionTestResult = {
        success: false,
        message: error instanceof Error ? error.message : '不明なエラーが発生しました',
        timestamp: new Date().toISOString(),
        error: {
          code: 'UNKNOWN',
          message: error instanceof Error ? error.message : String(error)
        }
      };
      setTestResult(errorResult);
      onTestComplete?.();
    } finally {
      setIsTesting(false);
    }
  };

  const handleClose = () => {
    setTestResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>接続テスト</DialogTitle>
          <DialogDescription>
            {connection.name} への接続をテストします
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 接続情報 */}
          <div className="rounded-lg border p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">環境ID:</span>
              <span className="font-mono text-xs">{connection.environmentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">環境URL:</span>
              <span className="font-mono text-xs">{connection.environmentUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">APIバージョン:</span>
              <span>{connection.apiVersion}</span>
            </div>
          </div>

          {/* テスト実行中 */}
          {isTesting && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">接続テストを実行中...</span>
              </div>
              <Progress value={undefined} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Dataverseへの接続を確認しています。しばらくお待ちください。
              </p>
            </div>
          )}

          {/* テスト結果 */}
          {testResult && !isTesting && (
            <div className="space-y-4">
              {testResult.success ? (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <AlertDescription className="text-green-700">
                    <strong>接続テストが成功しました!</strong>
                    <p className="mt-1">{testResult.message}</p>
                    {testResult.responseTime && (
                      <p className="text-sm mt-1">応答時間: {testResult.responseTime}ms</p>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-5 w-5" />
                  <AlertDescription>
                    <strong>接続テストが失敗しました</strong>
                    <p className="mt-1">{testResult.message}</p>
                    {testResult.error && (
                      <p className="text-sm mt-1 font-mono">
                        エラーコード: {testResult.error.code}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

          {/* テストステップ詳細 */}
          {testResult.details && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">テスト詳細:</h4>
              <div className="p-3 rounded-lg border bg-muted/50 max-h-96 overflow-y-auto">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                  {testResult.details}
                </pre>
              </div>
            </div>
          )}              {/* エラーガイダンス */}
              {!testResult.success && (
                <Alert>
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription>
                    <strong>トラブルシューティング:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>環境IDとURLが正しいか確認してください</li>
                      <li>Power Platform管理センターでアクセス権限を確認してください</li>
                      <li>ブラウザでDataverse環境にアクセスできるか確認してください</li>
                      <li>ネットワーク接続とファイアウォール設定を確認してください</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-3 pt-4">
            {!testResult && !isTesting && (
              <Button onClick={handleTest} className="flex-1">
                テストを開始
              </Button>
            )}
            {testResult && !isTesting && (
              <Button onClick={handleTest} variant="outline" className="flex-1">
                再テスト
              </Button>
            )}
            <Button onClick={handleClose} variant="outline" disabled={isTesting}>
              閉じる
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
