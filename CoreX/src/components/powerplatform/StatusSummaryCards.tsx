import { Card, CardContent } from "@/components/ui/card";
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { DataverseConnection } from "@/types/powerplatform";

interface StatusSummaryCardsProps {
  connections: DataverseConnection[];
}

export function StatusSummaryCards({ connections }: StatusSummaryCardsProps) {
  const totalConnections = connections.length;
  const activeConnection = connections.find(c => c.isActive);
  const recentTests = connections.reduce((sum, c) => sum + (c.testHistory?.length || 0), 0);
  
  // 最近のテスト成功率を計算
  const allTests = connections.flatMap(c => c.testHistory || []);
  const recentSuccessTests = allTests.filter(t => t.status === 'success').length;
  const successRate = allTests.length > 0 
    ? Math.round((recentSuccessTests / allTests.length) * 100) 
    : 0;

  const stats = [
    {
      title: "登録済み接続",
      value: totalConnections,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "アクティブ接続",
      value: activeConnection ? 1 : 0,
      subtitle: activeConnection?.name,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "テスト成功率",
      value: `${successRate}%`,
      subtitle: `${recentSuccessTests}/${allTests.length}件成功`,
      icon: allTests.length > 0 && successRate >= 80 ? CheckCircle2 : XCircle,
      color: allTests.length > 0 && successRate >= 80 ? "text-green-600" : "text-red-600",
      bgColor: allTests.length > 0 && successRate >= 80 ? "bg-green-50" : "bg-red-50",
    },
    {
      title: "総テスト実行数",
      value: recentTests,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
