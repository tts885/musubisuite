import { ListChecks, Upload, ChevronDown, ChevronRight, Menu, FileText, Folder, FolderOpen, Plus, Edit2, Trash2, MoreVertical } from 'lucide-react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buildFolderTree, type FolderTreeNode, getFolderStats, mockOcrFolders } from '@/data/mockOcrData'
import type { OcrFolder } from '@/types'

interface OcrSidebarProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

interface MenuSection {
  id: string
  name: string
  icon?: string
  createdAt: string
}

/**
 * OCRアプリケーションのサイドバー
 * Plane風の現代的なサイドバーデザイン
 */
export default function OcrSidebar({ sidebarCollapsed, setSidebarCollapsed, sidebarOpen, setSidebarOpen }: OcrSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['all-docs']))
  const [folders, setFolders] = useState<OcrFolder[]>(mockOcrFolders)
  
  // メニューセクション管理
  const [menuSections, setMenuSections] = useState<MenuSection[]>([
    { id: 'all-docs', name: 'すべてのドキュメント', createdAt: new Date().toISOString() }
  ])
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false)
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null)
  const [menuName, setMenuName] = useState('')
  
  // ダイアログの状態管理
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentParentId, setCurrentParentId] = useState<string | undefined>(undefined)
  const [currentMenuSection, setCurrentMenuSection] = useState<string>('all-docs')
  const [editingFolder, setEditingFolder] = useState<FolderTreeNode | null>(null)
  
  // フォーム入力の状態
  const [folderName, setFolderName] = useState('')
  const [folderDescription, setFolderDescription] = useState('')
  const [folderColor, setFolderColor] = useState('#3b82f6')

  const selectedFolderId = searchParams.get('folder')

  const isActive = (path: string) => location.pathname === path

  // フォルダの階層深さを計算
  const getFolderDepth = (folderId: string): number => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder || !folder.parentId) return 0
    return 1 + getFolderDepth(folder.parentId)
  }

  // フォルダの展開/折りたたみ
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  // フォルダツリーノードをレンダリング
  const renderFolderNode = (node: FolderTreeNode, depth: number = 0, menuSection: string = 'all-docs') => {
    const isExpanded = expandedFolders.has(node.id)
    const isSelected = selectedFolderId === node.id
    const hasChildren = node.children && node.children.length > 0
    const stats = getFolderStats(node.id, folders)

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors group
            ${isSelected
              ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }
          `}
          style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}
        >
          {/* 展開/折りたたみアイコン */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(node.id)
              }}
              className="flex-shrink-0 hover:bg-muted rounded p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* フォルダアイコン */}
          <button
            onClick={() => {
              navigate(`/ocr?folder=${node.id}`)
              setSidebarOpen(false)
            }}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: node.color }} />
            ) : (
              <Folder className="w-4 h-4 flex-shrink-0" style={{ color: node.color }} />
            )}
            <span className="truncate">{node.name}</span>
          </button>

          {/* ドキュメント数 */}
          {stats.total > 0 && (
            <span className="text-xs text-muted-foreground">
              {stats.total}
            </span>
          )}

          {/* アクションメニュー */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-1 transition-opacity">
                <MoreVertical className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* 2階層目以降はサブフォルダ追加不可 */}
              {getFolderDepth(node.id) < 1 && (
                <DropdownMenuItem onClick={() => handleAddFolder(node.id, menuSection)}>
                  <Plus className="w-3 h-3 mr-2" />
                  サブフォルダを追加
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleEditFolder(node)}>
                <Edit2 className="w-4 h-4 mr-2" />
                編集
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteFolder(node.id)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 子フォルダ */}
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderFolderNode(child, depth + 1, menuSection))}
          </div>
        )}
      </div>
    )
  }

  // メニューセクション追加
  const handleAddMenu = () => {
    setMenuName('')
    setIsAddMenuOpen(true)
  }
  
  const executeAddMenu = () => {
    if (!menuName.trim()) {
      alert('メニュー名を入力してください')
      return
    }
    
    const trimmedName = menuName.trim()
    const existingMenu = menuSections.find(m => m.name === trimmedName)
    if (existingMenu) {
      alert('同じ名前のメニューが既に存在します')
      return
    }
    
    const newMenu: MenuSection = {
      id: `menu-${Date.now()}`,
      name: trimmedName,
      createdAt: new Date().toISOString(),
    }
    
    setMenuSections([...menuSections, newMenu])
    setExpandedFolders(prev => new Set([...prev, newMenu.id]))
    setIsAddMenuOpen(false)
    setMenuName('')
  }
  
  // メニューセクション編集
  const handleEditMenu = (menuId: string) => {
    const menu = menuSections.find(m => m.id === menuId)
    if (menu) {
      setEditingMenuId(menuId)
      setMenuName(menu.name)
      setIsEditMenuOpen(true)
    }
  }
  
  const executeEditMenu = () => {
    if (!menuName.trim()) {
      alert('メニュー名を入力してください')
      return
    }
    
    const trimmedName = menuName.trim()
    const existingMenu = menuSections.find(m => m.name === trimmedName && m.id !== editingMenuId)
    if (existingMenu) {
      alert('同じ名前のメニューが既に存在します')
      return
    }
    
    setMenuSections(menuSections.map(m => 
      m.id === editingMenuId ? { ...m, name: trimmedName } : m
    ))
    setIsEditMenuOpen(false)
    setEditingMenuId(null)
    setMenuName('')
  }
  
  // メニューセクション削除
  const handleDeleteMenu = (menuId: string) => {
    const menu = menuSections.find(m => m.id === menuId)
    if (!menu) return
    
    const foldersInSection = folders.filter(f => f.parentId === null && f.path.startsWith(`/${menuId}/`))
    const message = foldersInSection.length > 0
      ? `メニュー「${menu.name}」と配下のフォルダをすべて削除してもよろしいですか?\n(ドキュメントは削除されません)`
      : `メニュー「${menu.name}」を削除してもよろしいですか?`
    
    if (confirm(message)) {
      setMenuSections(menuSections.filter(m => m.id !== menuId))
      // 該当メニュー配下のフォルダも削除
      setFolders(folders.filter(f => !f.path.startsWith(`/${menuId}/`)))
      setExpandedFolders(prev => {
        const newSet = new Set(prev)
        newSet.delete(menuId)
        return newSet
      })
    }
  }
  
  // フォルダ追加ハンドラー
  const handleAddFolder = (parentId?: string, menuSection?: string) => {
    // 階層制限チェック: 2階層まで(親→子て2階層)
    if (parentId) {
      const depth = getFolderDepth(parentId)
      if (depth >= 1) {
        alert('フォルダは2階層までしか作成できません。\n(例: 請求書 → 2024年度 まで)')
        return
      }
    }
    
    setCurrentParentId(parentId)
    setCurrentMenuSection(menuSection || 'all-docs')
    setFolderName('')
    setFolderDescription('')
    setFolderColor('#3b82f6')
    setIsAddDialogOpen(true)
  }
  
  // フォルダ追加実行
  const executeAddFolder = () => {
    if (!folderName.trim()) {
      alert('フォルダ名を入力してください')
      return
    }
    
    // 重複チェック
    const trimmedName = folderName.trim()
    if (currentParentId) {
      // サブフォルダの場合: 同じ親内で重複チェック
      const siblingsWithSameName = folders.filter(
        f => f.parentId === currentParentId && f.name === trimmedName
      )
      if (siblingsWithSameName.length > 0) {
        alert('同じ親フォルダ内に同じ名前のフォルダが既に存在します')
        return
      }
    } else {
      // ルートフォルダの場合: ルートレベルで重複チェック
      const rootFoldersWithSameName = folders.filter(
        f => f.parentId === null && f.name === trimmedName
      )
      if (rootFoldersWithSameName.length > 0) {
        alert('同じ階層に同じ名前のフォルダが既に存在します')
        return
      }
    }
    
    const parentFolder = currentParentId ? folders.find(f => f.id === currentParentId) : null
    const path = parentFolder ? `${parentFolder.path}/${trimmedName}` : `/${trimmedName}`
    
    const newFolder: OcrFolder = {
      id: `folder-${Date.now()}`,
      name: trimmedName,
      description: folderDescription,
      color: folderColor,
      parentId: currentParentId || null,
      path: path,
      folderCount: 0,
      documentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user',
      menuSection: currentMenuSection, // メニューセクションを記録
    }
    
    // フォルダを追加
    setFolders(prev => [...prev, newFolder])
    
    // 親フォルダのfolderCountを更新
    if (currentParentId) {
      setFolders(prev => prev.map(f => 
        f.id === currentParentId 
          ? { ...f, folderCount: f.folderCount + 1 }
          : f
      ))
    }
    
    // 親フォルダを展開
    if (currentParentId) {
      setExpandedFolders(prev => new Set([...prev, currentParentId]))
    }
    
    setIsAddDialogOpen(false)
    console.log('フォルダを追加:', newFolder)
  }

  // フォルダ編集ハンドラー
  const handleEditFolder = (folder: FolderTreeNode) => {
    setEditingFolder(folder)
    setFolderName(folder.name)
    setFolderDescription(folder.description || '')
    setFolderColor(folder.color || '#3b82f6')
    setIsEditDialogOpen(true)
  }
  
  // フォルダ編集実行
  const executeEditFolder = () => {
    if (!editingFolder || !folderName.trim()) {
      alert('フォルダ名を入力してください')
      return
    }
    
    // 重複チェック(自分自身は除外)
    const trimmedName = folderName.trim()
    const currentFolder = folders.find(f => f.id === editingFolder.id)
    if (currentFolder) {
      if (currentFolder.parentId) {
        // サブフォルダの場合: 同じ親内で重複チェック
        const siblingsWithSameName = folders.filter(
          f => f.parentId === currentFolder.parentId && 
               f.name === trimmedName && 
               f.id !== editingFolder.id
        )
        if (siblingsWithSameName.length > 0) {
          alert('同じ親フォルダ内に同じ名前のフォルダが既に存在します')
          return
        }
      } else {
        // ルートフォルダの場合: ルートレベルで重複チェック
        const rootFoldersWithSameName = folders.filter(
          f => f.parentId === null && 
               f.name === trimmedName && 
               f.id !== editingFolder.id
        )
        if (rootFoldersWithSameName.length > 0) {
          alert('同じ階層に同じ名前のフォルダが既に存在します')
          return
        }
      }
    }
    
    // フォルダ情報を更新
    setFolders(prev => prev.map(f => {
      if (f.id === editingFolder.id) {
        const parentPath = f.path.split('/').slice(0, -1).join('/')
        return {
          ...f,
          name: trimmedName,
          description: folderDescription,
          color: folderColor,
          path: parentPath ? `${parentPath}/${trimmedName}` : `/${trimmedName}`,
        }
      }
      return f
    }))
    
    // 子フォルダのパスも更新
    const updateChildPaths = (oldPath: string, newPath: string) => {
      setFolders(prev => prev.map(f => {
        if (f.path.startsWith(oldPath + '/')) {
          return {
            ...f,
            path: f.path.replace(oldPath, newPath),
          }
        }
        return f
      }))
    }
    
    const oldPath = editingFolder.path
    const parentPath = oldPath.split('/').slice(0, -1).join('/')
    const newPath = parentPath ? `${parentPath}/${folderName}` : `/${folderName}`
    
    if (oldPath !== newPath) {
      updateChildPaths(oldPath, newPath)
    }
    
    setIsEditDialogOpen(false)
    console.log('フォルダを編集:', { id: editingFolder.id, name: folderName })
  }

  // フォルダ削除ハンドラー
  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return
    
    const hasChildren = folders.some(f => f.parentId === folderId)
    const message = hasChildren
      ? `フォルダ「${folder.name}」とその配下のサブフォルダをすべて削除してもよろしいですか?\n(ドキュメントは削除されません)`
      : `フォルダ「${folder.name}」を削除してもよろしいですか?\n(ドキュメントは削除されません)`
    
    if (confirm(message)) {
      // 削除対象のフォルダID一覧を取得(再帰的に)
      const getFolderIdsToDelete = (id: string): string[] => {
        const childIds = folders.filter(f => f.parentId === id).map(f => f.id)
        return [id, ...childIds.flatMap(getFolderIdsToDelete)]
      }
      
      const idsToDelete = getFolderIdsToDelete(folderId)
      
      // フォルダを削除
      setFolders(prev => prev.filter(f => !idsToDelete.includes(f.id)))
      
      // 親フォルダのfolderCountを更新
      if (folder.parentId) {
        setFolders(prev => prev.map(f => 
          f.id === folder.parentId
            ? { ...f, folderCount: Math.max(0, f.folderCount - 1) }
            : f
        ))
      }
      
      // 選択中のフォルダが削除された場合、トップページに戻る
      if (idsToDelete.includes(selectedFolderId || '')) {
        navigate('/ocr')
      }
      
      console.log('フォルダを削除:', idsToDelete)
    }
  }



  return (
    <aside 
      className={`
        bg-sidebar border-r border-sidebar-border
        transition-all duration-300 ease-in-out
        flex-shrink-0
        ${sidebarCollapsed ? 'w-16' : 'w-72'}
        fixed inset-y-0 left-16 z-40 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Header with Menu Button - 展開/折りたたみに対応 */}
        <div className={`border-b border-sidebar-border flex items-center ${sidebarCollapsed ? 'h-16 justify-center' : 'h-16 px-4 gap-3'}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
            className="flex-shrink-0 hover:bg-sidebar-accent"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {!sidebarCollapsed && (
            <>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-lg font-bold text-foreground">OCR管理</h1>
            </>
          )}
        </div>

        {/* Navigation - Plane風のナビゲーションスタイル */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <button
            onClick={() => {
              // 選択中のフォルダがあれば、そのフォルダIDを渡す
              const uploadPath = selectedFolderId 
                ? `/ocr/upload?folder=${selectedFolderId}`
                : '/ocr/upload'
              navigate(uploadPath)
              setSidebarOpen(false)
            }}
            title={sidebarCollapsed ? "新規アップロード" : undefined}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full
              ${sidebarCollapsed ? 'justify-center' : ''}
              ${isActive('/ocr/upload')
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }
            `}
          >
            <Upload className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>新規アップロード</span>}
          </button>

          {/* メニューセクション一覧 */}
          {menuSections.map(section => {
            // メニューセクションごとにフォルダをフィルタリング
            let sectionFolders: OcrFolder[]
            if (section.id === 'all-docs') {
              // 「すべてのドキュメント」は既存のフォルダ（menuSectionプロパティがないか'all-docs'）
              sectionFolders = folders.filter(f => !f.menuSection || f.menuSection === 'all-docs')
            } else {
              // その他のメニューはそのメニューIDが設定されたフォルダのみ
              sectionFolders = folders.filter(f => f.menuSection === section.id)
            }
            const folderTree = buildFolderTree(null, sectionFolders)
            
            return (
              <div key={section.id}>
                <div className="flex items-center gap-2 group">
                  <button
                    onClick={() => {
                      if (!sidebarCollapsed) {
                        toggleFolder(section.id)
                      } else {
                        navigate('/ocr')
                        setSidebarOpen(false)
                      }
                    }}
                    title={sidebarCollapsed ? section.name : undefined}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 group/btn
                      ${sidebarCollapsed ? 'justify-center' : ''}
                      ${(isActive('/ocr') || isActive('/ocr/documents')) && !selectedFolderId
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }
                    `}
                  >
                    {!sidebarCollapsed && expandedFolders.has(section.id) && (
                      <ChevronDown className="w-3 h-3 flex-shrink-0" />
                    )}
                    {!sidebarCollapsed && !expandedFolders.has(section.id) && (
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    )}
                    <ListChecks className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="flex-1 text-left">{section.name}</span>}
                    {!sidebarCollapsed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddFolder(undefined, section.id)
                        }}
                        className="opacity-0 group-hover/btn:opacity-100 hover:bg-muted rounded p-1 transition-opacity"
                        title="ルートフォルダを追加"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </button>
                  {!sidebarCollapsed && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-1 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditMenu(section.id)}>
                          <Edit2 className="w-3 h-3 mr-2" />
                          名前を変更
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMenu(section.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* フォルダツリー */}
                {!sidebarCollapsed && expandedFolders.has(section.id) && (
                  <div className="mt-1 space-y-0.5">
                    {folderTree.map(node => renderFolderNode(node, 0, section.id))}
                  </div>
                )}
              </div>
            )
          })}
          
          {/* 新しいメニュー追加ボタン */}
          {!sidebarCollapsed && (
            <button
              onClick={handleAddMenu}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground mt-2"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>新しいメニューを追加</span>
            </button>
          )}
        </nav>

        {/* Footer - サイドバー下部の情報表示エリア */}
        <div className="p-4 border-t border-sidebar-border">
          {!sidebarCollapsed && (
            <div className="text-xs text-sidebar-foreground/50 space-y-1">
              <p className="font-medium">OCR Engine: Azure AI</p>
              <p>Document Intelligence</p>
            </div>
          )}
        </div>
      </div>

      {/* メニューセクション追加ダイアログ */}
      <Dialog open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しいメニューを追加</DialogTitle>
            <DialogDescription>
              新しいメニューセクションを作成します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="menu-name">メニュー名</Label>
              <Input
                id="menu-name"
                placeholder="例: プロジェクト管理"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeAddMenu()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMenuOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={executeAddMenu}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* メニューセクション編集ダイアログ */}
      <Dialog open={isEditMenuOpen} onOpenChange={setIsEditMenuOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メニュー名を変更</DialogTitle>
            <DialogDescription>
              メニューセクションの名前を変更します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-menu-name">メニュー名</Label>
              <Input
                id="edit-menu-name"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeEditMenu()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditMenuOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={executeEditMenu}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* フォルダ追加ダイアログ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>フォルダを追加</DialogTitle>
            <DialogDescription>
              {currentParentId 
                ? `「${folders.find(f => f.id === currentParentId)?.name}」配下に新しいフォルダを作成します`
                : '新しいルートフォルダを作成します'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">フォルダ名 <span className="text-destructive">*</span></Label>
              <Input
                id="folder-name"
                placeholder="例: 請求書"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folder-description">説明</Label>
              <Textarea
                id="folder-description"
                placeholder="フォルダの説明を入力..."
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folder-color">カラー</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="folder-color"
                  type="color"
                  value={folderColor}
                  onChange={(e) => setFolderColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{folderColor}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={executeAddFolder}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* フォルダ編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>フォルダを編集</DialogTitle>
            <DialogDescription>
              フォルダ「{editingFolder?.name}」の情報を編集します
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">フォルダ名 <span className="text-destructive">*</span></Label>
              <Input
                id="edit-folder-name"
                placeholder="例: 請求書"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-folder-description">説明</Label>
              <Textarea
                id="edit-folder-description"
                placeholder="フォルダの説明を入力..."
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-folder-color">カラー</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="edit-folder-color"
                  type="color"
                  value={folderColor}
                  onChange={(e) => setFolderColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{folderColor}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={executeEditFolder}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
