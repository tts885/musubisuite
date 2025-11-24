import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Settings, Brain, Search, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { djangoAPI } from '@/services/djangoAPI';

interface AIProvider {
  id?: number;
  name?: string;
  provider_type: string;
  endpoint: string;
  api_key: string;
  api_version?: string;  // Azure OpenAI固有
  deployment_name?: string;  // Azure OpenAI固有
  organization_id?: string;  // OpenAI固有
  model_name: string;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
  is_default: boolean;
}

interface SearchEngineConfig {
  id?: number;
  engine_type: string;
  api_key: string;
  search_engine_id?: string;
  custom_endpoint?: string;
  max_results: number;
  is_active: boolean;
  is_default: boolean;
}

interface AISettings {
  ai_enabled: boolean;
  require_confirmation: boolean;
  allow_overwrite: boolean;
  confidence_threshold: number;
  auto_save_on_high_confidence: boolean;
}

export default function AISettingsPage() {
  const [aiProviders, setAIProviders] = useState<AIProvider[]>([]);
  const [searchEngines, setSearchEngines] = useState<SearchEngineConfig[]>([]);
  const [aiSettings, setAISettings] = useState<AISettings>({
    ai_enabled: true,
    require_confirmation: true,
    allow_overwrite: false,
    confidence_threshold: 70,
    auto_save_on_high_confidence: false,
  });

  const [loading, setLoading] = useState(false);
  const [testingConnection] = useState<number | null>(null);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [editingSearchEngine, setEditingSearchEngine] = useState<SearchEngineConfig | null>(null);

  // AI接続テスト用のstate
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testingProvider, setTestingProvider] = useState<AIProvider | null>(null);
  const [testPrompt, setTestPrompt] = useState('こんにちは。あなたは誰ですか?');
  const [testResponse, setTestResponse] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAIProviders(),
        loadSearchEngines(),
        loadAISettings()
      ]);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const loadAIProviders = async () => {
    try {
      const data = await djangoAPI.getAIProviders();
      // Ensure data is an array
      const providers = Array.isArray(data) ? data : (data?.results || []);
      setAIProviders(providers);
    } catch (error) {

      toast.error('AI Provider一覧の読み込みに失敗しました');
      setAIProviders([]);
    }
  };

  const loadSearchEngines = async () => {
    try {
      const data = await djangoAPI.getSearchEngines();
      // Ensure data is an array
      const engines = Array.isArray(data) ? data : (data?.results || []);
      setSearchEngines(engines);
    } catch (error) {
      toast.error('検索エンジン一覧の読み込みに失敗しました');
      setSearchEngines([]);
    }
  };

  const loadAISettings = async () => {
    try {
      const data = await djangoAPI.getAISettings();
      if (data.length > 0) {
        setAISettings(data[0]);
      }
    } catch (error) {
      toast.error('AI設定の読み込みに失敗しました。デフォルト値を使用します。');
      // Keep default values already set in useState
    }
  };

  const saveAIProvider = async (provider: AIProvider) => {
    try {
      // バリデーション: 設定名が必須
      if (!provider.name || provider.name.trim() === '') {
        toast.error('設定名を入力してください');
        return;
      }

      // プロバイダータイプに応じてデータをクリーンアップ
      const cleanedProvider: any = {
        name: provider.name,
        provider_type: provider.provider_type,
        model_name: provider.model_name,
        max_tokens: provider.max_tokens,
        temperature: provider.temperature,
        is_active: provider.is_active,
        is_default: provider.is_default,
      };

      // API Keyは変更された場合のみ送信(空でない場合)
      if (provider.api_key && provider.api_key.trim() !== '') {
        cleanedProvider.api_key = provider.api_key;
      }

      // Azure OpenAI固有フィールド
      if (provider.provider_type === 'azure_openai') {
        if (!provider.endpoint || !provider.api_version) {
          toast.error('Azure OpenAIの場合、EndpointとAPI Versionは必須です');
          return;
        }
        cleanedProvider.endpoint = provider.endpoint;
        cleanedProvider.api_version = provider.api_version;
        if (provider.deployment_name) {
          cleanedProvider.deployment_name = provider.deployment_name;
        }
      }

      // OpenAI固有フィールド
      if (provider.provider_type === 'openai' && provider.organization_id) {
        cleanedProvider.organization_id = provider.organization_id;
      }

      if (provider.id) {
        await djangoAPI.updateAIProvider(provider.id, cleanedProvider);
      } else {
        await djangoAPI.createAIProvider(cleanedProvider);
      }
      toast.success('AI Providerを保存しました');
      await loadAIProviders();
      setEditingProvider(null);
    } catch (error) {
      toast.error('AI Providerの保存に失敗しました');
    }
  };

  const deleteAIProvider = async (id: number) => {
    if (!confirm('削除しますか?')) return;
    try {
      await djangoAPI.deleteAIProvider(id);
      toast.success('AI Providerを削除しました');
      await loadAIProviders();
    } catch (error) {
      toast.error('AI Providerの削除に失敗しました');
    }
  };

  const testConnection = async (providerId: number) => {
    // プロバイダー情報を取得してテストダイアログを開く
    const provider = aiProviders.find(p => p.id === providerId);
    if (!provider) {
      toast.error('プロバイダーが見つかりません');
      return;
    }
    setTestingProvider(provider);
    setTestPrompt('こんにちは。あなたは誰ですか?');
    setTestResponse('');
    setTestDialogOpen(true);
  };

  const executeAITest = async () => {
    if (!testingProvider || !testPrompt.trim()) {
      toast.error('プロンプトを入力してください');
      return;
    }

    setTestLoading(true);
    setTestResponse('');

    try {
      const { aiStreamService } = await import('@/services/aiStreamService');

      await aiStreamService.streamPrompt(
        `http://127.0.0.1:8000/api/ai-providers/${testingProvider.id}/test_prompt/`,
        { prompt: testPrompt },
        {
          onChunk: (content) => {
            setTestResponse(prev => prev + content);
          },
          onComplete: () => {
            toast.success('AI接続テスト成功');
            setTestLoading(false);
          },
          onError: (error) => {
            setTestResponse(`❌ エラー: ${error}`);
            toast.error('AI接続テスト失敗: ' + error);
            setTestLoading(false);
          }
        }
      );
    } catch (error: any) {
      setTestResponse(`❌ エラー: ${error?.message || '接続に失敗しました'}`);
      toast.error('AI接続テスト失敗: ' + (error?.message || '接続に失敗しました'));
      setTestLoading(false);
    }
  };

  const saveSearchEngine = async (engine: SearchEngineConfig) => {
    try {
      if (engine.id) {
        await djangoAPI.updateSearchEngine(engine.id, engine);
      } else {
        await djangoAPI.createSearchEngine(engine);
      }
      toast.success('検索エンジンを保存しました');
      await loadSearchEngines();
      setEditingSearchEngine(null);
    } catch (error) {
      toast.error('検索エンジンの保存に失敗しました');
    }
  };

  const deleteSearchEngine = async (id: number) => {
    if (!confirm('削除しますか?')) return;
    try {
      await djangoAPI.deleteSearchEngine(id);
      toast.success('検索エンジンを削除しました');
      await loadSearchEngines();
    } catch (error) {
      toast.error('検索エンジンの削除に失敗しました');
    }
  };

  const saveAISettings = async () => {
    try {
      await djangoAPI.updateAISettings(aiSettings);
      toast.success('AI設定を保存しました');
    } catch (error) {
      toast.error('AI設定の保存に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI設定</h1>
          <p className="text-muted-foreground">AI機能の設定と管理</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">
            <Brain className="h-4 w-4 mr-2" />
            AI Provider
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            検索エンジン
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            一般設定
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">AI Provider一覧</h2>
            <Button
              onClick={() =>
                setEditingProvider({
                  name: '',
                  provider_type: 'azure_openai',
                  endpoint: '',
                  api_key: '',
                  api_version: '2024-08-01-preview',
                  deployment_name: '',
                  organization_id: '',
                  model_name: 'gpt-4o',
                  max_tokens: 2000,
                  temperature: 0.7,
                  is_active: true,
                  is_default: false,
                })
              }
            >
              新規追加
            </Button>
          </div>

          <div className="grid gap-4">
            {Array.isArray(aiProviders) && aiProviders.map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {provider.provider_type.toUpperCase()}
                      </CardTitle>
                      {provider.is_default && (
                        <Badge variant="secondary">デフォルト</Badge>
                      )}
                      {provider.is_active ? (
                        <Badge variant="default">有効</Badge>
                      ) : (
                        <Badge variant="outline">無効</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => provider.id && testConnection(provider.id)}
                        disabled={testingConnection === provider.id}
                      >
                        {testingConnection === provider.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          '接続テスト'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProvider(provider)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => provider.id && deleteAIProvider(provider.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Model: {provider.model_name} | Max Tokens: {provider.max_tokens} | Temperature: {provider.temperature}
                  </CardDescription>
                </CardHeader>

              </Card>
            ))}
          </div>

          {aiProviders.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  AI Providerが登録されていません。「新規追加」ボタンから追加してください。
                </p>
              </CardContent>
            </Card>
          )}

          {/* AI Provider編集ダイアログ */}
          <Dialog
            open={!!editingProvider}
            onOpenChange={(open) => !open && setEditingProvider(null)}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProvider?.id ? 'AI Provider編集' : 'AI Provider新規追加'}
                </DialogTitle>
                <DialogDescription>
                  AI Providerの設定を行います
                </DialogDescription>
              </DialogHeader>

              {editingProvider && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider_name">
                      設定名 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="provider_name"
                      value={editingProvider.name || ''}
                      onChange={(e) =>
                        setEditingProvider({
                          ...editingProvider,
                          name: e.target.value,
                        })
                      }
                      placeholder="例: Azure OpenAI 本番環境"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      識別しやすい設定名を入力してください
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="provider_type">
                      Provider Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={editingProvider.provider_type}
                      onValueChange={(value) =>
                        setEditingProvider({
                          ...editingProvider,
                          provider_type: value,
                        })
                      }
                    >
                      <SelectTrigger id="provider_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="azure_openai">Azure OpenAI</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                        <SelectItem value="google">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Azure OpenAI固有フィールド */}
                  {editingProvider.provider_type === 'azure_openai' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="endpoint">
                          Endpoint <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="endpoint"
                          value={editingProvider.endpoint}
                          onChange={(e) =>
                            setEditingProvider({
                              ...editingProvider,
                              endpoint: e.target.value,
                            })
                          }
                          placeholder="https://your-resource.openai.azure.com"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="api_version">
                          API Version <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="api_version"
                          value={editingProvider.api_version || ''}
                          onChange={(e) =>
                            setEditingProvider({
                              ...editingProvider,
                              api_version: e.target.value,
                            })
                          }
                          placeholder="2024-02-01"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Azure OpenAIのAPIバージョン（例: 2024-02-01, 2024-08-01-preview）
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deployment_name">Deployment Name</Label>
                        <Input
                          id="deployment_name"
                          value={editingProvider.deployment_name || ''}
                          onChange={(e) =>
                            setEditingProvider({
                              ...editingProvider,
                              deployment_name: e.target.value,
                            })
                          }
                          placeholder="gpt-4o-deployment"
                        />
                        <p className="text-xs text-muted-foreground">
                          Azure OpenAIのデプロイメント名（オプション）
                        </p>
                      </div>
                    </>
                  )}

                  {/* OpenAI固有フィールド */}
                  {editingProvider.provider_type === 'openai' && (
                    <div className="space-y-2">
                      <Label htmlFor="organization_id">Organization ID</Label>
                      <Input
                        id="organization_id"
                        value={editingProvider.organization_id || ''}
                        onChange={(e) =>
                          setEditingProvider({
                            ...editingProvider,
                            organization_id: e.target.value,
                          })
                        }
                        placeholder="org-xxxxxxxxxxxxx"
                      />
                      <p className="text-xs text-muted-foreground">
                        OpenAIの組織ID（オプション、複数組織に所属している場合に指定）
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="api_key">
                      API Key <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="api_key"
                      type="password"
                      value={editingProvider.api_key}
                      onChange={(e) =>
                        setEditingProvider({
                          ...editingProvider,
                          api_key: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model_name">
                      Model Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="model_name"
                      value={editingProvider.model_name}
                      onChange={(e) =>
                        setEditingProvider({
                          ...editingProvider,
                          model_name: e.target.value,
                        })
                      }
                      placeholder={
                        editingProvider.provider_type === 'azure_openai' ? 'gpt-4o' :
                          editingProvider.provider_type === 'openai' ? 'gpt-4o' :
                            editingProvider.provider_type === 'anthropic' ? 'claude-3-5-sonnet-20241022' :
                              editingProvider.provider_type === 'google' ? 'gemini-2.0-flash-exp' :
                                'model-name'
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {editingProvider.provider_type === 'azure_openai' && 'デプロイメント名またはモデル名'}
                      {editingProvider.provider_type === 'openai' && '例: gpt-4o, gpt-4o-mini, gpt-3.5-turbo'}
                      {editingProvider.provider_type === 'anthropic' && '例: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022'}
                      {editingProvider.provider_type === 'google' && '例: gemini-2.0-flash-exp, gemini-1.5-pro'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max_tokens">Max Tokens</Label>
                      <Input
                        id="max_tokens"
                        type="number"
                        value={editingProvider.max_tokens}
                        onChange={(e) =>
                          setEditingProvider({
                            ...editingProvider,
                            max_tokens: parseInt(e.target.value) || 2000,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={editingProvider.temperature}
                        onChange={(e) =>
                          setEditingProvider({
                            ...editingProvider,
                            temperature: parseFloat(e.target.value) || 0.7,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_active" className="flex-1">有効化</Label>
                      <Switch
                        id="is_active"
                        checked={editingProvider.is_active}
                        onCheckedChange={(checked) =>
                          setEditingProvider({
                            ...editingProvider,
                            is_active: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_default" className="flex-1">デフォルトプロバイダー</Label>
                      <Switch
                        id="is_default"
                        checked={editingProvider.is_default}
                        onCheckedChange={(checked) =>
                          setEditingProvider({
                            ...editingProvider,
                            is_default: checked,
                          })
                        }
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setEditingProvider(null)}
                    >
                      キャンセル
                    </Button>
                    <Button onClick={() => saveAIProvider(editingProvider)}>保存</Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">検索エンジン一覧</h2>
            <Button
              onClick={() =>
                setEditingSearchEngine({
                  engine_type: 'bing',
                  api_key: '',
                  custom_endpoint: '',
                  max_results: 10,
                  is_active: true,
                  is_default: false,
                })
              }
            >
              新規追加
            </Button>
          </div>

          <div className="grid gap-4">
            {Array.isArray(searchEngines) && searchEngines.map((engine) => (
              <Card key={engine.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {engine.engine_type.toUpperCase()}
                      </CardTitle>
                      {engine.is_active ? (
                        <Badge variant="default">有効</Badge>
                      ) : (
                        <Badge variant="outline">無効</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSearchEngine(engine)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => engine.id && deleteSearchEngine(engine.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                  {engine.custom_endpoint && (
                    <CardDescription>
                      Endpoint: {engine.custom_endpoint}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>

          {searchEngines.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  検索エンジンが登録されていません。「新規追加」ボタンから追加してください。
                </p>
              </CardContent>
            </Card>
          )}

          {/* 検索エンジン編集ダイアログ */}
          <Dialog
            open={!!editingSearchEngine}
            onOpenChange={(open) => !open && setEditingSearchEngine(null)}
          >
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSearchEngine?.id ? '検索エンジン編集' : '検索エンジン新規追加'}
                </DialogTitle>
                <DialogDescription>
                  検索エンジンの設定を行います
                </DialogDescription>
              </DialogHeader>

              {editingSearchEngine && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="engine_type">Engine Type</Label>
                    <Select
                      value={editingSearchEngine.engine_type}
                      onValueChange={(value) =>
                        setEditingSearchEngine({
                          ...editingSearchEngine,
                          engine_type: value,
                        })
                      }
                    >
                      <SelectTrigger id="engine_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bing">Bing Search</SelectItem>
                        <SelectItem value="google">Google Search</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="engine_api_key">API Key</Label>
                    <Input
                      id="engine_api_key"
                      type="password"
                      value={editingSearchEngine.api_key}
                      onChange={(e) =>
                        setEditingSearchEngine({
                          ...editingSearchEngine,
                          api_key: e.target.value,
                        })
                      }
                    />
                  </div>

                  {editingSearchEngine.engine_type === 'custom' && (
                    <div className="space-y-2">
                      <Label htmlFor="custom_endpoint">Custom Endpoint</Label>
                      <Input
                        id="custom_endpoint"
                        value={editingSearchEngine.custom_endpoint || ''}
                        onChange={(e) =>
                          setEditingSearchEngine({
                            ...editingSearchEngine,
                            custom_endpoint: e.target.value,
                          })
                        }
                        placeholder="https://api.example.com/search"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t pt-4">
                    <Label htmlFor="engine_is_active" className="flex-1">有効化</Label>
                    <Switch
                      id="engine_is_active"
                      checked={editingSearchEngine.is_active}
                      onCheckedChange={(checked) =>
                        setEditingSearchEngine({
                          ...editingSearchEngine,
                          is_active: checked,
                        })
                      }
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setEditingSearchEngine(null)}
                    >
                      キャンセル
                    </Button>
                    <Button onClick={() => saveSearchEngine(editingSearchEngine)}>保存</Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                AI機能の一般設定
              </CardTitle>
              <CardDescription>すべてのAI機能に適用される共通設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI機能を有効にする</Label>
                  <p className="text-sm text-muted-foreground">
                    すべてのAI機能のマスタースイッチ
                  </p>
                </div>
                <Switch
                  checked={aiSettings.ai_enabled}
                  onCheckedChange={(checked) =>
                    setAISettings({ ...aiSettings, ai_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>確認を必須にする</Label>
                  <p className="text-sm text-muted-foreground">
                    AI生成データを適用前にユーザー確認を求める
                  </p>
                </div>
                <Switch
                  checked={aiSettings.require_confirmation}
                  onCheckedChange={(checked) =>
                    setAISettings({ ...aiSettings, require_confirmation: checked })
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>信頼度閾値: {aiSettings.confidence_threshold}%</Label>
                  <p className="text-sm text-muted-foreground">
                    この値以上の信頼度スコアで高信頼度と判定
                  </p>
                  <Slider
                    value={[aiSettings.confidence_threshold]}
                    onValueChange={([value]) =>
                      setAISettings({ ...aiSettings, confidence_threshold: value })
                    }
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  設定を変更した後は「保存」ボタンをクリックしてください
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button onClick={saveAISettings}>設定を保存</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI接続テストダイアログ */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI接続テスト</DialogTitle>
            <DialogDescription>
              {testingProvider?.name} ({testingProvider?.provider_type}) - {testingProvider?.model_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-prompt">プロンプト</Label>
              <textarea
                id="test-prompt"
                className="w-full min-h-[100px] p-3 border rounded-md resize-y"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="AIに送信するメッセージを入力してください..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={executeAITest}
                disabled={testLoading || !testPrompt.trim()}
                className="flex-1"
              >
                {testLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    テスト実行
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>AI応答</Label>
              <div className="p-4 bg-muted rounded-md min-h-[150px] whitespace-pre-wrap border-2 border-border">
                {testLoading && !testResponse && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AIが応答を生成しています...
                  </div>
                )}
                {testResponse && (
                  <div className="text-foreground">
                    {testResponse}
                    {testLoading && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse">|</span>}
                  </div>
                )}
                {!testLoading && !testResponse && (
                  <div className="text-muted-foreground italic">
                    テストを実行すると、AIの応答がここに表示されます
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTestDialogOpen(false);
                setTestResponse('');
              }}
            >
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
