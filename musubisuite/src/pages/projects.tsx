import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Plus
} from "lucide-react"
import { getStatusLabel, getPriorityLabel } from "@/data/mockData"
import type { Project, Client, ProjectStatus, ProjectPriority } from "@/types"
import { djangoAPI } from "@/services/djangoAPI"
import { toast } from "sonner"

export default function ProjectsPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | "all">("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    clientId: "",
    status: "planning" as ProjectStatus,
    priority: "medium" as ProjectPriority,
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    budget: "",
  })

  // 初期データを取得
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // クライアント一覧を取得
        const clientsData = await djangoAPI.getClients();
        console.log('取得したクライアントデータ:', clientsData);
        const clients = clientsData.results || clientsData;
        console.log('設定するクライアント:', clients);
        setClients(clients);

        // プロジェクト一覧を取得
        const projectsData = await djangoAPI.getProjects();
        console.log('取得したプロジェクトデータ:', projectsData);
        const projects = projectsData.results || projectsData;
        
        // Django APIのレスポンスをフロントエンドの型に変換
        const transformedProjects = projects.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          description: p.description,
          status: p.status,
          priority: p.priority,
          clientId: String(p.client.id),
          startDate: new Date(p.start_date),
          endDate: new Date(p.end_date),
          budget: p.budget,
          progress: p.progress,
          ownerId: p.owner?.id ? String(p.owner.id) : '',
          memberIds: p.members?.map((m: any) => String(m.id)) || [],
          tags: p.tags || [],
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
        }));
        
        console.log('設定するプロジェクト:', transformedProjects);
        setProjects(transformedProjects);
        
      } catch (error) {
        console.error('データ取得エラー:', error);
        toast.error('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 新規案件作成ハンドラー
  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('案件名を入力してください');
      return;
    }

    if (!newProject.clientId) {
      toast.error('クライアントを選択してください');
      return;
    }

    if (!newProject.endDate) {
      toast.error('期限を入力してください');
      return;
    }

    setIsCreating(true);

    try {
      // Django APIにデータを送信
      const projectData = {
        name: newProject.name,
        description: newProject.description,
        status: newProject.status,
        priority: newProject.priority,
        client_id: newProject.clientId,
        start_date: newProject.startDate,
        end_date: newProject.endDate,
        budget: newProject.budget ? parseFloat(newProject.budget) : undefined,
        tags: [],
      };

      console.log('送信するプロジェクトデータ:', projectData);
      const createdProject = await djangoAPI.createProject(projectData);
      console.log('作成されたプロジェクト:', createdProject);
      
      // 成功メッセージ
      toast.success('案件が正常に作成されました!');
      
      // ローカルの状態を更新
      const newProjectData: Project = {
        id: String(createdProject.id),
        name: createdProject.name,
        description: createdProject.description,
        status: createdProject.status,
        priority: createdProject.priority,
        clientId: String(createdProject.client.id),
        startDate: new Date(createdProject.start_date),
        endDate: new Date(createdProject.end_date),
        budget: createdProject.budget,
        progress: createdProject.progress,
        ownerId: createdProject.owner?.id ? String(createdProject.owner.id) : '',
        memberIds: createdProject.members?.map((m: any) => String(m.id)) || [],
        tags: createdProject.tags || [],
        createdAt: new Date(createdProject.created_at),
        updatedAt: new Date(createdProject.updated_at),
      };
      
      setProjects(prev => [newProjectData, ...prev]);
      
      setIsCreateDialogOpen(false);
      setNewProject({
        name: "",
        description: "",
        clientId: "",
        status: "planning",
        priority: "medium",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        budget: "",
      });

    } catch (error: any) {
      console.error('案件作成エラー:', error);
      console.error('エラーレスポンス:', error.response?.data);
      
      // エラーメッセージを構築
      let errorMessage = '案件作成中にエラーが発生しました';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'object') {
          // フィールドごとのエラーを表示
          const errors = Object.entries(data).map(([field, messages]) => {
            const msg = Array.isArray(messages) ? messages.join(', ') : messages;
            return `${field}: ${msg}`;
          }).join('\n');
          errorMessage = errors || errorMessage;
        } else {
          errorMessage = data.detail || data.message || String(data);
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }

  // フィルタリングされたデータ
  const filteredData = useMemo(() => {
    return projects.filter(project => {
      if (statusFilter !== "all" && project.status !== statusFilter) return false
      if (priorityFilter !== "all" && project.priority !== priorityFilter) return false
      return true
    })
  }, [projects, statusFilter, priorityFilter])

  // テーブルカラム定義
  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            案件名
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="space-y-1">
            <Link 
              to={`/dashboard/projects/${project.id}`}
              className="font-medium hover:underline"
            >
              {project.name}
            </Link>
            <div className="flex items-center gap-2">
              {project.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "clientId",
      header: "クライアント",
      cell: ({ row }) => {
        const client = clients.find(c => String(c.id) === row.original.clientId)
        return client?.companyName || "-"
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            ステータス
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const status = row.original.status
        const variant = 
          status === 'active' ? 'default' :
          status === 'completed' ? 'secondary' :
          status === 'on-hold' ? 'outline' :
          'destructive'
        
        return (
          <Badge variant={variant as any}>
            {getStatusLabel(status)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            優先度
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const priority = row.original.priority
        const color = 
          priority === 'urgent' ? 'text-red-500' :
          priority === 'high' ? 'text-orange-500' :
          priority === 'medium' ? 'text-yellow-500' :
          'text-gray-500'
        
        return (
          <span className={`font-medium ${color}`}>
            {getPriorityLabel(priority)}
          </span>
        )
      },
    },
    {
      accessorKey: "progress",
      header: "進捗",
      cell: ({ row }) => {
        const progress = row.original.progress
        return (
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )
      },
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            期限
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = row.original.endDate
        return date.toLocaleDateString('ja-JP')
      },
    },
    {
      accessorKey: "budget",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 text-right w-full"
          >
            予算
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const budget = row.original.budget
        return budget 
          ? `¥${budget.toLocaleString('ja-JP')}`
          : "-"
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <Link to={`/dashboard/projects/${row.original.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="w-full h-full overflow-auto bg-background">
      {/* Wide表示のコンテナ */}
      <div className="px-8 py-8 space-y-8">
        {/* Page Header - 現代的なヘッダーデザイン */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">案件一覧</h1>
            <p className="text-lg text-muted-foreground">
              全<span className="font-semibold text-foreground">{filteredData.length}</span>件の案件を管理
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-md hover:shadow-lg transition-shadow">
                <Plus className="mr-2 h-5 w-5" />
                新規案件
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>新規案件作成</DialogTitle>
              <DialogDescription>
                新しい案件の情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">案件名 *</Label>
                <Input
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  placeholder="案件名を入力"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="案件の説明を入力"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="client">クライアント *</Label>
                  <Select value={newProject.clientId} onValueChange={(value) => setNewProject({...newProject, clientId: value})}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">ステータス</Label>
                  <Select value={newProject.status} onValueChange={(value) => setNewProject({...newProject, status: value as ProjectStatus})}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">計画中</SelectItem>
                      <SelectItem value="active">進行中</SelectItem>
                      <SelectItem value="on-hold">保留</SelectItem>
                      <SelectItem value="completed">完了</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">優先度</Label>
                  <Select value={newProject.priority} onValueChange={(value) => setNewProject({...newProject, priority: value as ProjectPriority})}>
                    <SelectTrigger id="priority">
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
                  <Label htmlFor="budget">予算</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({...newProject, budget: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">開始日</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">期限 *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
                キャンセル
              </Button>
              <Button onClick={handleCreateProject} disabled={!newProject.name || isCreating}>
                {isCreating ? "作成中..." : "作成"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

        {/* Filters - 現代的なフィルターデザイン */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="案件名で検索..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-12 h-11 text-base border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProjectStatus | "all")}>
            <SelectTrigger className="w-[200px] h-11 border-border">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全てのステータス</SelectItem>
            <SelectItem value="planning">計画中</SelectItem>
            <SelectItem value="active">進行中</SelectItem>
            <SelectItem value="on-hold">保留</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
            <SelectItem value="cancelled">中止</SelectItem>
          </SelectContent>
        </Select>

          <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as ProjectPriority | "all")}>
            <SelectTrigger className="w-[200px] h-11 border-border">
              <SelectValue placeholder="優先度" />
            </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全ての優先度</SelectItem>
            <SelectItem value="low">低</SelectItem>
            <SelectItem value="medium">中</SelectItem>
            <SelectItem value="high">高</SelectItem>
            <SelectItem value="urgent">緊急</SelectItem>
          </SelectContent>
        </Select>
      </div>

        {/* Table - 現代的なテーブルデザイン */}
        <div className="border border-border rounded-xl shadow-sm overflow-hidden bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">読み込み中...</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      案件が見つかりませんでした
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination - 現代的なページネーションデザイン */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground font-medium">
            全<span className="text-foreground font-semibold">{table.getFilteredRowModel().rows.length}</span>件中{" "}
            <span className="text-foreground font-semibold">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>
            -
            <span className="text-foreground font-semibold">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>
            件を表示
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              前へ
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="hover:bg-accent"
            >
              次へ
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
