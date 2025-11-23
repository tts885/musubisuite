/**
 * プロジェクト詳細ページ
 * 
 * 個別プロジェクトの詳細情報、タスク管理、編集機能を提供します。
 * タブインターフェースで複数の情報を管理します。
 * 
 * @module pages/project-detail
 */

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle2,
  Edit,
  Check,
  ChevronsUpDown
} from "lucide-react"
import { 
  getStatusLabel,
  getPriorityLabel,
} from "@/data/mockData"
import type { Project, Client, ProjectStatus, ProjectPriority, Member } from "@/types"
import { djangoAPI } from "@/services/djangoAPI"
import { toast } from "sonner"
import { CodeMasterSelect } from "@/components/shared/CodeMasterSelect"

/**
 * プロジェクト詳細ページコンポーネント
 * 
 * 個別プロジェクトの詳細情報を表示および管理します。
 * 以下の機能を含みます:
 * - プロジェクト基本情報表示
 * - プロジェクト編集ダイアログ
 * - タブ切り替えインターフェース(概要/タスク/メンバー/アクティビティ)
 * - タスク一覧と新規作成
 * - メンバーアサイン管理
 * - アクティビティタイムライン
 * 
 * @component
 * @returns {JSX.Element} プロジェクト詳細ページ
 * 
 * @example
 * ```tsx
 * // router.tsx
 * { path: "projects/:id", element: <ProjectDetailPage /> }
 * ```
 * 
 * @remarks
 * - URLパラメータからプロジェクトIDを取得
 * - Django REST API経由でデータ取得と更新
 * - Sonnerによるトースト通知
 * - レスポンシブレイアウト
 */
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false)
  const [editProject, setEditProject] = useState({
    name: "",
    description: "",
    clientId: "",
    status: "planning" as ProjectStatus,
    priority: "medium" as ProjectPriority,
    startDate: "",
    endDate: "",
    budget: "",
  })
  const [clients, setClients] = useState<Client[]>([])

  // プロジェクトデータを取得
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      
      setIsLoading(true)
      try {
        // クライアント一覧を取得
        const clientsData = await djangoAPI.getClients()
        const clientsList = clientsData.results || clientsData
        setClients(clientsList)

        // プロジェクト詳細を取得
        const projectData = await djangoAPI.getProject(id)
        
        // データを変換
        const transformedProject: Project = {
          id: String(projectData.id),
          name: projectData.name,
          description: projectData.description,
          status: projectData.status,
          priority: projectData.priority,
          clientId: String(projectData.client.id),
          startDate: new Date(projectData.start_date),
          endDate: new Date(projectData.end_date),
          budget: projectData.budget,
          progress: projectData.progress,
          ownerId: projectData.owner?.id ? String(projectData.owner.id) : '',
          memberIds: projectData.members?.map((m: Member) => String(m.id)) || [],
          tags: projectData.tags || [],
          createdAt: new Date(projectData.created_at),
          updatedAt: new Date(projectData.updated_at),
        }
        
        setProject(transformedProject)
        
        // クライアント情報を取得
        const clientInfo = clientsList.find((c: Client) => String(c.id) === String(projectData.client.id))
        setClient(clientInfo || null)
        
        // 編集フォームを初期化
        setEditProject({
          name: transformedProject.name,
          description: transformedProject.description,
          clientId: transformedProject.clientId,
          status: transformedProject.status,
          priority: transformedProject.priority,
          startDate: transformedProject.startDate.toISOString().split('T')[0],
          endDate: transformedProject.endDate.toISOString().split('T')[0],
          budget: transformedProject.budget?.toString() || "",
        })
        
      } catch (error) {
        console.error('プロジェクト取得エラー:', error)
        toast.error('プロジェクトの取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  // 編集ハンドラー
  const handleEditProject = async () => {
    if (!project || !id) return
    
    setIsUpdating(true)
    try {
      const updateData = {
        name: editProject.name,
        description: editProject.description,
        status: editProject.status,
        priority: editProject.priority,
        client_id: editProject.clientId,
        start_date: editProject.startDate,
        end_date: editProject.endDate,
        budget: editProject.budget ? parseFloat(editProject.budget) : undefined,
        tags: project.tags,
      }
      
      const updatedProject = await djangoAPI.updateProject(id, updateData as any)
      
      // ローカルの状態を更新
      const transformedProject: Project = {
        id: String(updatedProject.id),
        name: updatedProject.name,
        description: updatedProject.description,
        status: updatedProject.status,
        priority: updatedProject.priority,
        clientId: String(updatedProject.client.id),
        startDate: new Date(updatedProject.start_date),
        endDate: new Date(updatedProject.end_date),
        budget: updatedProject.budget,
        progress: updatedProject.progress,
        ownerId: updatedProject.owner?.id ? String(updatedProject.owner.id) : '',
        memberIds: updatedProject.members?.map((m: any) => String(m.id)) || [],
        tags: updatedProject.tags || [],
        createdAt: new Date(updatedProject.created_at),
        updatedAt: new Date(updatedProject.updated_at),
      }
      
      setProject(transformedProject)
      setIsEditDialogOpen(false)
      toast.success('案件を更新しました')
      
    } catch (error: any) {
      console.error('案件更新エラー:', error)
      console.error('エラーレスポンス:', error.response?.data)
      
      let errorMessage = '案件更新中にエラーが発生しました'
      if (error.response?.data) {
        const data = error.response.data
        if (typeof data === 'object') {
          const errors = Object.entries(data).map(([field, messages]) => {
            const msg = Array.isArray(messages) ? messages.join(', ') : messages
            return `${field}: ${msg}`
          }).join('\n')
          errorMessage = errors || errorMessage
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  const projectTasks: any[] = []
  const projectMembers: any[] = []
  const projectAttachments: any[] = []
  const projectComments: any[] = []

  if (isLoading) {
    return (
      <div className="w-full h-full px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="w-full h-full px-8 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">案件が見つかりません</h2>
          <p className="text-muted-foreground mt-2">指定された案件は存在しません</p>
          <Link to="/dashboard/projects">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              案件一覧に戻る
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const completedTasks = projectTasks.filter(t => t.status === 'done').length
  const taskCompletionRate = projectTasks.length > 0 
    ? Math.round((completedTasks / projectTasks.length) * 100)
    : 0

  return (
    <div className="w-full h-full px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Link to="/dashboard/projects">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              案件一覧に戻る
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex items-center gap-2">
            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
              {getStatusLabel(project.status)}
            </Badge>
            <Badge variant="outline">
              {getPriorityLabel(project.priority)}優先度
            </Badge>
          </div>
        </div>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>案件編集</DialogTitle>
              <DialogDescription>
                案件情報を編集してください
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">案件名 *</Label>
                <Input
                  id="edit-name"
                  value={editProject.name}
                  onChange={(e) => setEditProject({...editProject, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">説明</Label>
                <Textarea
                  id="edit-description"
                  value={editProject.description}
                  onChange={(e) => setEditProject({...editProject, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-client">クライアント *</Label>
                  <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientPopoverOpen}
                        className="w-full justify-between"
                      >
                        {editProject.clientId
                          ? clients.find((client) => String(client.id) === editProject.clientId)?.company_name || "クライアントを選択"
                          : "クライアントを選択"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="クライアント名で検索..." />
                        <CommandList>
                          <CommandEmpty>クライアントが見つかりません。</CommandEmpty>
                          <CommandGroup>
                            {clients.map((client) => (
                              <CommandItem
                                key={client.id}
                                value={client.company_name}
                                onSelect={() => {
                                  setEditProject({...editProject, clientId: String(client.id)})
                                  setClientPopoverOpen(false)
                                }}
                              >
                                <Check
                                  className={"mr-2 h-4 w-4 " + (editProject.clientId === String(client.id) ? "opacity-100" : "opacity-0")}
                                />
                                {client.company_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">ステータス</Label>
                  <CodeMasterSelect
                    category="PROJECT_STATUS"
                    value={editProject.status}
                    onChange={(value) => setEditProject({...editProject, status: value as ProjectStatus})}
                    placeholder="ステータスを選択"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">優先度</Label>
                  <CodeMasterSelect
                    category="PROJECT_PRIORITY"
                    value={editProject.priority}
                    onChange={(value) => setEditProject({...editProject, priority: value as ProjectPriority})}
                    placeholder="優先度を選択"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-budget">予算</Label>
                  <Input
                    id="edit-budget"
                    type="number"
                    value={editProject.budget}
                    onChange={(e) => setEditProject({...editProject, budget: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startDate">開始日</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={editProject.startDate}
                    onChange={(e) => setEditProject({...editProject, startDate: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-endDate">期限 *</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={editProject.endDate}
                    onChange={(e) => setEditProject({...editProject, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
                キャンセル
              </Button>
              <Button onClick={handleEditProject} disabled={!editProject.name || !editProject.clientId || !editProject.endDate || isUpdating}>
                {isUpdating ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">進捗率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progress}%</div>
            <Progress value={project.progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">予算</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.budget ? `¥${project.budget.toLocaleString('ja-JP')}` : '未設定'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              プロジェクト予算
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">期限</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.endDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              開始: {project.startDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">チーム</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectMembers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              メンバー数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="tasks">タスク ({projectTasks.length})</TabsTrigger>
          <TabsTrigger value="members">メンバー ({projectMembers.length})</TabsTrigger>
          <TabsTrigger value="files">ファイル ({projectAttachments.length})</TabsTrigger>
          <TabsTrigger value="comments">コメント ({projectComments.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>案件情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">説明</h4>
                  <p className="text-sm">{project.description}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">クライアント</h4>
                  <p className="text-sm font-medium">{client?.company_name}</p>
                  {client?.contact_name && (
                    <p className="text-sm text-muted-foreground">{client.contact_name}</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">タグ</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>タスク統計</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">完了率</span>
                    <span className="font-medium">{taskCompletionRate}%</span>
                  </div>
                  <Progress value={taskCompletionRate} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">総タスク数</p>
                    <p className="text-2xl font-bold">{projectTasks.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">完了タスク</p>
                    <p className="text-2xl font-bold">{completedTasks}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">進行中</p>
                    <p className="text-2xl font-bold">
                      {projectTasks.filter(t => t.status === 'in-progress').length}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">未着手</p>
                    <p className="text-2xl font-bold">
                      {projectTasks.filter(t => t.status === 'todo').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>タスク一覧</CardTitle>
              <CardDescription>案件に関連するタスク</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>タスク名</TableHead>
                    <TableHead>担当者</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>優先度</TableHead>
                    <TableHead>期限</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      タスク機能は今後実装予定です
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>プロジェクトメンバー</CardTitle>
              <CardDescription>案件に参加しているメンバー</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                メンバー機能は今後実装予定です
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>添付ファイル</CardTitle>
              <CardDescription>案件に関連するファイル</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                ファイル機能は今後実装予定です
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>コメント</CardTitle>
              <CardDescription>案件に関するコメント</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                コメント機能は今後実装予定です
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
