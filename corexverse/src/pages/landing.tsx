import { useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  FolderKanban, 
  Boxes, 
  Wrench,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Users,
  BarChart3,
  Clock
} from "lucide-react"
import { getLastVisitedPath, isExplicitHomeNavigation, clearExplicitHomeNavigation } from "@/hooks/use-route-tracker"
import { logger } from "@/lib/logger"

/**
 * ランディングページコンポーネント
 * 
 * corexverseのホーム画面で、３つのメインツールを紹介します。
 * 以下の要素を含みます:
 * - ヒーローセクション
 * - ツールカード(3つのアプリ)
 * - 各ツールの主要機能リスト
 * - ナビゲーションリンク
 * 
 * @component
 * @returns {JSX.Element} ランディングページ
 * 
 * @example
 * ```tsx
 * // router.tsx
 * { index: true, element: <LandingPage /> }
 * ```
 * 
 * @remarks
 * - ルートパス: /
 * - 3つのアプリ: 案件管理、プロジェクト管理、ツールPortal
 * - レスポンシブデザイン
 * - グラデーション背景とアニメーション効果
 * - 現代的なWebUIデザイン
 * - 再訪問時は最後に訪問したページにリダイレクト
 * - 明示的なホームナビゲーション時はランディングページを表示
 */
export default function LandingPage() {
  const navigate = useNavigate()
  const hasProcessedRef = useRef(false)

  useEffect(() => {
    // React Strict Modeの重複実行を防ぐ
    if (hasProcessedRef.current) {
      logger.debug('[LandingPage] Already processed, skipping...')
      return
    }
    
    logger.debug('[LandingPage] Checking navigation...', {
      isExplicit: isExplicitHomeNavigation(),
      lastPath: getLastVisitedPath()
    })
    
    // 明示的なホームナビゲーション(ホームボタンクリック)の場合はランディングページを表示
    if (isExplicitHomeNavigation()) {
      logger.debug('[LandingPage] Explicit home navigation detected - showing landing page')
      // フラグをクリアしてランディングページを表示
      clearExplicitHomeNavigation()
      hasProcessedRef.current = true
      return // ランディングページを表示
    }
    
    // F5リロードまたは直接アクセスの場合: 最後に訪問したページにリダイレクト
    const lastPath = getLastVisitedPath()
    const targetRoute = lastPath && lastPath !== '/' && lastPath !== '/landing'
      ? lastPath
      : '/dashboard'
    
    logger.debug('[LandingPage] Auto-redirecting to:', targetRoute)
    hasProcessedRef.current = true
    navigate(targetRoute, { replace: true })
  }, [navigate])

  // 各ツールの情報
  const tools = [
    {
      id: 1,
      name: "案件管理",
      description: "プロジェクトの進捗管理とタスク追跡を効率化",
      icon: FolderKanban,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      path: "/dashboard",
      features: [
        "ダッシュボードで一目で全体を把握",
        "DataGridで案件を効率的に管理",
        "メンバーとクライアントの一元管理"
      ]
    },
    {
      id: 2,
      name: "プロジェクト管理",
      description: "スプリントベースの開発プロセスを最適化",
      icon: Boxes,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      path: "/project-management",
      features: [
        "スプリント計画とタイムライン管理",
        "カンバンボードでタスクを可視化",
        "チーム協力とGit連携"
      ]
    },
    {
      id: 3,
      name: "ツールPortal",
      description: "開発ツールと自動化で生産性を向上",
      icon: Wrench,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      path: "/tool-portal",
      features: [
        "パッケージ依存関係の管理",
        "環境設定の一元管理",
        "CI/CDワークフローの自動化"
      ]
    }
  ]

  // 主要機能
  const features = [
    {
      icon: Zap,
      title: "高速パフォーマンス",
      description: "最新技術スタックで快適な操作体験を実現"
    },
    {
      icon: Shield,
      title: "セキュアな環境",
      description: "エンタープライズグレードのセキュリティ対策"
    },
    {
      icon: Users,
      title: "チーム協力",
      description: "リアルタイムでのコラボレーション機能"
    },
    {
      icon: BarChart3,
      title: "分析とレポート",
      description: "データ駆動型の意思決定をサポート"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* メインコンテンツ */}
      <div className="w-full">
      {/* Hero Section - ヒーローセクション */}
      <section className="relative overflow-hidden border-b border-border">
        {/* 背景グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <div className="relative max-w-7xl mx-auto px-8 py-20 lg:py-32">
          <div className="text-center space-y-8">
            {/* バッジ */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full border border-primary/20">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">corexverse へようこそ</span>
            </div>

            {/* メインタイトル */}
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              すべてのプロジェクトを
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                一つのプラットフォームで
              </span>
            </h1>

            {/* サブタイトル */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              案件管理からプロジェクト実行、開発ツールまで。
              <br />
              チームの生産性を最大化する統合ワークスペース
            </p>

            {/* CTA ボタン */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="gap-2 shadow-lg">
                <Link to="/dashboard">
                  今すぐ始める
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#tools">ツールを見る</a>
              </Button>
            </div>

            {/* 統計情報 */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">3</div>
                <div className="text-sm text-muted-foreground mt-1">統合ツール</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  <Clock className="w-8 h-8 inline-block" />
                </div>
                <div className="text-sm text-muted-foreground mt-1">リアルタイム同期</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">100%</div>
                <div className="text-sm text-muted-foreground mt-1">クラウドベース</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section - ツール紹介セクション */}
      <section id="tools" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-8">
          {/* セクションヘッダー */}
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-foreground">
              パワフルなツールスイート
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              プロジェクトのライフサイクル全体をカバーする3つの統合ツール
            </p>
          </div>

          {/* ツールカード */}
          <div className="grid md:grid-cols-3 gap-8">
            {tools.map((tool, index) => {
              const Icon = tool.icon
              return (
                <Card 
                  key={tool.id} 
                  className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
                  style={{ 
                    animationDelay: `${index * 100}ms` 
                  }}
                >
                  {/* カードヘッダー */}
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${tool.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${tool.color}`} />
                    </div>
                    <CardTitle className="text-2xl">{tool.name}</CardTitle>
                    <CardDescription className="text-base">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>

                  {/* カードコンテンツ */}
                  <CardContent className="space-y-4">
                    {/* 機能リスト */}
                    <ul className="space-y-2">
                      {tool.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* アクションボタン */}
                    <Button asChild className="w-full gap-2 mt-4" variant="outline">
                      <Link to={tool.path}>
                        使ってみる
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </CardContent>

                  {/* ホバーエフェクト */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section - 機能セクション */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-8">
          {/* セクションヘッダー */}
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-foreground">
              なぜ corexverse なのか
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              現代的なチームに必要な全ての機能を提供
            </p>
          </div>

          {/* 機能グリッド */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index}
                  className="text-center space-y-4 p-6 rounded-xl bg-card hover:bg-accent/5 transition-colors duration-300"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - 行動喚起セクション */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <div className="p-12 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-border space-y-6">
            <h2 className="text-4xl font-bold text-foreground">
              今すぐ始めましょう
            </h2>
            <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
              アカウント作成は不要。すぐにCoreXverseのすべての機能をお試しいただけます。
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="gap-2 shadow-lg">
                <Link to="/dashboard">
                  ダッシュボードへ
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 CoreXverse. All rights reserved.</p>
            <p className="mt-2">Powered by React + TypeScript + Vite</p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}
