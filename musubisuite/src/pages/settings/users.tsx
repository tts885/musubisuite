/**
 * ユーザー管理設定ページ
 * 
 * システムユーザーの一覧表示、作成、編集、削除、権限管理を提供します。
 * 
 * @module pages/settings/users
 */

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Users as UsersIcon } from "lucide-react"
import { toast } from "sonner"

/**
 * ユーザー管理設定ページコンポーネント
 * 
 * システムユーザーの管理機能を提供します:
 * - ユーザー一覧表示（検索・フィルタリング）
 * - 新規ユーザー作成
 * - ユーザー編集
 * - ユーザー削除
 * - 権限管理
 * 
 * @component
 * @returns {JSX.Element} ユーザー管理設定ページ
 * 
 * @remarks
 * - 将来的にDjango Members APIと連携予定
 * - 現在はモックデータで動作確認
 */
export default function UsersSettingsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  // 仮のユーザーデータ（後でAPIと連携）
  const mockUsers = [
    {
      id: "1",
      name: "山田太郎",
      email: "yamada@company.com",
      department: "開発部",
      position: "部長",
      role: "owner",
      status: "active"
    },
    {
      id: "2",
      name: "佐藤花子",
      email: "sato@company.com",
      department: "開発部",
      position: "課長",
      role: "admin",
      status: "active"
    },
    {
      id: "3",
      name: "鈴木一郎",
      email: "suzuki@company.com",
      department: "営業部",
      position: "主任",
      role: "member",
      status: "active"
    },
    {
      id: "4",
      name: "高橋美咲",
      email: "takahashi@company.com",
      department: "総務部",
      position: "一般",
      role: "viewer",
      status: "pending"
    }
  ]

  // フィルタリングされたユーザー一覧
  const filteredUsers = useMemo(() => {
    return mockUsers.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesDepartment = departmentFilter === "all" || user.department === departmentFilter
      
      return matchesSearch && matchesRole && matchesDepartment
    })
  }, [searchQuery, roleFilter, departmentFilter])

  // 統計情報を計算
  const stats = useMemo(() => {
    return {
      total: mockUsers.length,
      active: mockUsers.filter(u => u.status === "active").length,
      owner: mockUsers.filter(u => u.role === "owner").length,
      admin: mockUsers.filter(u => u.role === "admin").length,
      member: mockUsers.filter(u => u.role === "member").length,
      viewer: mockUsers.filter(u => u.role === "viewer").length
    }
  }, [])

  // 役割のラベルと色を取得
  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; className: string }> = {
      owner: { label: "オーナー", className: "bg-red-100 text-red-800" },
      admin: { label: "管理者", className: "bg-orange-100 text-orange-800" },
      member: { label: "メンバー", className: "bg-blue-100 text-blue-800" },
      viewer: { label: "閲覧者", className: "bg-gray-100 text-gray-800" }
    }
    return roleMap[role] || roleMap.viewer
  }

  // ステータスのバッジを取得
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: "アクティブ", className: "bg-green-100 text-green-800" },
      pending: { label: "保留中", className: "bg-yellow-100 text-yellow-800" },
      inactive: { label: "無効", className: "bg-gray-100 text-gray-800" }
    }
    return statusMap[status] || statusMap.inactive
  }

  // ユーザー作成ハンドラー
  const handleCreateUser = () => {
    // TODO: API連携実装
    toast.success("ユーザーを作成しました")
    setIsCreateDialogOpen(false)
  }

  // ユーザー削除ハンドラー
  const handleDeleteUser = (_userId: string) => {
    // TODO: API連携実装
    toast.success("ユーザーを削除しました")
  }

  return (
    <div className="p-8 space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">ユーザー管理</h1>
        <p className="text-muted-foreground mt-2">
          システムユーザーの作成、編集、削除、権限管理
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>総ユーザー数</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>アクティブ</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>管理者</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.admin}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>メンバー</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.member}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* ユーザー一覧セクション */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5" />
                ユーザー一覧
              </CardTitle>
              <CardDescription className="mt-2">
                全{filteredUsers.length}名のユーザー
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  新規ユーザー追加
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>新規ユーザー追加</DialogTitle>
                  <DialogDescription>
                    新しいシステムユーザーを作成します。メールアドレスに招待メールが送信されます。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">ユーザー名 *</Label>
                    <Input id="name" placeholder="例: 山田太郎" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス *</Label>
                    <Input id="email" type="email" placeholder="例: yamada@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">部署</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dev">開発部</SelectItem>
                        <SelectItem value="sales">営業部</SelectItem>
                        <SelectItem value="admin">総務部</SelectItem>
                        <SelectItem value="hr">人事部</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">役職</Label>
                    <Input id="position" placeholder="例: 部長" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="role">システム役割 *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">オーナー（全権限）</SelectItem>
                        <SelectItem value="admin">管理者（管理機能）</SelectItem>
                        <SelectItem value="member">メンバー（一般機能）</SelectItem>
                        <SelectItem value="viewer">閲覧者（読み取りのみ）</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="skills">スキル（カンマ区切り）</Label>
                    <Input id="skills" placeholder="例: Python, Django, React, TypeScript" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleCreateUser}>
                    作成
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* 検索とフィルター */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ユーザー名、メール、部署で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="役割フィルター" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての役割</SelectItem>
                <SelectItem value="owner">オーナー</SelectItem>
                <SelectItem value="admin">管理者</SelectItem>
                <SelectItem value="member">メンバー</SelectItem>
                <SelectItem value="viewer">閲覧者</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="部署フィルター" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての部署</SelectItem>
                <SelectItem value="開発部">開発部</SelectItem>
                <SelectItem value="営業部">営業部</SelectItem>
                <SelectItem value="総務部">総務部</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ユーザーテーブル */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ユーザー名</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>部署</TableHead>
                  <TableHead>役職</TableHead>
                  <TableHead>役割</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const roleBadge = getRoleBadge(user.role)
                  const statusBadge = getStatusBadge(user.status)
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>{user.position}</TableCell>
                      <TableCell>
                        <Badge className={roleBadge.className}>
                          {roleBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 権限マトリックスセクション */}
      <Card>
        <CardHeader>
          <CardTitle>役割別権限マトリックス</CardTitle>
          <CardDescription>
            各役割のシステム機能に対するアクセス権限
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>機能</TableHead>
                  <TableHead className="text-center">オーナー</TableHead>
                  <TableHead className="text-center">管理者</TableHead>
                  <TableHead className="text-center">メンバー</TableHead>
                  <TableHead className="text-center">閲覧者</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">プロジェクト作成</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">❌</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">プロジェクト編集</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">❌</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">プロジェクト削除</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">❌</TableCell>
                  <TableCell className="text-center">❌</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ユーザー管理</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">❌</TableCell>
                  <TableCell className="text-center">❌</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">クライアント管理</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">❌</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">システム設定</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">❌</TableCell>
                  <TableCell className="text-center">❌</TableCell>
                  <TableCell className="text-center">❌</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">データ閲覧</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                  <TableCell className="text-center">✅</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
