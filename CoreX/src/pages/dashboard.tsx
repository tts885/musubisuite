/**
 * ダッシュボードページ
 * 
 * 案件管理システムのメインダッシュボードで、統計情報とチャートを表示します。
 * Plane風の現代的なWebUIデザインを採用しています。
 * 
 * @module pages/dashboard
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  AlertCircle
} from "lucide-react"
import { 
  mockDashboardStats, 
  mockProjects,
  getPriorityLabel 
} from "@/data/mockData"
import type { Project } from "@/types"
import { Link } from "react-router-dom"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

/**
 * ダッシュボードページコンポーネント
 * 
 * 案件管理システムの統計情報とビジュアライゼーションを提供します。
 * 以下の情報を表示します:
 * - 統計カード(総案件数、完了案件数、総タスク数)
 * - プロジェクトステータス別の円グラフ
 * - タスク完了率の円グラフ
 * - 進行中プロジェクトの一覧カード
 * 
 * @component
 * @returns {JSX.Element} ダッシュボードページ
 * 
 * @example
 * ```tsx
 * // router.tsx
 * { index: true, element: <DashboardPage /> }
 * ```
 * 
 * @remarks
 * - Plane風の現代的なWebUIデザイン
 * - Wide表示で全幅を活用
 * - Rechartsによるチャート表示
 * - レスポンシブグリッドレイアウト
 * - モックデータを使用(将来的にはAPI連携予定)
 */
export default function DashboardPage() {
  const stats = mockDashboardStats
  const activeProjects = mockProjects.filter(p => p.status === 'active')

  // プロジェクトステータス別の集計データ
  const statusData = [
    { name: '計画中', value: mockProjects.filter(p => p.status === 'planning').length, color: '#8B5CF6' },  // Purple
    { name: '進行中', value: mockProjects.filter(p => p.status === 'active').length, color: '#10B981' },   // Green
    { name: '保留', value: mockProjects.filter(p => p.status === 'on-hold').length, color: '#F59E0B' },    // Yellow/Orange
    { name: '完了', value: mockProjects.filter(p => p.status === 'completed').length, color: '#EC4899' },  // Pink
  ]

  // タスク完了率データ
  const taskCompletionData = [
    { name: '完了', value: stats.completedTasks, color: '#10B981' },   // Green
    { name: '未完了', value: stats.totalTasks - stats.completedTasks, color: '#F97316' },  // Orange
  ]

  return (
    <div className="w-full h-full overflow-auto bg-background">
      {/* Wide表示のコンテナ - 最大幅なしで全幅使用 */}
      <div className="px-8 py-8 space-y-8">
        {/* Page Header - 現代的なヘッダーデザイン */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">ダッシュボード</h1>
          <p className="text-lg text-muted-foreground">
            案件管理システムの概要と統計情報
          </p>
        </div>

        {/* Stats Cards - 現代的なカードデザイン */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border bg-card hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">総案件数</CardTitle>
              <div className="p-2 bg-chart-1/10 rounded-lg">
                <FolderKanban className="h-5 w-5 text-chart-1" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalProjects}</div>
              <p className="text-sm text-muted-foreground mt-2">
                進行中: <span className="font-medium text-foreground">{stats.activeProjects}件</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">完了案件</CardTitle>
              <div className="p-2 bg-chart-2/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.completedProjects}</div>
              <p className="text-sm text-muted-foreground mt-2">
                完了率: <span className="font-medium text-foreground">{Math.round((stats.completedProjects / stats.totalProjects) * 100)}%</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">総タスク数</CardTitle>
              <div className="p-2 bg-chart-3/10 rounded-lg">
                <Clock className="h-5 w-5 text-chart-3" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalTasks}</div>
              <p className="text-sm text-muted-foreground mt-2">
                完了: <span className="font-medium text-foreground">{stats.completedTasks}件</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row - Wide表示で2カラムのチャート */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Project Status Chart - 案件ステータスチャート */}
          <Card className="border-border bg-card hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">案件ステータス</CardTitle>
              <CardDescription className="text-base">ステータス別の案件数</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ChartContainer config={{}} className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
                    label={({ name, percent, cx, cy, midAngle, outerRadius }) => {
                      const RADIAN = Math.PI / 180
                      const radius = outerRadius + 25
                      const x = cx + radius * Math.cos(-midAngle * RADIAN)
                      const y = cy + radius * Math.sin(-midAngle * RADIAN)
                      return (
                        <text 
                          x={x} 
                          y={y} 
                          fill="hsl(var(--foreground))" 
                          textAnchor={x > cx ? 'start' : 'end'} 
                          dominantBaseline="central"
                          className="text-sm font-medium"
                        >
                          {`${name} ${(percent * 100).toFixed(0)}%`}
                        </text>
                      )
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={3}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

          {/* Task Completion Chart - タスク完了状況チャート */}
          <Card className="border-border bg-card hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">タスク完了状況</CardTitle>
              <CardDescription className="text-base">完了タスク vs 未完了タスク</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ChartContainer config={{}} className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskCompletionData} barGap={20}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--muted-foreground))" 
                    opacity={0.2}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--foreground))"
                    fontSize={13}
                    fontWeight={500}
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground))"
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={100}
                  >
                    {taskCompletionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke={entry.color}
                        strokeWidth={0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

        {/* Active Projects and Recent Activities - Wide表示で2カラム */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Projects - 進行中の案件 */}
          <Card className="border-border bg-card hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">進行中の案件</CardTitle>
              <CardDescription className="text-base">アクティブな案件一覧</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeProjects.slice(0, 5).map((project: Project) => (
                  <Link 
                    key={project.id} 
                    to={`/projects/${project.id}`}
                    className="block hover:bg-accent/50 p-4 rounded-lg transition-all duration-200 border border-transparent hover:border-border hover:shadow-sm"
                  >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {getPriorityLabel(project.priority)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {project.endDate.toLocaleDateString('ja-JP')}まで
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>進捗</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                </Link>
              ))}
              
              {activeProjects.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  進行中の案件はありません
                </div>
              )}
            </div>
          </CardContent>
        </Card>

          {/* Recent Activities - 最近のアクティビティ */}
          <Card className="border-border bg-card hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">最近のアクティビティ</CardTitle>
              <CardDescription className="text-base">最新の更新情報</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
              {stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="mt-0.5">
                    {activity.action === 'task_completed' && (
                      <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    )}
                    {activity.action === 'task_updated' && (
                      <TrendingUp className="h-4 w-4 text-chart-1" />
                    )}
                    {activity.action === 'task_created' && (
                      <Clock className="h-4 w-4 text-chart-3" />
                    )}
                    {!['task_completed', 'task_updated', 'task_created'].includes(activity.action) && (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {stats.recentActivities.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  最近のアクティビティはありません
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
