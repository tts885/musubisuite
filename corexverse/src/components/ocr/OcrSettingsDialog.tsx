/**
 * OCR設定ダイアログ
 * 
 * サイドバーフッターから開くOCR設定画面
 * - OCRエンジンの選択と設定
 * - メニューごとのAIプロンプト設定
 */

import { useState, useEffect } from 'react'
import { Settings, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { useMenuSections } from '@/hooks/useOcrDataverse'
import type { 
  OcrSettings, 
  OcrEngineType, 
  AiModelType, 
  MenuPromptConfig 
} from '@/types'

export default function OcrSettingsDialog() {
  const [open, setOpen] = useState(false)
  const { sections: menuSections } = useMenuSections()
  
  // OCRエンジン設定
  const [engineType, setEngineType] = useState<OcrEngineType>('azure-document-intelligence')
  const [azureEndpoint, setAzureEndpoint] = useState('')
  const [azureApiKey, setAzureApiKey] = useState('')
  const [azureModelId, setAzureModelId] = useState('prebuilt-invoice')
  const [aiBuilderEnvId, setAiBuilderEnvId] = useState('')
  const [aiBuilderModelId, setAiBuilderModelId] = useState('')
  
  // メニュープロンプト設定
  const [selectedMenuId, setSelectedMenuId] = useState<string>('')
  const [menuPrompts, setMenuPrompts] = useState<Record<string, MenuPromptConfig>>({})
  
  // 設定を読み込む
  useEffect(() => {
    if (open) {
      loadSettings()
    }
  }, [open])
  
  // デフォルトのメニュープロンプトを初期化
  useEffect(() => {
    if (menuSections.length > 0 && Object.keys(menuPrompts).length === 0) {
      const defaultPrompts: Record<string, MenuPromptConfig> = {}
      menuSections.forEach(section => {
        defaultPrompts[section.id] = {
          menuSectionId: section.id,
          menuSectionName: section.name,
          aiModel: 'gpt-4o',
          systemPrompt: 'あなたは優秀なOCR結果アナリストです。',
          userPromptTemplate: 'OCR結果を分析して、構造化されたデータを抽出してください。',
          temperature: 0.7,
          maxTokens: 2000,
          enabled: true,
        }
      })
      setMenuPrompts(defaultPrompts)
      if (!selectedMenuId && menuSections.length > 0) {
        setSelectedMenuId(menuSections[0].id)
      }
    }
  }, [menuSections])
  
  const loadSettings = () => {
    // LocalStorageまたはDataverseから設定を読み込む
    const savedSettings = localStorage.getItem('ocr-settings')
    if (savedSettings) {
      const settings: OcrSettings = JSON.parse(savedSettings)
      
      // OCRエンジン設定
      setEngineType(settings.ocrEngine.engineType)
      if (settings.ocrEngine.azureDocumentIntelligence) {
        setAzureEndpoint(settings.ocrEngine.azureDocumentIntelligence.endpoint || '')
        setAzureApiKey(settings.ocrEngine.azureDocumentIntelligence.apiKey || '')
        setAzureModelId(settings.ocrEngine.azureDocumentIntelligence.modelId || 'prebuilt-invoice')
      }
      if (settings.ocrEngine.aiBuilder) {
        setAiBuilderEnvId(settings.ocrEngine.aiBuilder.environmentId || '')
        setAiBuilderModelId(settings.ocrEngine.aiBuilder.modelId || '')
      }
      
      // メニュープロンプト設定
      const promptsMap: Record<string, MenuPromptConfig> = {}
      settings.menuPrompts.forEach(prompt => {
        promptsMap[prompt.menuSectionId] = prompt
      })
      setMenuPrompts(promptsMap)
    }
  }
  
  const saveSettings = () => {
    const settings: OcrSettings = {
      ocrEngine: {
        engineType,
        azureDocumentIntelligence: engineType === 'azure-document-intelligence' ? {
          endpoint: azureEndpoint,
          apiKey: azureApiKey,
          modelId: azureModelId,
        } : undefined,
        aiBuilder: engineType === 'ai-builder' ? {
          environmentId: aiBuilderEnvId,
          modelId: aiBuilderModelId,
        } : undefined,
      },
      menuPrompts: Object.values(menuPrompts),
      updatedAt: new Date(),
    }
    
    // LocalStorageに保存
    localStorage.setItem('ocr-settings', JSON.stringify(settings))
    
    // TODO: Dataverseに保存する実装を追加
    
    setOpen(false)
  }
  
  const updateMenuPrompt = (field: keyof MenuPromptConfig, value: any) => {
    if (!selectedMenuId) return
    
    setMenuPrompts(prev => ({
      ...prev,
      [selectedMenuId]: {
        ...prev[selectedMenuId],
        [field]: value,
      }
    }))
  }
  
  const currentPrompt = selectedMenuId ? menuPrompts[selectedMenuId] : null
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 hover:bg-accent/50 rounded px-2 py-1 transition-colors w-full">
          <Settings className="w-4 h-4" />
          <span className="flex-1 text-left text-xs">OCR設定</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>OCR設定</DialogTitle>
          <DialogDescription>
            OCRエンジンとAIプロンプトの設定を管理します
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="ocr-engine" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ocr-engine">OCRエンジン設定</TabsTrigger>
            <TabsTrigger value="ai-prompts">AIプロンプト設定</TabsTrigger>
          </TabsList>
          
          {/* OCRエンジン設定タブ */}
          <TabsContent value="ocr-engine" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="engine-type">OCRエンジン</Label>
                <Select value={engineType} onValueChange={(value) => setEngineType(value as OcrEngineType)}>
                  <SelectTrigger id="engine-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="azure-document-intelligence">
                      Azure AI Document Intelligence
                    </SelectItem>
                    <SelectItem value="ai-builder">
                      AI Builder
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Azure Document Intelligence 設定 */}
              {engineType === 'azure-document-intelligence' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h3 className="font-medium text-sm">Azure Document Intelligence 設定</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="azure-endpoint">エンドポイント</Label>
                    <Input
                      id="azure-endpoint"
                      value={azureEndpoint}
                      onChange={(e) => setAzureEndpoint(e.target.value)}
                      placeholder="https://your-resource.cognitiveservices.azure.com/"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="azure-api-key">APIキー</Label>
                    <Input
                      id="azure-api-key"
                      type="password"
                      value={azureApiKey}
                      onChange={(e) => setAzureApiKey(e.target.value)}
                      placeholder="••••••••••••••••"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="azure-model">モデルID</Label>
                    <Select value={azureModelId} onValueChange={setAzureModelId}>
                      <SelectTrigger id="azure-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prebuilt-invoice">請求書（Prebuilt Invoice）</SelectItem>
                        <SelectItem value="prebuilt-receipt">領収書（Prebuilt Receipt）</SelectItem>
                        <SelectItem value="prebuilt-idDocument">身分証明書（Prebuilt ID Document）</SelectItem>
                        <SelectItem value="prebuilt-businessCard">名刺（Prebuilt Business Card）</SelectItem>
                        <SelectItem value="prebuilt-layout">レイアウト分析（Prebuilt Layout）</SelectItem>
                        <SelectItem value="prebuilt-read">テキスト読み取り（Prebuilt Read）</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {/* AI Builder 設定 */}
              {engineType === 'ai-builder' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h3 className="font-medium text-sm">AI Builder 設定</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="aibuilder-env">環境ID</Label>
                    <Input
                      id="aibuilder-env"
                      value={aiBuilderEnvId}
                      onChange={(e) => setAiBuilderEnvId(e.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="aibuilder-model">モデルID</Label>
                    <Input
                      id="aibuilder-model"
                      value={aiBuilderModelId}
                      onChange={(e) => setAiBuilderModelId(e.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* AIプロンプト設定タブ */}
          <TabsContent value="ai-prompts" className="space-y-4">
            <div className="grid grid-cols-12 gap-4">
              {/* メニュー選択サイドバー */}
              <div className="col-span-4 space-y-1 border-r pr-4">
                <Label className="text-sm font-medium mb-2 block">メニュー選択</Label>
                {menuSections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedMenuId(section.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded text-sm transition-colors
                      ${selectedMenuId === section.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent'
                      }
                    `}
                  >
                    {section.name}
                  </button>
                ))}
              </div>
              
              {/* プロンプト設定フォーム */}
              <div className="col-span-8 space-y-4">
                {currentPrompt ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        {menuSections.find(s => s.id === selectedMenuId)?.name} の設定
                      </h3>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="prompt-enabled" className="text-sm">有効</Label>
                        <Switch
                          id="prompt-enabled"
                          checked={currentPrompt.enabled}
                          onCheckedChange={(checked) => updateMenuPrompt('enabled', checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ai-model">AIモデル</Label>
                      <Select 
                        value={currentPrompt.aiModel} 
                        onValueChange={(value) => updateMenuPrompt('aiModel', value as AiModelType)}
                      >
                        <SelectTrigger id="ai-model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o">GPT-4o（最新・高性能）</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o mini（軽量・高速）</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo（低コスト）</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="system-prompt">システムプロンプト</Label>
                      <Textarea
                        id="system-prompt"
                        value={currentPrompt.systemPrompt}
                        onChange={(e) => updateMenuPrompt('systemPrompt', e.target.value)}
                        placeholder="AIの役割を定義します..."
                        rows={4}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="user-prompt">ユーザープロンプトテンプレート</Label>
                      <Textarea
                        id="user-prompt"
                        value={currentPrompt.userPromptTemplate}
                        onChange={(e) => updateMenuPrompt('userPromptTemplate', e.target.value)}
                        placeholder="OCR結果を処理する指示を記述します..."
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        変数: {'{ocrText}'} - OCR結果テキスト, {'{fileName}'} - ファイル名
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="temperature">Temperature</Label>
                        <Input
                          id="temperature"
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          value={currentPrompt.temperature || 0.7}
                          onChange={(e) => updateMenuPrompt('temperature', parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="max-tokens">Max Tokens</Label>
                        <Input
                          id="max-tokens"
                          type="number"
                          min="100"
                          max="4000"
                          step="100"
                          value={currentPrompt.maxTokens || 2000}
                          onChange={(e) => updateMenuPrompt('maxTokens', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    左側からメニューを選択してください
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={saveSettings}>
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
