/**
 * 開発中ページ
 * 
 * 未実装機能へのアクセス時に表示される画面です。
 * ユーザーフレンドリーなデザインで開発状況を伝えます。
 * 
 * @module pages/under-construction
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate, useLocation } from "react-router-dom"
import { 
  Construction, 
  Home,
  Sparkles,
  Clock
} from "lucide-react"

/**
 * 開発中ページコンポーネント
 * 
 * 未実装機能にアクセスした際に表示されるユーザーフレンドリーな画面です。
 * 以下の要素を含みます:
 * - 開発中であることを示すアイコンとメッセージ
 * - 現在のページ情報
 * - ホームに戻るボタン
 * 
 * @component
 * @returns {JSX.Element} 開発中ページ
 * 
 * @example
 * ```tsx
 * // router.tsx
 * { path: "security", element: <UnderConstructionPage /> }
 * ```
 * 
 * @remarks
 * - 404エラーの代わりに使用
 * - ユーザー体験を向上
 * - 現代的なデザイン
 */
export default function UnderConstructionPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // パスから機能名を抽出
  const getFeatureName = () => {
    const path = location.pathname
    const segments = path.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    
    // パスに基づいて日本語の機能名を返す
    const featureNames: Record<string, string> = {
      'security': '認証・セキュリティ',
      'notifications': '通知設定',
      'appearance': '外観・テーマ',
      'dataverse': 'Dataverse接続',
      'api': 'API設定',
      'logs': 'システムログ',
      'about': 'バージョン情報',
      'config': '設定',
      'automation': '自動化',
      'database': 'データベース',
      'team': 'チーム',
      'repositories': 'リポジトリ',
    }
    
    return featureNames[lastSegment] || 'この機能'
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-background p-8">
      <Card className="max-w-2xl w-full border-2 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          {/* アニメーション付きアイコン */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
              <div className="relative w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                <Construction className="w-12 h-12 text-primary animate-pulse" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-foreground">
              開発中
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {getFeatureName()}は現在開発中です
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 情報カード */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  この機能は近日公開予定です
                </p>
                <p className="text-sm text-muted-foreground">
                  現在、開発チームが鋭意開発中です。より良いユーザー体験をお届けするため、もうしばらくお待ちください。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  開発状況
                </p>
                <p className="text-sm text-muted-foreground">
                  設計・実装フェーズ | 順次リリース予定
                </p>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="gap-2 px-8"
            >
              <Home className="w-4 h-4" />
              ホームに戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
