/**
 * クライアント管理設定ページ
 * 
 * クライアント情報の一覧表示、作成、編集、削除を提供します。
 * Django APIと連携してCRUD操作を実行します。
 * 
 * @module pages/settings/clients
 */

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
import { Search, Plus, Edit, Trash2, Building2, Mail, Phone, Loader2, Brain, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { djangoAPI } from "@/services/djangoAPI"
import type { Client } from "@/types"
import { codeMasterService, type CodeMaster } from "@/services/codemaster"
import { DatePicker } from "@/components/ui/date-picker"

/**
 * クライアント管理設定ページコンポーネント
 * 
 * クライアント情報の管理機能を提供します:
 * - クライアント一覧表示(検索・フィルタリング)
 * - 新規クライアント作成
 * - クライアント編集
 * - クライアント削除
 * 
 * @component
 * @returns {JSX.Element} クライアント管理設定ページ
 * 
 * @remarks
 * Django Clients APIと連携してデータを管理します
 */
export default function ClientsSettingsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [industryFilter, setIndustryFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  
  // AI機能の状態管理
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPreviewData, setAiPreviewData] = useState<any>(null)
  const [isAiPreviewOpen, setIsAiPreviewOpen] = useState(false)
  const [companyNameForAI, setCompanyNameForAI] = useState("")
  
  // フォームの状態管理
  const [formData, setFormData] = useState<Partial<Client>>({})
  
  // 業種マスタデータの状態管理
  const [industries, setIndustries] = useState<CodeMaster[]>([])
  
  // 初期データ取得
  useEffect(() => {
    fetchClients()
    fetchIndustries()
  }, [])
  
  // 業種マスタデータ取得
  const fetchIndustries = async () => {
    try {
      const data = await codeMasterService.getCodesByCategory('INDUSTRY')
      console.log("業種マスタデータ:", data)
      setIndustries(data.filter(item => item.is_active))
    } catch (error) {
      console.error("業種マスタ取得エラー:", error)
      // エラーが発生してもフォールバックとして空配列を設定
      setIndustries([])
    }
  }
  
  // クライアント一覧取得
  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await djangoAPI.getClients()
      setClients(response.results || [])
    } catch (error) {
      console.error("クライアント取得エラー:", error)
      toast.error("クライアント情報の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  // フィルタリングされたクライアント一覧
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = 
        client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.contact_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesIndustry = industryFilter === "all" || client.industry === industryFilter
      
      return matchesSearch && matchesIndustry
    })
  }, [clients, searchQuery, industryFilter])

  // 統計情報を計算
  const stats = useMemo(() => {
    return {
      total: clients.length,
      it: clients.filter(c => c.industry === "it").length,
      finance: clients.filter(c => c.industry === "finance").length,
      retail: clients.filter(c => c.industry === "retail").length
    }
  }, [clients])

  // 業種のラベルを取得（コードマスタから動的に取得）
  const getIndustryLabel = (industryCode: string) => {
    const industry = industries.find(item => item.code === industryCode)
    return industry ? industry.name : industryCode
  }

  // フォームリセット
  const resetForm = () => {
    setFormData({})
    setSelectedClient(null)
  }
  
  // 編集ダイアログを開く
  const handleEditClick = async (client: Client) => {
    try {
      // 完全な詳細データを取得
      const fullClientData = await djangoAPI.getClient(String(client.id))
      setSelectedClient(fullClientData)
      // 資本金を円から万円に変換（表示用）
      const formDataWithManYen = {
        ...fullClientData,
        capital: fullClientData.capital ? Math.round(fullClientData.capital / 10000) : undefined
      }
      setFormData(formDataWithManYen)
      setIsEditDialogOpen(true)
    } catch (error) {
      console.error("クライアント詳細取得エラー:", error)
      toast.error("クライアント詳細の取得に失敗しました")
    }
  }
  
  // クライアント作成ハンドラー
  const handleCreateClient = async () => {
    try {
      if (!formData.company_name) {
        toast.error("会社名を入力してください")
        return
      }
      
      // 資本金を万円から円に変換（DB保存用）
      const clientData = {
        ...formData,
        company_name: formData.company_name,
        email: formData.email,
        capital: formData.capital ? formData.capital * 10000 : undefined
      }
      await djangoAPI.createClient(clientData)
      toast.success("クライアントを作成しました")
      setIsCreateDialogOpen(false)
      resetForm()
      fetchClients()
    } catch (error) {
      console.error("クライアント作成エラー:", error)
      toast.error("クライアントの作成に失敗しました")
    }
  }
  
  // クライアント更新ハンドラー
  const handleUpdateClient = async () => {
    try {
      if (!selectedClient) return
      
      if (!formData.company_name) {
        toast.error("会社名を入力してください")
        return
      }
      
      // 資本金を万円から円に変換（DB保存用）
      const updateData = {
        ...formData,
        capital: formData.capital ? formData.capital * 10000 : undefined
      }
      await djangoAPI.updateClient(String(selectedClient.id), updateData)
      toast.success("クライアント情報を更新しました")
      setIsEditDialogOpen(false)
      resetForm()
      fetchClients()
    } catch (error) {
      console.error("クライアント更新エラー:", error)
      toast.error("クライアント情報の更新に失敗しました")
    }
  }

  // クライアント削除ハンドラー
  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("このクライアントを削除してもよろしいですか?")) {
      return
    }
    
    try {
      await djangoAPI.deleteClient(clientId)
      toast.success("クライアントを削除しました")
      fetchClients()
    } catch (error) {
      console.error("クライアント削除エラー:", error)
      toast.error("クライアントの削除に失敗しました")
    }
  }

  // AI機能: 企業情報取得
  const handleAIFetch = async () => {
    if (!companyNameForAI.trim()) {
      toast.error("会社名を入力してください")
      return
    }

    setAiLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/clients/ai-fetch/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyNameForAI }),
      })

      if (!response.ok) {
        throw new Error('AI情報取得に失敗しました')
      }

      const data = await response.json()
      
      // プレビューダイアログを開く
      setAiPreviewData(data)
      setIsAiPreviewOpen(true)
      
      toast.success(`AI情報取得完了 (信頼度: ${data.ai_confidence_score}%)`)
    } catch (error) {
      console.error('AI取得エラー:', error)
      toast.error('AI情報の取得に失敗しました')
    } finally {
      setAiLoading(false)
    }
  }

  // AI機能: 既存情報の更新
  const handleAIRefresh = async (clientId: number) => {
    setAiLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/clients/${clientId}/ai-refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('AI情報更新に失敗しました')
      }

      const data = await response.json()
      
      if (data.changes && data.changes.length > 0) {
        // 変更がある場合はプレビューを表示
        setAiPreviewData(data)
        setIsAiPreviewOpen(true)
        toast.success(`${data.changes.length}件の変更が検出されました`)
      } else {
        toast.info('変更はありませんでした')
      }
    } catch (error) {
      console.error('AI更新エラー:', error)
      toast.error('AI情報の更新に失敗しました')
    } finally {
      setAiLoading(false)
    }
  }

  // AIから取得した業種テキストをシステムの業種コードにマッピング
  const mapIndustryToCode = (industryText: string): string => {
    if (!industryText) return ''
    
    const text = industryText.toLowerCase()
    
    // キーワードマッピング
    if (text.includes('it') || text.includes('情報') || text.includes('通信') || text.includes('ソフトウェア') || text.includes('システム')) return 'it'
    if (text.includes('製造') || text.includes('メーカー') || text.includes('工業')) return 'manufacturing'
    if (text.includes('金融') || text.includes('銀行') || text.includes('証券') || text.includes('保険')) return 'finance'
    if (text.includes('小売') || text.includes('販売') || text.includes('流通')) return 'retail'
    if (text.includes('サービス') || text.includes('コンサル')) return 'service'
    if (text.includes('建設') || text.includes('建築') || text.includes('土木')) return 'construction'
    if (text.includes('不動産')) return 'real_estate'
    if (text.includes('運輸') || text.includes('物流') || text.includes('輸送')) return 'transportation'
    if (text.includes('教育') || text.includes('学校') || text.includes('研修')) return 'education'
    if (text.includes('医療') || text.includes('福祉') || text.includes('介護') || text.includes('病院')) return 'healthcare'
    if (text.includes('メディア') || text.includes('放送') || text.includes('出版') || text.includes('広告')) return 'media'
    
    return 'other'
  }

  // AIプレビューデータを適用
  const handleApplyAIData = () => {
    if (!aiPreviewData) return

    // 新規作成の場合
    if (!selectedClient) {
      // aiPreviewDataから直接データを取得（dataプロパティではなくルートレベル）
      const aiData = { ...aiPreviewData }
      
      // メタデータを除外
      const metaFields = ['ai_generated', 'ai_generated_at', 'ai_confidence_score', 'ai_provider', '_search_urls']
      metaFields.forEach(field => delete aiData[field])
      
      // AIから取得した業種テキストをシステムのコードにマッピング
      if (aiData.industry) {
        aiData.industry = mapIndustryToCode(aiData.industry)
      }
      
      // 資本金を円から万円に変換
      if (aiData.capital) {
        aiData.capital = Math.round(aiData.capital / 10000)
      }
      
      // 既存のフォームデータを保持しつつAIデータを適用
      setFormData(prev => ({ 
        ...prev, 
        ...aiData,
        // emailが空の場合は既存のemailを保持
        email: aiData.email || prev.email
      }))
      setIsAiPreviewOpen(false)
      toast.success('AI情報をフォームに適用しました')
    }
    // 更新の場合
    else if (selectedClient && aiPreviewData.changes) {
      const updatedData = { ...formData };
      aiPreviewData.changes.forEach((change: any) => {
        let value = change.new_value;
        // 資本金の場合、円から万円に変換
        if (change.field === 'capital' && value) {
          value = Math.round(value / 10000);
        }
        (updatedData as any)[change.field] = value;
      });
      setFormData(updatedData);
      setIsAiPreviewOpen(false)
      toast.success('AI情報をフォームに適用しました')
    }
  }
  
  // ローディング表示
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">クライアント管理</h1>
        <p className="text-muted-foreground mt-2">
          クライアント情報の作成、編集、削除
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>総クライアント数</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>IT・通信</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.it}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>金融</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.finance}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* クライアント一覧セクション */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                クライアント一覧
              </CardTitle>
              <CardDescription className="mt-2">
                全{filteredClients.length}社のクライアント
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open)
              // ダイアログを開く時にフォームをリセット（新規作成なので常に空欄）
              if (open) {
                resetForm()
              }
              // ダイアログを閉じる時にもフォームをリセット
              if (!open) {
                resetForm()
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  新規クライアント追加
                </Button>
              </DialogTrigger>
              <DialogContent className="!max-w-[90vw] w-full sm:!max-w-[1296px] max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>新規クライアント追加</DialogTitle>
                  <DialogDescription>
                    新しいクライアント情報を登録します。AIで取得した情報を元に、詳細項目も入力できます。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-4 gap-4 py-4 max-h-[70vh] overflow-y-auto px-6">
                  {/* --- 基本情報 --- */}
                  <div className="col-span-4 font-bold text-lg border-b pb-2 mb-2">基本情報</div>
                  <div className="space-y-2 col-span-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="companyName">会社名 *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={aiLoading || !companyNameForAI.trim()}
                        onClick={handleAIFetch}
                        className="gap-2"
                      >
                        {aiLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Brain className="w-4 h-4" />
                        )}
                        AIで企業情報を取得
                      </Button>
                    </div>
                    <Input 
                      id="companyName" 
                      placeholder="例: 株式会社サンプル"
                      value={formData.company_name || ''}
                      onChange={(e) => {
                        const newValue = e.target.value
                        setFormData(prev => ({...prev, company_name: newValue}))
                        setCompanyNameForAI(newValue)
                      }}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="legal_name">正式名称</Label>
                    <Input id="legal_name" value={formData.legal_name || ''} onChange={(e) => setFormData({...formData, legal_name: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="email">代表メールアドレス</Label>
                    <Input id="email" type="email" value={formData.email || ''} onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))} />
                  </div>

                  {/* --- 企業詳細 --- */}
                  <div className="col-span-4 font-bold text-lg border-b pb-2 mb-2 mt-4">企業詳細</div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="representative">代表者名</Label>
                    <Input id="representative" value={formData.representative || ''} onChange={(e) => setFormData({...formData, representative: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="established_date">設立年月日</Label>
                    <DatePicker 
                      id="established_date"
                      value={formData.established_date || ''}
                      onChange={(date) => setFormData({...formData, established_date: date})}
                      placeholder="設立年月日を選択"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="capital">資本金（万円）</Label>
                    <div className="relative">
                      <Input 
                        id="capital" 
                        type="text" 
                        value={formData.capital ? formData.capital.toLocaleString('ja-JP') : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          setFormData({...formData, capital: value ? Number(value) : 0})
                        }}
                        placeholder="0"
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">万円</span>
                    </div>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="employee_count">従業員数</Label>
                    <Input id="employee_count" type="number" value={formData.employee_count || ''} onChange={(e) => setFormData({...formData, employee_count: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="industry">業種</Label>
                    <Select value={formData.industry || ''} onValueChange={(value) => setFormData(prev => ({...prev, industry: value}))} disabled={industries.length === 0}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={industries.length === 0 ? "業種マスタデータがありません" : "選択してください"} /></SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry.code} value={industry.code}>
                            {industry.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="website">ウェブサイト</Label>
                    <Input id="website" type="url" value={formData.website || ''} onChange={(e) => setFormData({...formData, website: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-4">
                    <Label htmlFor="description">事業内容</Label>
                    <Textarea id="description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>

                  {/* --- 所在地情報 --- */}
                  <div className="col-span-4 font-bold text-lg border-b pb-2 mb-2 mt-4">所在地情報</div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="postal_code">郵便番号</Label>
                    <Input id="postal_code" value={formData.postal_code || ''} onChange={(e) => setFormData({...formData, postal_code: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="prefecture">都道府県</Label>
                    <Input id="prefecture" value={formData.prefecture || ''} onChange={(e) => setFormData({...formData, prefecture: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-4">
                    <Label htmlFor="city">市区町村</Label>
                    <Input id="city" value={formData.city || ''} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-4">
                    <Label htmlFor="address">番地・ビル名</Label>
                    <Input id="address" value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="phone">代表電話番号</Label>
                    <Input id="phone" type="tel" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="fax">FAX番号</Label>
                    <Input id="fax" type="tel" value={formData.fax || ''} onChange={(e) => setFormData({...formData, fax: e.target.value})} />
                  </div>

                  {/* --- 担当者情報 --- */}
                  <div className="col-span-4 font-bold text-lg border-b pb-2 mb-2 mt-4">担当者情報</div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="contact_name">担当者名</Label>
                    <Input id="contact_name" value={formData.contact_name || ''} onChange={(e) => setFormData({...formData, contact_name: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="contact_email">担当者メールアドレス</Label>
                    <Input id="contact_email" type="email" value={formData.contact_email || ''} onChange={(e) => setFormData({...formData, contact_email: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="contact_department">部署</Label>
                    <Input id="contact_department" value={formData.contact_department || ''} onChange={(e) => setFormData({...formData, contact_department: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="contact_position">役職</Label>
                    <Input id="contact_position" value={formData.contact_position || ''} onChange={(e) => setFormData({...formData, contact_position: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="contact_phone">担当者電話番号</Label>
                    <Input id="contact_phone" type="tel" value={formData.contact_phone || ''} onChange={(e) => setFormData({...formData, contact_phone: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="contact_mobile">担当者携帯電話</Label>
                    <Input id="contact_mobile" type="tel" value={formData.contact_mobile || ''} onChange={(e) => setFormData({...formData, contact_mobile: e.target.value})} />
                  </div>

                  {/* --- ビジネス情報 --- */}
                  <div className="col-span-4 font-bold text-lg border-b pb-2 mb-2 mt-4">ビジネス情報</div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="priority">優先度</Label>
                    <Select value={formData.priority || ''} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="lead_source">リード元</Label>
                    <Input id="lead_source" value={formData.lead_source || ''} onChange={(e) => setFormData({...formData, lead_source: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-4">
                    <Label htmlFor="note">備考</Label>
                    <Textarea id="note" value={formData.note || ''} onChange={(e) => setFormData({...formData, note: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleCreateClient}>
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
                placeholder="会社名、担当者名、メールで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="業種フィルター" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての業種</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry.code} value={industry.code}>
                    {industry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* クライアントテーブル */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>会社名</TableHead>
                  <TableHead>担当者名</TableHead>
                  <TableHead>連絡先</TableHead>
                  <TableHead>業種</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      クライアントが見つかりませんでした
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        #{client.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {client.company_name}
                        </div>
                      </TableCell>
                      <TableCell>{client.contact_name || '-'}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.industry && (
                          <Badge variant="outline">
                            {getIndustryLabel(client.industry)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(client)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteClient(String(client.id))}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="!max-w-[90vw] w-full sm:!max-w-[1296px] max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>クライアント編集</DialogTitle>
                <DialogDescription>
                  クライアント情報を編集します。
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={aiLoading || !selectedClient}
                onClick={() => selectedClient && handleAIRefresh(selectedClient.id)}
                className="gap-2"
              >
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                最新情報に更新
              </Button>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4 max-h-[60vh] overflow-y-auto px-6">
            {/* --- 基本情報 --- */}
            <div className="col-span-4 font-bold text-lg border-b pb-2 mb-2">基本情報</div>
            <div className="space-y-2 col-span-4">
              <Label htmlFor="editCompanyName">会社名 *</Label>
              <Input 
                id="editCompanyName" 
                placeholder="例: 株式会社サンプル"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_legal_name">正式名称</Label>
              <Input id="edit_legal_name" value={formData.legal_name || ''} onChange={(e) => setFormData({...formData, legal_name: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_email">代表メールアドレス</Label>
              <Input id="edit_email" type="email" value={formData.email || ''} onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))} />
            </div>

            {/* --- 企業詳細 --- */}
            <div className="col-span-4 font-bold text-lg border-b pb-2 mb-2 mt-4">企業詳細</div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_representative">代表者名</Label>
              <Input id="edit_representative" value={formData.representative || ''} onChange={(e) => setFormData({...formData, representative: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_established_date">設立年月日</Label>
              <DatePicker 
                id="edit_established_date"
                value={formData.established_date || ''}
                onChange={(date) => setFormData({...formData, established_date: date})}
                placeholder="設立年月日を選択"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_capital">資本金（万円）</Label>
              <div className="relative">
                <Input 
                  id="edit_capital" 
                  type="text" 
                  value={formData.capital ? formData.capital.toLocaleString('ja-JP') : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setFormData({...formData, capital: value ? Number(value) : 0})
                  }}
                  placeholder="0"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">万円</span>
              </div>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_employee_count">従業員数</Label>
              <Input id="edit_employee_count" type="number" value={formData.employee_count || ''} onChange={(e) => setFormData({...formData, employee_count: Number(e.target.value)})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_industry">業種</Label>
              <Select value={formData.industry || ''} onValueChange={(value) => setFormData(prev => ({...prev, industry: value}))} disabled={industries.length === 0}>
                <SelectTrigger className="w-full"><SelectValue placeholder={industries.length === 0 ? "業種マスタデータがありません" : "選択してください"} /></SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry.code} value={industry.code}>
                      {industry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_website">ウェブサイト</Label>
              <Input id="edit_website" type="url" value={formData.website || ''} onChange={(e) => setFormData({...formData, website: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-4">
              <Label htmlFor="edit_description">事業内容</Label>
              <Textarea id="edit_description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>

            {/* --- 所在地情報 --- */}
            <div className="col-span-4 font-bold text-lg border-b pb-2 mb-2 mt-4">所在地情報</div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_postal_code">郵便番号</Label>
              <Input id="edit_postal_code" value={formData.postal_code || ''} onChange={(e) => setFormData({...formData, postal_code: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_prefecture">都道府県</Label>
              <Input id="edit_prefecture" value={formData.prefecture || ''} onChange={(e) => setFormData({...formData, prefecture: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-4">
              <Label htmlFor="edit_city">市区町村</Label>
              <Input id="edit_city" value={formData.city || ''} onChange={(e) => setFormData({...formData, city: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-4">
              <Label htmlFor="edit_address">番地・ビル名</Label>
              <Input id="edit_address" value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_phone">代表電話番号</Label>
              <Input id="edit_phone" type="tel" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_fax">FAX番号</Label>
              <Input id="edit_fax" type="tel" value={formData.fax || ''} onChange={(e) => setFormData({...formData, fax: e.target.value})} />
            </div>

            {/* --- 担当者情報 --- */}
            <div className="col-span-4 font-bold text-lg border-b pb-2 mb-2 mt-4">担当者情報</div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_contact_name">担当者名</Label>
              <Input id="edit_contact_name" value={formData.contact_name || ''} onChange={(e) => setFormData({...formData, contact_name: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_contact_email">担当者メールアドレス</Label>
              <Input id="edit_contact_email" type="email" value={formData.contact_email || ''} onChange={(e) => setFormData({...formData, contact_email: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_contact_department">部署</Label>
              <Input id="edit_contact_department" value={formData.contact_department || ''} onChange={(e) => setFormData({...formData, contact_department: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_contact_position">役職</Label>
              <Input id="edit_contact_position" value={formData.contact_position || ''} onChange={(e) => setFormData({...formData, contact_position: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_contact_phone">担当者電話番号</Label>
              <Input id="edit_contact_phone" type="tel" value={formData.contact_phone || ''} onChange={(e) => setFormData({...formData, contact_phone: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_contact_mobile">担当者携帯電話</Label>
              <Input id="edit_contact_mobile" type="tel" value={formData.contact_mobile || ''} onChange={(e) => setFormData({...formData, contact_mobile: e.target.value})} />
            </div>

            {/* --- ビジネス情報 --- */}
            <div className="col-span-4 font-bold text-lg border-b pb-2 mb-2 mt-4">ビジネス情報</div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_priority">優先度</Label>
              <Select value={formData.priority || ''} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_lead_source">リード元</Label>
              <Input id="edit_lead_source" value={formData.lead_source || ''} onChange={(e) => setFormData({...formData, lead_source: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-4">
              <Label htmlFor="edit_note">備考</Label>
              <Textarea id="edit_note" value={formData.note || ''} onChange={(e) => setFormData({...formData, note: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateClient}>
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AIプレビューダイアログ */}
      <Dialog open={isAiPreviewOpen} onOpenChange={setIsAiPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI取得データのプレビュー
            </DialogTitle>
            <DialogDescription>
              AIが取得した企業情報を確認してください。適用する場合は「適用」ボタンをクリックしてください。
            </DialogDescription>
          </DialogHeader>
          
          {aiPreviewData && (
            <div className="space-y-4 py-4">
              {/* 信頼度スコア */}
              {aiPreviewData.ai_confidence_score !== undefined && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">信頼度スコア</span>
                    <span className="text-2xl font-bold">
                      {aiPreviewData.ai_confidence_score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        aiPreviewData.ai_confidence_score >= 70 
                          ? 'bg-green-500' 
                          : aiPreviewData.ai_confidence_score >= 50 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${aiPreviewData.ai_confidence_score}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 変更内容（更新の場合） */}
              {aiPreviewData.changes && aiPreviewData.changes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">変更内容</h3>
                  {aiPreviewData.changes.map((change: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg bg-blue-50">
                      <div className="font-medium text-sm mb-1">{change.field}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">旧:</span> {change.old_value || '(空)'}
                        </div>
                        <div>
                          <span className="text-blue-600">新:</span> {change.new_value || '(空)'}
                        </div>
                      </div>
                      {change.confidence && (
                        <div className="mt-1 text-xs text-gray-500">
                          信頼度: {change.confidence}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 取得データ（新規の場合） */}
              {!aiPreviewData.changes && (
                <div className="space-y-4">
                  <h3 className="font-semibold">取得データ</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(aiPreviewData)
                      .filter(([key]) => 
                        !key.startsWith('_') && 
                        !key.startsWith('ai_') &&
                        key !== 'id'
                      )
                      .map(([key, value]) => {
                        const fieldLabels: Record<string, string> = {
                          company_name: '会社名',
                          legal_name: '正式名称',
                          representative: '代表者名',
                          established_date: '設立年月日',
                          capital: '資本金',
                          employee_count: '従業員数',
                          industry: '業種',
                          website: 'ウェブサイト',
                          description: '事業内容',
                          postal_code: '郵便番号',
                          prefecture: '都道府県',
                          city: '市区町村',
                          address: '番地・ビル名',
                          phone: '代表電話番号',
                          fax: 'FAX番号',
                          email: 'メールアドレス',
                        }
                        const label = fieldLabels[key] || key
                        
                        return (
                          <div key={key} className="space-y-1">
                            <Label className="text-sm font-medium text-gray-700">{label}</Label>
                            <div className="p-2 border rounded bg-gray-50 text-sm min-h-[36px] flex items-center">
                              {value ? String(value) : <span className="text-gray-400">(未設定)</span>}
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              )}

              {/* AIプロバイダー情報 */}
              {aiPreviewData.ai_provider && (
                <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                  <span className="font-medium">使用プロバイダー: </span>
                  {aiPreviewData.ai_provider}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiPreviewOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleApplyAIData}>
              適用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
