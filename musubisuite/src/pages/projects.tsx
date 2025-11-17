/**
 * プロジェクト一覧ページ
 * 
 * プロジェクトの一覧表示、検索、フィルタリング、新規作成機能を提供します。
 * TanStack Tableを使用した高機能なデータテーブルを実装しています。
 * 
 * @module pages/projects
 */

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
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Plus,
  Check,
  ChevronsUpDown,
  Edit
} from "lucide-react"
import { getStatusLabel, getPriorityLabel } from "@/data/mockData"
import type { Project, Client, ProjectStatus, ProjectPriority } from "@/types"
import { djangoAPI } from "@/services/djangoAPI"
import { toast } from "sonner"
import { CodeMasterSelect } from "@/components/shared/CodeMasterSelect"

/**
 * プロジェクト一覧ページコンポーネント
 * 
 * プロジェクトの一覧表示とCRUD操作を提供します。
 * 以下の機能を含みます:
 * - プロジェクト一覧のテーブル表示(ソート、ページネーション)
 * - ステータスと優先度によるフィルタリング
 * - キーワード検索
 * - 新規プロジェクト作成ダイアログ
 * - プロジェクト詳細へのナビゲーション
 * 
 * @component
 * @returns {JSX.Element} プロジェクト一覧ページ
 * 
 * @example
 * ```tsx
 * // router.tsx
 * { path: "projects", element: <ProjectsPage /> }
 * ```
 * 
 * @remarks
 * - Django REST API経由でプロジェクトとクライアントのデータを取得
 * - TanStack Tableによる高機能なテーブル表示
 * - Sonnerによるトースト通知
 * - レスポンシブデザイン対応
 */
export default function ProjectsPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | "all">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientId: "",
    status: "planning" as ProjectStatus,
    priority: "medium" as ProjectPriority,
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    budget: "",
  })

  // 新規作成ダイアログを開く
  const handleOpenCreateDialog = () => {
    setEditingProject(null)
    setFormData({
      name: "",
      description: "",
      clientId: "",
      status: "planning",
      priority: "medium",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      budget: "",
    })
    setIsDialogOpen(true)
  }

  // 編集ダイアログを開く
  const handleOpenEditDialog = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description,
      clientId: String(project.clientId),
      status: project.status,
      priority: project.priority,
      startDate: project.startDate instanceof Date ? project.startDate.toISOString().split('T')[0] : project.startDate,
      endDate: project.endDate instanceof Date ? project.endDate.toISOString().split('T')[0] : project.endDate,
      budget: project.budget ? String(project.budget) : "",
    })
    setIsDialogOpen(true)
  }

  // 初期データを取得
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // クライアント一覧を取得
        const clientsData = await djangoAPI.getClients();
        const clients = clientsData.results || clientsData;
        setClients(clients);

        // プロジェクト一覧を取得
        const projectsData = await djangoAPI.getProjects();
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
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('案件名を入力してください');
      return;
    }

    if (!formData.clientId) {
      toast.error('クライアントを選択してください');
      return;
    }

    if (!formData.endDate) {
      toast.error('期限を入力してください');
      return;
    }

    setIsCreating(true);

    try {
      // Django APIにデータを送信
      const projectData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        client_id: formData.clientId,
        start_date: formData.startDate,
        end_date: formData.endDate,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        tags: [],
      };
      
      if (editingProject) {
        // 編集モード
        const updatedProject = await djangoAPI.updateProject(editingProject.id, projectData);
        
        // 成功メッセージ
        toast.success('案件が正常に更新されました!');
        
        // ローカルの状態を更新
        const updatedProjectData: Project = {
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
        };
        
        setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProjectData : p));
      } else {
        // 新規作成モード
        const createdProject = await djangoAPI.createProject(projectData);
        
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
      }
      
      setIsDialogOpen(false);
      setEditingProject(null);
      setFormData({
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
        return client?.company_name || "-"
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
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(row.original)}>
              <Edit className="h-4 w-4" />
            </Button>
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
          <Button size="lg" className="shadow-md hover:shadow-lg transition-shadow" onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-5 w-5" />
            新規案件
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingProject ? '案件編集' : '新規案件作成'}</DialogTitle>
              <DialogDescription>
                {editingProject ? '案件の情報を編集してください' : '新しい案件の情報を入力してください'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">案件名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="案件名を入力"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="案件の説明を入力"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="client">クライアント *</Label>
                  <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientPopoverOpen}
                        className="w-full justify-between"
                      >
                        {formData.clientId
                          ? clients.find((client) => String(client.id) === formData.clientId)?.company_name || `クライアントID: ${formData.clientId} (見つかりません)`
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
                                  setFormData({...formData, clientId: String(client.id)})
                                  setClientPopoverOpen(false)
                                }}
                              >
                                <Check
                                  className={"mr-2 h-4 w-4 " + (formData.clientId === String(client.id) ? "opacity-100" : "opacity-0")}
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
                  <Label htmlFor="status">ステータス</Label>
                  <CodeMasterSelect
                    category="PROJECT_STATUS"
                    value={formData.status}
                    onChange={(value) => setFormData({...formData, status: value as ProjectStatus})}
                    placeholder="ステータスを選択"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">優先度</Label>
                  <CodeMasterSelect
                    category="PROJECT_PRIORITY"
                    value={formData.priority}
                    onChange={(value) => setFormData({...formData, priority: value as ProjectPriority})}
                    placeholder="優先度を選択"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="budget">予算</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
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
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">期限</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={!formData.name || isCreating}>
                {isCreating ? (
                  editingProject ? '更新中...' : '作成中...'
                ) : (
                  editingProject ? '更新' : '作成'
                )}
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
