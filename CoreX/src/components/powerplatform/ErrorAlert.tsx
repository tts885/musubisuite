import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ErrorType = "auth" | "permission" | "network" | "validation" | "unknown";

interface ErrorAlertProps {
  type: ErrorType;
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorAlert({
  type,
  title,
  message,
  details,
  onRetry,
  onDismiss,
}: ErrorAlertProps) {
  const getErrorConfig = () => {
    switch (type) {
      case "auth":
        return {
          icon: XCircle,
          variant: "destructive" as const,
          defaultTitle: "認証エラー",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          helpText: "Power Platform への認証に失敗しました。環境IDとURLが正しいか確認してください。",
        };
      case "permission":
        return {
          icon: AlertCircle,
          variant: "destructive" as const,
          defaultTitle: "アクセスが拒否されました",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          helpText: "Dataverse テーブルへのアクセス権限がありません。システム管理者に権限を確認してください。",
        };
      case "network":
        return {
          icon: AlertTriangle,
          variant: "default" as const,
          defaultTitle: "ネットワークエラー",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          helpText: "ネットワーク接続を確認してください。ファイアウォールやプロキシ設定が原因の可能性があります。",
        };
      case "validation":
        return {
          icon: Info,
          variant: "default" as const,
          defaultTitle: "入力エラー",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          helpText: "入力内容を確認して、再度お試しください。",
        };
      default:
        return {
          icon: AlertCircle,
          variant: "destructive" as const,
          defaultTitle: "エラーが発生しました",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          helpText: "予期しないエラーが発生しました。問題が解決しない場合は、サポートにお問い合わせください。",
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  return (
    <Alert variant={config.variant} className={`${config.bgColor} ${config.borderColor}`}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title || config.defaultTitle}</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>{message}</p>
          {details && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">
                詳細を表示
              </summary>
              <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-x-auto border">
                {details}
              </pre>
            </details>
          )}
          <p className="text-sm mt-2 opacity-90">{config.helpText}</p>
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  再試行
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  閉じる
                </Button>
              )}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// ヘルパー関数: エラーオブジェクトからエラータイプを判定
export function getErrorType(error: any): ErrorType {
  const message = error?.message?.toLowerCase() || "";
  const status = error?.status || error?.statusCode;

  if (status === 401 || message.includes("unauthorized") || message.includes("authentication")) {
    return "auth";
  }
  if (status === 403 || message.includes("forbidden") || message.includes("permission")) {
    return "permission";
  }
  if (message.includes("network") || message.includes("timeout") || message.includes("fetch")) {
    return "network";
  }
  if (status >= 400 && status < 500) {
    return "validation";
  }
  return "unknown";
}
