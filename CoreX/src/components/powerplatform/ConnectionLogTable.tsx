import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Download, FileText, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { DataverseConnection, ConnectionLogEntry } from "@/types/powerplatform";

interface ConnectionLogTableProps {
  connections: DataverseConnection[];
  logs: ConnectionLogEntry[];
}

export function ConnectionLogTable({ connections, logs }: ConnectionLogTableProps) {
  const [filterConnection, setFilterConnection] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");

  // フィルタリング
  const filteredLogs = logs.filter((log) => {
    if (filterConnection !== "all" && log.connectionId !== filterConnection) return false;
    if (filterLevel !== "all" && log.level !== filterLevel) return false;
    return true;
  });

  // CSV エクスポート
  const handleExportCSV = () => {
    const headers = ["日時", "レベル", "アクション", "接続名", "メッセージ", "詳細"];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss", { locale: ja }),
      log.level,
      log.action,
      log.connectionName || "-",
      log.message,
      log.details || ""
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dataverse-connection-logs-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`;
    link.click();
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "info": return <Info className="h-4 w-4" />;
      case "warning": return <AlertTriangle className="h-4 w-4" />;
      case "error": return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "info":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">INFO</Badge>;
      case "warning":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">WARNING</Badge>;
      case "error":
        return <Badge variant="destructive">ERROR</Badge>;
      default:
        return <Badge variant="outline">{level.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* フィルタとアクション */}
      <div className="flex items-center gap-4">
        <Select value={filterConnection} onValueChange={setFilterConnection}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="接続でフィルタ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての接続</SelectItem>
            {connections.map((conn) => (
              <SelectItem key={conn.id} value={conn.id}>
                {conn.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="レベル" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="info">INFO</SelectItem>
            <SelectItem value="warning">WARNING</SelectItem>
            <SelectItem value="error">ERROR</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={filteredLogs.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          CSV エクスポート
        </Button>
      </div>

      {/* ログテーブル */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">日時</TableHead>
              <TableHead className="w-[100px]">レベル</TableHead>
              <TableHead className="w-[150px]">アクション</TableHead>
              <TableHead className="w-[150px]">接続名</TableHead>
              <TableHead>メッセージ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  ログがありません
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {format(new Date(log.timestamp), "yyyy/MM/dd HH:mm:ss", { locale: ja })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getLevelIcon(log.level)}
                      {getLevelBadge(log.level)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {log.action}
                    </code>
                  </TableCell>
                  <TableCell>
                    {log.connectionName || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">{log.message}</p>
                      {log.details && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground">
                            詳細を表示
                          </summary>
                          <pre className="mt-1 p-2 bg-muted rounded overflow-x-auto">
                            {log.details}
                          </pre>
                        </details>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredLogs.length > 0 && (
          <p>
            全 {filteredLogs.length} 件のログを表示中
            {(filterConnection !== "all" || filterLevel !== "all") &&
              " (フィルタ適用済み)"}
          </p>
        )}
      </div>
    </div>
  );
}
