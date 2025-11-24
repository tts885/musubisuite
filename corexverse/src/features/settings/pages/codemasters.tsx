import { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Edit, Trash2, ArrowUp, ArrowDown, Search, Folder,
  Laptop, Building2, Users, ShoppingCart, Heart, Factory, GraduationCap, Truck,
  CheckCircle, Clock, AlertCircle, FileText, Mail, Calendar, Settings,
  Database, BarChart3, Star, Tag, Folder as FolderIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { codeMasterService, type CodeCategory, type CodeMaster } from '@/services/codemaster';
import { useToast } from '@/hooks/use-toast';

export default function CodeMastersPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CodeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [codes, setCodes] = useState<CodeMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ダイアログ状態
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<CodeCategory> | null>(null);
  const [originalCategoryCode, setOriginalCategoryCode] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<Partial<CodeMaster> | null>(null);

  // プリセットカラー
  const presetColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#64748b', // slate
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadCodes(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await codeMasterService.getCategories();
      // DRFのページネーションレスポンスを処理
      const categoryList = Array.isArray(data) ? data : ((data as any).results || []);
      setCategories(categoryList);
      if (categoryList.length > 0 && !selectedCategory) {
        setSelectedCategory(categoryList[0].code);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'カテゴリの取得に失敗しました',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCodes = async (categoryCode: string) => {
    try {
      const data = await codeMasterService.getCodesByCategory(categoryCode);
      // DRFのページネーションレスポンスを処理
      const codeList = Array.isArray(data) ? data : ((data as any).results || []);
      setCodes(codeList);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'コードの取得に失敗しました',
      });
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;

    try {
      if (originalCategoryCode) {
        // 更新モード
        await codeMasterService.updateCategory(originalCategoryCode, editingCategory);
        toast({
          title: '成功',
          description: 'カテゴリを更新しました',
        });
      } else {
        // 新規作成モード
        await codeMasterService.createCategory(editingCategory);
        toast({
          title: '成功',
          description: 'カテゴリを作成しました',
        });
      }
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      setOriginalCategoryCode(null);
      loadCategories();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'カテゴリの保存に失敗しました',
      });
    }
  };

  const handleDeleteCategory = async (code: string) => {
    if (!confirm('このカテゴリを削除してもよろしいですか?')) return;

    try {
      await codeMasterService.deleteCategory(code);
      toast({
        title: '成功',
        description: 'カテゴリを削除しました',
      });
      loadCategories();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'カテゴリの削除に失敗しました',
      });
    }
  };

  const handleSaveCode = async () => {
    if (!editingCode || !selectedCategory) return;

    try {
      const codeData = {
        ...editingCode,
        category: selectedCategory,
      };

      if (editingCode.id) {
        await codeMasterService.updateCode(editingCode.id, codeData);
        toast({
          title: '成功',
          description: 'コードを更新しました',
        });
      } else {
        await codeMasterService.createCode(codeData);
        toast({
          title: '成功',
          description: 'コードを作成しました',
        });
      }
      setCodeDialogOpen(false);
      setEditingCode(null);
      loadCodes(selectedCategory);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'コードの保存に失敗しました',
      });
    }
  };

  const handleDeleteCode = async (id: number) => {
    if (!confirm('このコードを削除してもよろしいですか?') || !selectedCategory) return;

    try {
      await codeMasterService.deleteCode(id, selectedCategory);
      toast({
        title: '成功',
        description: 'コードを削除しました',
      });
      loadCodes(selectedCategory);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'コードの削除に失敗しました',
      });
    }
  };

  const handleMoveCode = async (index: number, direction: 'up' | 'down') => {
    if (!selectedCategory) return;

    const newCodes = [...codes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newCodes.length) return;

    [newCodes[index], newCodes[targetIndex]] = [newCodes[targetIndex], newCodes[index]];

    const reorderData = newCodes.map((code, idx) => ({
      id: code.id,
      sort_order: idx,
    }));

    try {
      await codeMasterService.reorderCodes(reorderData, selectedCategory);
      setCodes(newCodes);
      toast({
        title: '成功',
        description: '並び順を更新しました',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: '並び順の更新に失敗しました',
      });
    }
  };

  // フィルタリングされたカテゴリ
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.code.toLowerCase().includes(query) ||
        cat.description?.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const selectedCategoryData = categories.find((c) => c.code === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">コードマスタ管理</h1>
            <p className="text-muted-foreground mt-2">
              システムで使用するドロップダウンリスト項目を管理します
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingCategory({
                is_system: false,
                is_active: true,
                sort_order: categories.length,
              });
              setOriginalCategoryCode(null);
              setCategoryDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            カテゴリ追加
          </Button>
        </div>
      </div>

      {/* マスター-ディテールビュー */}
      <div className="grid grid-cols-12 gap-6">
        {/* 左側: カテゴリマスターリスト */}
        <div className="col-span-3">
          <Card className="h-[calc(100vh-280px)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-base">カテゴリ</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditingCategory({
                      is_system: false,
                      is_active: true,
                      sort_order: categories.length,
                    });
                    setOriginalCategoryCode(null);
                    setCategoryDialogOpen(true);
                  }}
                  title="カテゴリ追加"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                {categories.length}件
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-y-auto max-h-[calc(100vh-400px)]">
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm px-4">
                    カテゴリが見つかりません
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredCategories.map((category) => (
                      <div
                        key={category.code}
                        className={cn(
                          'group relative transition-colors',
                          selectedCategory === category.code && 'bg-accent'
                        )}
                      >
                        <button
                          onClick={() => setSelectedCategory(category.code)}
                          className={cn(
                            'w-full px-3 py-2.5 text-left transition-colors',
                            'hover:bg-accent'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <h4 className="font-medium text-sm truncate">{category.name}</h4>
                                {category.is_system && (
                                  <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                                    SYS
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {category.code}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                                {category.codes_count}
                              </div>
                            </div>
                          </div>
                        </button>
                        {!category.is_system && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 bg-background hover:bg-accent"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategory(category);
                                setOriginalCategoryCode(category.code);
                                setCategoryDialogOpen(true);
                              }}
                              title="編集"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 bg-background hover:bg-destructive hover:text-destructive-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCategory(category.code);
                              }}
                              title="削除"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右側: ディテールビュー */}
        <div className="col-span-9">
          {!selectedCategoryData ? (
            <Card className="h-[calc(100vh-280px)]">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <Folder className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">カテゴリを選択</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    左側のリストからカテゴリを選択すると、コード一覧が表示されます
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[calc(100vh-280px)] flex flex-col">
              {/* ディテールヘッダー */}
              <CardHeader className="border-b pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl">{selectedCategoryData.name}</CardTitle>
                      {selectedCategoryData.is_system && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          システムカテゴリ
                        </span>
                      )}
                    </div>
                    <CardDescription className="font-mono text-sm">
                      {selectedCategoryData.code}
                    </CardDescription>
                    {selectedCategoryData.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedCategoryData.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!selectedCategoryData.is_system && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(selectedCategoryData);
                            setOriginalCategoryCode(selectedCategoryData.code);
                            setCategoryDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          編集
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(selectedCategoryData.code)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          削除
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* コードリスト */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">コード一覧</h3>
                      <p className="text-sm text-muted-foreground">
                        {codes.length}件のコードが登録されています
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingCode({
                          is_active: true,
                          sort_order: codes.length,
                        });
                        setCodeDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      コード追加
                    </Button>
                  </div>
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
                  {codes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>コードが登録されていません</p>
                      <p className="text-sm mt-1">上の「コード追加」ボタンから追加してください</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="w-[100px]">順序</TableHead>
                          <TableHead className="w-[100px]">コード</TableHead>
                          <TableHead>名前</TableHead>
                          <TableHead>英語名</TableHead>
                          <TableHead className="w-[100px]">色</TableHead>
                          <TableHead className="w-[60px]">アイコン</TableHead>
                          <TableHead className="w-[70px]">状態</TableHead>
                          <TableHead className="w-[100px]">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {codes.map((code, index) => (
                          <TableRow key={code.id}>
                            <TableCell>
                              <div className="flex gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  disabled={index === 0}
                                  onClick={() => handleMoveCode(index, 'up')}
                                  title="上に移動"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  disabled={index === codes.length - 1}
                                  onClick={() => handleMoveCode(index, 'down')}
                                  title="下に移動"
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{code.code}</TableCell>
                            <TableCell className="font-medium">{code.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {code.name_en}
                            </TableCell>
                            <TableCell>
                              {code.color && (
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-5 h-5 rounded border shadow-sm"
                                    style={{ backgroundColor: code.color }}
                                    title={code.color}
                                  />
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {code.color}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {code.icon && (
                                <span className="text-base" title={code.icon}>
                                  {code.icon}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {code.is_active ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  有効
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  無効
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setEditingCode(code);
                                    setCodeDialogOpen(true);
                                  }}
                                  title="編集"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleDeleteCode(code.id)}
                                  title="削除"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* カテゴリ編集ダイアログ */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {originalCategoryCode ? 'カテゴリ編集' : 'カテゴリ追加'}
            </DialogTitle>
            <DialogDescription>
              カテゴリの情報を入力してください
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-code">コード *</Label>
              <Input
                id="category-code"
                value={editingCategory?.code || ''}
                onChange={(e) =>
                  setEditingCategory((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="INDUSTRY"
                disabled={!!originalCategoryCode}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-name">名前 *</Label>
              <Input
                id="category-name"
                value={editingCategory?.name || ''}
                onChange={(e) =>
                  setEditingCategory((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="業種"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-description">説明</Label>
              <Textarea
                id="category-description"
                value={editingCategory?.description || ''}
                onChange={(e) =>
                  setEditingCategory((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="業種の分類"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="category-active"
                checked={editingCategory?.is_active ?? true}
                onCheckedChange={(checked) =>
                  setEditingCategory((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="category-active">有効</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCategoryDialogOpen(false);
                setEditingCategory(null);
                setOriginalCategoryCode(null);
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleSaveCategory}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* コード編集ダイアログ */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCode?.id ? 'コード編集' : 'コード追加'}
            </DialogTitle>
            <DialogDescription>コードの情報を入力してください</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code-code">コード *</Label>
                <Input
                  id="code-code"
                  value={editingCode?.code || ''}
                  onChange={(e) =>
                    setEditingCode((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="it"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code-name">名前 *</Label>
                <Input
                  id="code-name"
                  value={editingCode?.name || ''}
                  onChange={(e) =>
                    setEditingCode((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="IT・情報通信業"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code-name-en">英語名</Label>
              <Input
                id="code-name-en"
                value={editingCode?.name_en || ''}
                onChange={(e) =>
                  setEditingCode((prev) => ({ ...prev, name_en: e.target.value }))
                }
                placeholder="IT & Information Services"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code-description">説明</Label>
              <Textarea
                id="code-description"
                value={editingCode?.description || ''}
                onChange={(e) =>
                  setEditingCode((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code-color">色</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="code-color"
                      value={editingCode?.color || ''}
                      onChange={(e) => {
                        const color = e.target.value;
                        setEditingCode((prev) => ({ ...prev, color }));
                      }}
                      placeholder="#3b82f6"
                      className="pr-10"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {editingCode?.color && (
                        <div
                          className="w-6 h-6 rounded border shadow-sm"
                          style={{ backgroundColor: editingCode.color }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="color"
                      value={editingCode?.color || '#3b82f6'}
                      onChange={(e) => {
                        const color = e.target.value;
                        setEditingCode((prev) => ({ ...prev, color }));
                      }}
                      className="w-12 h-10 rounded border cursor-pointer"
                      title="カラーピッカー"
                    />
                  </div>
                </div>

                {/* プリセットカラー */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">プリセット</div>
                  <div className="grid grid-cols-9 gap-2">
                    {presetColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setEditingCode((prev) => ({ ...prev, color }));
                        }}
                        className={cn(
                          'w-8 h-8 rounded border-2 shadow-sm transition-all hover:scale-110',
                          editingCode?.color === color
                            ? 'border-primary ring-2 ring-primary ring-offset-1'
                            : 'border-gray-300 hover:border-gray-400'
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="code-icon">アイコン (lucide-reactアイコン名)</Label>
                <Input
                  id="code-icon"
                  value={editingCode?.icon || ''}
                  onChange={(e) =>
                    setEditingCode((prev) => ({ ...prev, icon: e.target.value }))
                  }
                  placeholder="Laptop"
                />
                
                {/* よく使うアイコンのプリセット */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">よく使うアイコン</div>
                  <div className="grid grid-cols-10 gap-2">
                    {[
                      { name: 'Laptop', Icon: Laptop },
                      { name: 'Building2', Icon: Building2 },
                      { name: 'Users', Icon: Users },
                      { name: 'ShoppingCart', Icon: ShoppingCart },
                      { name: 'Heart', Icon: Heart },
                      { name: 'Factory', Icon: Factory },
                      { name: 'GraduationCap', Icon: GraduationCap },
                      { name: 'Truck', Icon: Truck },
                      { name: 'CheckCircle', Icon: CheckCircle },
                      { name: 'Clock', Icon: Clock },
                      { name: 'AlertCircle', Icon: AlertCircle },
                      { name: 'FileText', Icon: FileText },
                      { name: 'Mail', Icon: Mail },
                      { name: 'Calendar', Icon: Calendar },
                      { name: 'Settings', Icon: Settings },
                      { name: 'Database', Icon: Database },
                      { name: 'BarChart3', Icon: BarChart3 },
                      { name: 'Star', Icon: Star },
                      { name: 'Tag', Icon: Tag },
                      { name: 'Folder', Icon: FolderIcon },
                    ].map(({ name, Icon }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setEditingCode((prev) => ({ ...prev, icon: name }))}
                        className={cn(
                          'p-2 rounded border transition-all hover:bg-accent flex items-center justify-center',
                          editingCode?.icon === name
                            ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-1'
                            : 'border-gray-300 hover:border-gray-400'
                        )}
                        title={name}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <a 
                      href="https://lucide.dev/icons/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      すべてのアイコンを見る →
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="code-active"
                checked={editingCode?.is_active ?? true}
                onCheckedChange={(checked) =>
                  setEditingCode((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="code-active">有効</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCodeDialogOpen(false);
                setEditingCode(null);
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleSaveCode}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
