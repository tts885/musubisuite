import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { mockMembers } from "@/data/mockData"
import { useState, useMemo } from "react"

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMembers = useMemo(() => {
    return mockMembers.filter(member =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  return (
    <div className="w-full h-full px-8 py-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">メンバー</h1>
        <p className="text-muted-foreground mt-2">
          全{filteredMembers.length}名のメンバー
        </p>
      </div>

      {/* Search */}
      <div className="flex-1 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="メンバー検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Members Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map(member => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-16 h-16 rounded-full"
                />
                <div className="flex-1">
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription>{member.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground">役職</div>
                <div className="text-sm">{member.position}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">部署</div>
                <div className="text-sm">{member.department}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">スキル</div>
                <div className="flex flex-wrap gap-1">
                  {member.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Badge variant="outline">{member.role}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          メンバーが見つかりませんでした
        </div>
      )}
    </div>
  )
}
