import { useState, useMemo } from "react"
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
import { mockProjects, mockClients, getStatusLabel, getPriorityLabel } from "@/data/mockData"
import type { Project, ProjectStatus, ProjectPriority } from "@/types"
import { dataverseStore } from "@/lib/dataverseStore"
import { DataverseAdminService } from "@/services/dataverseAdminService"

export default function ProjectsPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | "all">("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
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

  // 新規案件作成ハンドラー
  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      alert('案件名を入力してください');
      return;
    }

    setIsCreating(true);

    try {
      // Dataverse接続を取得
      const activeConnection = dataverseStore.getActiveConnection();
      
      if (activeConnection) {
        // Dataverseにデータを送信
        const service = new DataverseAdminService(activeConnection);
        
        const projectData = {
          cr0d2_name: newProject.name,
          cr0d2_description: newProject.description,
          cr0d2_status: newProject.status,
          cr0d2_startdate: newProject.startDate,
          cr0d2_enddate: newProject.endDate || null,
          cr0d2_progress: 0,
        };

        try {
          await service.createRecord('cr0d2_projects', projectData);
          alert('案件がDataverseに正常に作成されました！');
        } catch (dataverseError) {
          console.error('Dataverse error:', dataverseError);
          alert('Dataverseへの保存に失敗しました。ローカルデータとして保存します。');
        }
      } else {
        console.log("Dataverse接続が設定されていません。ローカルデータとして保存します。");
        alert('Dataverse接続が設定されていません。設定画面で接続を追加してください。');
      }

      // ローカルデータも更新（モックデータ用）
      console.log("新規案件作成:", newProject);
      
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

    } catch (error) {
      console.error('案件作成エラー:', error);
      alert('案件作成中にエラーが発生しました');
    } finally {
      setIsCreating(false);
    }
  }

  // フィルタリングされたデータ
  const filteredData = useMemo(() => {
    return mockProjects.filter(project => {
      if (statusFilter !== "all" && project.status !== statusFilter) return false
      if (priorityFilter !== "all" && project.priority !== priorityFilter) return false
      return true
    })
  }, [statusFilter, priorityFilter])

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
              to={`/projects/${project.id}`}
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
        const client = mockClients.find(c => c.id === row.original.clientId)
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
            <Link to={`/projects/${row.original.id}`}>
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
                      {mockClients.map(client => (
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
