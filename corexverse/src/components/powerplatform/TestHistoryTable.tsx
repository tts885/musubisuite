import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Download, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { DataverseConnection, TestHistoryEntry } from "@/types/powerplatform";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface TestHistoryTableProps {
  connections: DataverseConnection[];
}

export function TestHistoryTable({ connections }: TestHistoryTableProps) {
  const [selectedTest, setSelectedTest] = useState<{
    connection: DataverseConnection;
    test: TestHistoryEntry;
  } | null>(null);
  const [filterConnection, setFilterConnection] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // すべてのテスト履歴を取得
  const allTests = connections.flatMap(connection => 
    (connection.testHistory || []).map((test: TestHistoryEntry) => ({
      connection,
      test
    }))
  ).sort((a, b) => 
    new Date(b.test.executedAt).getTime() - new Date(a.test.executedAt).getTime()
  );

  // フィルタリング
  const filteredTests = allTests.filter(({ connection, test }) => {
    if (filterConnection !== "all" && connection.id !== filterConnection) return false;
    if (filterStatus !== "all") {
      if (filterStatus === "success" && test.status !== 'success') return false;
      if (filterStatus === "failure" && test.status !== 'failure') return false;
    }
    return true;
  });

  // CSV エクスポート
  const handleExportCSV = () => {
    const headers = ["実行日時", "接続名", "環境ID", "ステータス", "応答時間(ms)", "エラーメッセージ"];
    const rows = filteredTests.map(({ connection, test }) => [
      format(new Date(test.executedAt), "yyyy-MM-dd HH:mm:ss", { locale: ja }),
      connection.name,
      connection.environmentId,
      test.status === 'success' ? "成功" : "失敗",
      test.responseTime?.toString() || "",
      test.errorMessage || ""
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dataverse-test-history-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`;
    link.click();
  };

  const getTestTypeLabel = (testType: string) => {
    switch (testType) {
      case "basic": return "基本接続";
      case "whoami": return "WhoAmI";
      case "query": return "クエリ実行";
      default: return testType;
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
            {connections.map(conn => (
              <SelectItem key={conn.id} value={conn.id}>
                {conn.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="success">成功のみ</SelectItem>
            <SelectItem value="failure">失敗のみ</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={filteredTests.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          CSV エクスポート
        </Button>
      </div>

      {/* テスト履歴テーブル */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>実行日時</TableHead>
              <TableHead>接続名</TableHead>
              <TableHead>テストタイプ</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="text-right">応答時間</TableHead>
              <TableHead className="text-center">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  テスト履歴がありません
                </TableCell>
              </TableRow>
            ) : (
              filteredTests.map(({ connection, test }, index) => (
                <TableRow key={`${connection.id}-${index}`}>
                  <TableCell className="font-mono text-sm">
                    {format(new Date(test.executedAt), "yyyy/MM/dd HH:mm:ss", { locale: ja })}
                  </TableCell>
                  <TableCell>{connection.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTestTypeLabel(test.testType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {test.status === 'success' ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        成功
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        失敗
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {test.responseTime ? `${test.responseTime}ms` : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTest({ connection, test })}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredTests.length > 0 && (
          <p>
            全 {filteredTests.length} 件のテスト履歴を表示中
            {(filterConnection !== "all" || filterStatus !== "all") && 
              " (フィルタ適用済み)"}
          </p>
        )}
      </div>

      {/* テスト詳細ダイアログ */}
      <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>テスト詳細</DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-4">
                {/* 基本情報 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">接続名</p>
                    <p className="mt-1">{selectedTest.connection.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">環境ID</p>
                    <p className="mt-1 font-mono text-sm">
                      {selectedTest.connection.environmentId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">実行日時</p>
                    <p className="mt-1">
                      {format(new Date(selectedTest.test.executedAt), "yyyy年MM月dd日 HH:mm:ss", { locale: ja })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">応答時間</p>
                    <p className="mt-1">
                      {selectedTest.test.responseTime ? `${selectedTest.test.responseTime}ms` : "-"}
                    </p>
                  </div>
                </div>

                {/* ステータス */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">ステータス</p>
                  {selectedTest.test.status === 'success' ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      成功
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      失敗
                    </Badge>
                  )}
                </div>

                {/* エラー情報 */}
                {selectedTest.test.errorMessage && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      エラー情報
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="font-medium text-red-900">
                        {selectedTest.test.errorMessage}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
