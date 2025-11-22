import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Circle, Play, Trash2, Settings } from 'lucide-react';
import type { DataverseConnection } from '@/types/powerplatform';

interface ConnectionCardProps {
  connection: DataverseConnection;
  isActive: boolean;
  onActivate: (id: string) => void;
  onTest: (connection: DataverseConnection) => void;
  onEdit: (connection: DataverseConnection) => void;
  onDelete: (id: string) => void;
}

export function ConnectionCard({
  connection,
  isActive,
  onActivate,
  onTest,
  onEdit,
  onDelete
}: ConnectionCardProps) {
  const getStatusBadge = () => {
    if (!connection.lastTestDate) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Circle className="h-3 w-3" />
          未テスト
        </Badge>
      );
    }

    if (connection.lastTestStatus === 'success') {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-500">
          <CheckCircle2 className="h-3 w-3" />
          接続成功
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        接続失敗
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return '-';
    }
  };

  return (
    <Card className={isActive ? 'border-primary border-2' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{connection.displayName}</CardTitle>
              {isActive && (
                <Badge variant="default" className="bg-blue-500">
                  アクティブ
                </Badge>
              )}
            </div>
            {connection.description && (
              <CardDescription className="mt-1">{connection.description}</CardDescription>
            )}
          </div>
          <div>{getStatusBadge()}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">環境ID:</span>
            <span className="font-mono text-xs">{connection.environmentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">環境URL:</span>
            <span className="font-mono text-xs truncate max-w-[250px]" title={connection.environmentUrl}>
              {connection.environmentUrl}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">APIバージョン:</span>
            <span>{connection.apiVersion}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">最終テスト:</span>
            <span>{formatDate(connection.lastTestDate)}</span>
          </div>
          {connection.lastTestMessage && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">テスト結果:</span>
              <span className="text-xs text-muted-foreground">{connection.lastTestMessage}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {!isActive && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onActivate(connection.id)}
            >
              アクティブ化
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onTest(connection)}
          >
            <Play className="h-4 w-4 mr-1" />
            テスト
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(connection)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(connection.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
