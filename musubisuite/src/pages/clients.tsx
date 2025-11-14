/**
 * クライアント一覧ページ
 * 
 * クライアントの一覧表示、検索、詳細情報を提供します。
 * カードレイアウトでクライアント情報を視覚的に表示します。
 * 
 * @module pages/clients
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Building2, Mail, Phone, MapPin } from "lucide-react"
import { mockClients, mockProjects } from "@/data/mockData"
import { useState, useMemo } from "react"

/**
 * クライアント一覧ページコンポーネント
 * 
 * クライアントの一覧をカード形式で表示します。
 * 以下の機能を含みます:
 * - クライアント一覧のカード表示
 * - キーワード検索(会社名、担当者名、メール)
 * - 連絡先情報表示
 * - 関連プロジェクト数表示
 * 
 * @component
 * @returns {JSX.Element} クライアント一覧ページ
 * 
 * @example
 * ```tsx
 * // router.tsx
 * { path: "clients", element: <ClientsPage /> }
 * ```
 * 
 * @remarks
 * - 現在はモックデータを使用(将来的にはDjango API連携予定)
 * - レスポンシブグリッドレイアウト
 * - useMemoによる検索パフォーマンス最適化
 */
export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredClients = useMemo(() => {
    return mockClients.filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  return (
    <div className="w-full h-full px-8 py-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">クライアント</h1>
        <p className="text-muted-foreground mt-2">
          全{filteredClients.length}社のクライアント
        </p>
      </div>

      {/* Search */}
      <div className="flex-1 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="クライアント検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredClients.map(client => {
          const clientProjects = mockProjects.filter(p => p.clientId === client.id)
          const activeProjects = clientProjects.filter(p => p.status === 'active')
          
          return (
            <Card key={client.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl">{client.companyName}</CardTitle>
                    <CardDescription>{client.name}</CardDescription>
                  </div>
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${client.email}`} className="hover:underline">
                      {client.email}
                    </a>
                  </div>
                  
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  
                  {client.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Industry */}
                {client.industry && (
                  <div>
                    <Badge variant="secondary">{client.industry}</Badge>
                  </div>
                )}

                {/* Projects */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">案件数</span>
                    <span className="font-medium">
                      {clientProjects.length}件 (進行中: {activeProjects.length}件)
                    </span>
                  </div>
                </div>

                {/* Note */}
                {client.note && (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">{client.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          クライアントが見つかりませんでした
        </div>
      )}
    </div>
  )
}
