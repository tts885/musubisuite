import { useState } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  FileText,
  Edit
} from "lucide-react"
import { 
  mockProjects, 
  mockClients, 
  mockMembers,
  mockAttachments,
  mockComments,
  getStatusLabel,
  getPriorityLabel,
  getTasksByProject,
  getMembersByProject
} from "@/data/mockData"
import type { ProjectStatus, ProjectPriority } from "@/types"

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const project = mockProjects.find(p => p.id === id)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editProject, setEditProject] = useState({
    name: project?.name || "",
    description: project?.description || "",
    clientId: project?.clientId || "",
    status: project?.status || "planning" as ProjectStatus,
    priority: project?.priority || "medium" as ProjectPriority,
    startDate: project?.startDate.toISOString().split('T')[0] || "",
    endDate: project?.endDate.toISOString().split('T')[0] || "",
    budget: project?.budget?.toString() || "",
  })
  const client = project ? mockClients.find(c => c.id === project.clientId) : undefined
  const projectTasks = project ? getTasksByProject(project.id) : []
  const projectMembers = project ? getMembersByProject(project.id) : []
  const projectAttachments = mockAttachments.filter(a => a.projectId === id)
  const projectComments = mockComments.filter(c => c.projectId === id)

  // 編集ハンドラー
  const handleEditProject = () => {
    // TODO: 実際のAPI呼び出しに置き換える
    console.log("案件更新:", editProject)
    setIsEditDialogOpen(false)
  }

  if (!project) {
    return (
      <div className="w-full h-full px-8 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">案件が見つかりません</h2>
          <p className="text-muted-foreground mt-2">指定された案件は存在しません</p>
          <Link to="/projects">
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
          <Link to="/projects">
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
                  <Select value={editProject.clientId} onValueChange={(value) => setEditProject({...editProject, clientId: value})}>
                    <SelectTrigger id="edit-client">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">ステータス</Label>
                  <Select value={editProject.status} onValueChange={(value) => setEditProject({...editProject, status: value as ProjectStatus})}>
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">計画中</SelectItem>
                      <SelectItem value="active">進行中</SelectItem>
                      <SelectItem value="on-hold">保留</SelectItem>
                      <SelectItem value="completed">完了</SelectItem>
                      <SelectItem value="cancelled">中止</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">優先度</Label>
                  <Select value={editProject.priority} onValueChange={(value) => setEditProject({...editProject, priority: value as ProjectPriority})}>
                    <SelectTrigger id="edit-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="urgent">緊急</SelectItem>
                    </SelectContent>
                  </Select>
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
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleEditProject} disabled={!editProject.name || !editProject.clientId || !editProject.endDate}>
                保存
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
                  <p className="text-sm font-medium">{client?.companyName}</p>
                  <p className="text-sm text-muted-foreground">{client?.name}</p>
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
                  {projectTasks.map(task => {
                    const assignee = task.assigneeId ? mockMembers.find(m => m.id === task.assigneeId) : undefined
                    return (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-muted-foreground">{task.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{assignee?.name || '未割当'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getStatusLabel(task.status)}</Badge>
                        </TableCell>
                        <TableCell>{getPriorityLabel(task.priority)}</TableCell>
                        <TableCell>
                          {task.dueDate ? task.dueDate.toLocaleDateString('ja-JP') : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {projectTasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        タスクはありません
                      </TableCell>
                    </TableRow>
                  )}
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
              <div className="space-y-4">
                {projectMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-4">
                    <img 
                      src={member.avatar} 
                      alt={member.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.position} - {member.department}
                      </div>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                ))}
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
              <div className="space-y-4">
                {projectAttachments.map(file => {
                  const uploader = mockMembers.find(m => m.id === file.uploadedBy)
                  return (
                    <div key={file.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{file.fileName}</div>
                        <div className="text-sm text-muted-foreground">
                          {(file.fileSize / 1024).toFixed(2)} KB • {uploader?.name} • 
                          {file.uploadedAt.toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">ダウンロード</Button>
                    </div>
                  )
                })}
                {projectAttachments.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    添付ファイルはありません
                  </div>
                )}
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
              <div className="space-y-4">
                {projectComments.map(comment => {
                  const author = mockMembers.find(m => m.id === comment.authorId)
                  return (
                    <div key={comment.id} className="flex gap-4">
                      <img 
                        src={author?.avatar} 
                        alt={author?.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{author?.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {comment.createdAt.toLocaleString('ja-JP')}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  )
                })}
                {projectComments.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    コメントはありません
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
