import { ListChecks, Upload, ChevronDown, ChevronRight, Menu, FileText, Folder, FolderOpen, Plus, Edit2, Trash2, MoreVertical } from 'lucide-react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useMenuSections, useOcrFolders } from '@/hooks/useOcrDataverse'
import ocrDataverseService from '@/services/ocrDataverseService'
import type { OcrFolder } from '@/types'

interface FolderTreeNode {
  folder: OcrFolder
  children: FolderTreeNode[]
}

interface OcrSidebarProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

/**
 * OCRアプリケーションのサイドバー
 * 現代的なサイドバーデザイン
 */
export default function OcrSidebar({ sidebarCollapsed, setSidebarCollapsed, sidebarOpen, setSidebarOpen }: OcrSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['all-docs']))

  // Dataverseからメニューセクションとフォルダを取得
  const { sections: menuSectionsData, createSection, updateSection, deleteSection } = useMenuSections()
  const { folders: foldersData, createFolder, updateFolder, deleteFolder } = useOcrFolders()

  // メニューセクション管理
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false)
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null)
  const [menuName, setMenuName] = useState('')

  // メニューセクションは既にMenuSection型なのでそのまま使用
  const menuSections = menuSectionsData

  // フォルダリスト
  const folders = foldersData

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

  // フォルダツリーを構築
  const buildFolderTree = (parentId: string | null, foldersList: OcrFolder[]): FolderTreeNode[] => {
    return foldersList
      .filter(folder => folder.parentId === parentId)
      .map(folder => ({
        folder,
        children: buildFolderTree(folder.id, foldersList)
      }))
  }

  // ドキュメント数を取得
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({})

  // ドキュメント数を取得する関数
  const fetchDocumentCounts = useCallback(async () => {
    try {
      const docs = await ocrDataverseService.getDocuments()
      const counts: Record<string, number> = {}

      docs.forEach(doc => {
        if (doc.folderId) {
          counts[doc.folderId] = (counts[doc.folderId] || 0) + 1
        }
      })

      setDocumentCounts(counts)
    } catch (error) {
      console.error('ドキュメント数取得エラー:', error)
    }
  }, [])

  // 初回読み込み時にドキュメント数を取得
  useEffect(() => {
    fetchDocumentCounts()
  }, [fetchDocumentCounts])

  // 定期的にドキュメント数を更新（30秒ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDocumentCounts()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchDocumentCounts])

  // カスタムイベントをリッスンしてドキュメント数を即座に更新
  useEffect(() => {
    const handleDocumentsUpdated = () => {
      fetchDocumentCounts()
    }

    window.addEventListener('documentsUpdated', handleDocumentsUpdated)

    return () => {
      window.removeEventListener('documentsUpdated', handleDocumentsUpdated)
    }
  }, [fetchDocumentCounts])

  // フォルダ統計を取得
  const getFolderStats = (folderId: string) => {
    const total = documentCounts[folderId] || 0
    return { total, processing: 0, completed: 0 }
  }

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
    const isExpanded = expandedFolders.has(node.folder.id)
    const isSelected = selectedFolderId === node.folder.id
    const hasChildren = node.children && node.children.length > 0
    const stats = getFolderStats(node.folder.id)

    return (
      <div key={node.folder.id}>
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
                toggleFolder(node.folder.id)
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
              navigate(`/ocr?folder=${node.folder.id}`)
              setSidebarOpen(false)
            }}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: node.folder.color }} />
            ) : (
              <Folder className="w-4 h-4 flex-shrink-0" style={{ color: node.folder.color }} />
            )}
            <span className="truncate">{node.folder.name}</span>
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
              {getFolderDepth(node.folder.id) < 1 && (
                <DropdownMenuItem onClick={() => handleAddFolder(node.folder.id, menuSection)}>
                  <Plus className="w-3 h-3 mr-2" />
                  サブフォルダを追加
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleEditFolder(node)}>
                <Edit2 className="w-4 h-4 mr-2" />
                編集
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteFolder(node.folder.id)}
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

  const executeAddMenu = async () => {
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

    try {
      const created = await createSection({
        name: trimmedName,
        description: '',
        displayOrder: menuSections.length + 1,
        isDefault: false,
        color: '#3b82f6',
      })

      setExpandedFolders(prev => new Set([...prev, created.id]))
      setIsAddMenuOpen(false)
      setMenuName('')
    } catch (error) {
      console.error('メニュー追加エラー:', error)
      alert('メニューの追加に失敗しました')
    }
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

  const executeEditMenu = async () => {
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

    if (!editingMenuId) return

    try {
      await updateSection(editingMenuId, {
        name: trimmedName,
      })

      setIsEditMenuOpen(false)
      setEditingMenuId(null)
      setMenuName('')
    } catch (error) {
      console.error('メニュー更新エラー:', error)
      alert('メニューの更新に失敗しました')
    }
  }

  // メニューセクション削除
  const handleDeleteMenu = async (menuId: string) => {
    const menu = menuSections.find(m => m.id === menuId)
    if (!menu) return

    const foldersInSection = folders.filter(f => f.menuSection === menuId)
    const message = foldersInSection.length > 0
      ? `メニュー「${menu.name}」と配下のフォルダをすべて削除してもよろしいですか?\n(ドキュメントは削除されません)`
      : `メニュー「${menu.name}」を削除してもよろしいですか?`

    if (confirm(message)) {
      try {
        // 配下のフォルダを削除
        for (const folder of foldersInSection) {
          await deleteFolder(folder.id)
        }

        // メニューセクションを削除
        await deleteSection(menuId)

        setExpandedFolders(prev => {
          const newSet = new Set(prev)
          newSet.delete(menuId)
          return newSet
        })
      } catch (error) {
        console.error('メニュー削除エラー:', error)
        alert('メニューの削除に失敗しました')
      }
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
  const executeAddFolder = async () => {
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
        f => f.parentId === null && f.name === trimmedName && f.menuSection === currentMenuSection
      )
      if (rootFoldersWithSameName.length > 0) {
        alert('同じ階層に同じ名前のフォルダが既に存在します')
        return
      }
    }

    try {
      const parentFolder = currentParentId ? folders.find(f => f.id === currentParentId) : null
      const path = parentFolder ? `${parentFolder.path}/${trimmedName}` : `/${trimmedName}`

      // メニューセクションのGUIDを取得
      // 'all-docs'の場合はnullまたはデフォルトメニューセクションを使用
      let menuSectionId: string | undefined = undefined
      if (currentMenuSection !== 'all-docs') {
        const menuSection = menuSections.find(m => m.id === currentMenuSection)
        menuSectionId = menuSection?.id
      } else {
        // デフォルトメニューセクションを使用
        const defaultSection = menuSections.find(m => m.isDefault)
        menuSectionId = defaultSection?.id
      }

      if (!menuSectionId) {
        alert('メニューセクションが見つかりません。先にメニューセクションを作成してください。')
        return
      }

      await createFolder({
        name: trimmedName,
        description: folderDescription,
        color: folderColor,
        parentId: currentParentId || null,
        path: path,
        menuSection: menuSectionId,
      })

      // 親フォルダを展開
      if (currentParentId) {
        setExpandedFolders(prev => new Set([...prev, currentParentId]))
      }

      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('フォルダ追加エラー:', error)
      alert('フォルダの追加に失敗しました')
    }
  }

  // フォルダ編集ハンドラー
  const handleEditFolder = (folder: FolderTreeNode) => {
    setEditingFolder(folder)
    setFolderName(folder.folder.name)
    setFolderDescription(folder.folder.description || '')
    setFolderColor(folder.folder.color || '#3b82f6')
    setIsEditDialogOpen(true)
  }

  // フォルダ編集実行
  const executeEditFolder = async () => {
    if (!editingFolder || !folderName.trim()) {
      alert('フォルダ名を入力してください')
      return
    }

    // 重複チェック(自分自身は除外)
    const trimmedName = folderName.trim()
    const currentFolder = folders.find(f => f.id === editingFolder.folder.id)
    if (currentFolder) {
      if (currentFolder.parentId) {
        // サブフォルダの場合: 同じ親内で重複チェック
        const siblingsWithSameName = folders.filter(
          f => f.parentId === currentFolder.parentId &&
            f.name === trimmedName &&
            f.id !== editingFolder.folder.id
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
            f.id !== editingFolder.folder.id
        )
        if (rootFoldersWithSameName.length > 0) {
          alert('同じ階層に同じ名前のフォルダが既に存在します')
          return
        }
      }
    }

    try {
      const oldPath = editingFolder.folder.path
      const parentPath = oldPath.split('/').slice(0, -1).join('/')
      const newPath = parentPath ? `${parentPath}/${trimmedName}` : `/${trimmedName}`

      await updateFolder(editingFolder.folder.id, {
        name: trimmedName,
        description: folderDescription,
        color: folderColor,
        path: newPath,
      })

      setIsEditDialogOpen(false)
      console.log('フォルダを編集:', { id: editingFolder.folder.id, name: folderName })
    } catch (error) {
      console.error('フォルダ更新エラー:', error)
      alert('フォルダの更新に失敗しました')
    }
  }

  // フォルダ削除ハンドラー
  const handleDeleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return

    const hasChildren = folders.some(f => f.parentId === folderId)
    const message = hasChildren
      ? `フォルダ「${folder.name}」とその配下のサブフォルダをすべて削除してもよろしいですか?\n(ドキュメントは削除されません)`
      : `フォルダ「${folder.name}」を削除してもよろしいですか?\n(ドキュメントは削除されません)`

    if (confirm(message)) {
      try {
        // 削除対象のフォルダID一覧を取得(再帰的に)
        const getFolderIdsToDelete = (id: string): string[] => {
          const childIds = folders.filter(f => f.parentId === id).map(f => f.id)
          return [id, ...childIds.flatMap(getFolderIdsToDelete)]
        }

        const idsToDelete = getFolderIdsToDelete(folderId)

        // 子フォルダから順に削除
        for (const id of idsToDelete.reverse()) {
          await deleteFolder(id)
        }

        // 選択中のフォルダが削除された場合、トップページに戻る
        if (idsToDelete.includes(selectedFolderId || '')) {
          navigate('/ocr')
        }

        console.log('フォルダを削除:', idsToDelete)
      } catch (error) {
        console.error('フォルダ削除エラー:', error)
        alert('フォルダの削除に失敗しました')
      }
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

        {/* Navigation - ナビゲーション */}
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
                <div className="flex items-center gap-2 group w-full">
                  <div className="flex items-center flex-1 min-w-0 group/btn">
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
                        flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 min-w-0
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
                      {!sidebarCollapsed && <span className="flex-1 text-left truncate">{section.name}</span>}
                    </button>
                    {!sidebarCollapsed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddFolder(undefined, section.id)
                        }}
                        className="opacity-0 group-hover/btn:opacity-100 hover:bg-muted rounded p-1 transition-opacity flex-shrink-0"
                        title="ルートフォルダを追加"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-1 transition-opacity flex-shrink-0"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しいフォルダを作成</DialogTitle>
            <DialogDescription>
              {currentParentId
                ? 'サブフォルダを作成します'
                : '新しいルートフォルダを作成します'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">フォルダ名</Label>
              <Input
                id="folder-name"
                placeholder="例: 請求書"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeAddFolder()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-desc">説明 (任意)</Label>
              <Input
                id="folder-desc"
                placeholder="フォルダの説明"
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-color">カラー</Label>
              <div className="flex gap-2">
                <Input
                  id="folder-color"
                  type="color"
                  value={folderColor}
                  onChange={(e) => setFolderColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={folderColor}
                  onChange={(e) => setFolderColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={executeAddFolder}>
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* フォルダ編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フォルダを編集</DialogTitle>
            <DialogDescription>
              フォルダの設定を変更します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">フォルダ名</Label>
              <Input
                id="edit-folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeEditFolder()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-folder-desc">説明 (任意)</Label>
              <Input
                id="edit-folder-desc"
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-folder-color">カラー</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-folder-color"
                  type="color"
                  value={folderColor}
                  onChange={(e) => setFolderColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={folderColor}
                  onChange={(e) => setFolderColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
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
