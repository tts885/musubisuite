import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wrench, ArrowLeft, Package, Settings, Zap, Database } from "lucide-react"
import { Link } from "react-router-dom"

export default function ToolPortalPage() {
  return (
    <div className="w-full h-full px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ツールPortal</h1>
          <p className="text-muted-foreground mt-2">
            開発ツール、リソース、統合サービスのハブ
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center py-12">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-chart-3/10 flex items-center justify-center">
              <Wrench className="h-10 w-10 text-chart-3" />
            </div>
          </div>
          <CardTitle className="text-2xl">準備中</CardTitle>
          <CardDescription className="text-base mt-2">
            このアプリケーションは現在開発中です
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-12">
          <div className="max-w-2xl mx-auto">
            <h3 className="font-semibold mb-4 text-center">予定されている機能</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/50">
                <Package className="h-5 w-5 text-chart-3 mt-0.5" />
                <div>
                  <p className="font-medium">パッケージ管理</p>
                  <p className="text-sm text-muted-foreground">依存関係とライブラリの管理</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/50">
                <Settings className="h-5 w-5 text-chart-3 mt-0.5" />
                <div>
                  <p className="font-medium">設定管理</p>
                  <p className="text-sm text-muted-foreground">環境設定とコンフィグ管理</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/50">
                <Zap className="h-5 w-5 text-chart-3 mt-0.5" />
                <div>
                  <p className="font-medium">自動化ツール</p>
                  <p className="text-sm text-muted-foreground">CI/CDとデプロイメント自動化</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/50">
                <Database className="h-5 w-5 text-chart-3 mt-0.5" />
                <div>
                  <p className="font-medium">データベース管理</p>
                  <p className="text-sm text-muted-foreground">DB接続とクエリツール</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
