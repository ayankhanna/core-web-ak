/**
 * Google Drive style folder tree sidebar
 */
import { useState } from 'react'
import {
  FiFolder,
  FiFolderPlus,
  FiFile,
  FiChevronRight,
  FiChevronDown,
  FiStar,
  FiClock,
  FiPlus,
} from 'react-icons/fi'
import type { Document } from './types'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { ContextMenu } from './ContextMenu'

type FolderTreeProps = {
  documents: Document[]
  folders: Document[]
  selectedId: string | null
  currentFolderId: string | null
  onSelectDocument: (id: string) => void
  onSelectFolder: (id: string | null) => void
  onCreateDocument: (folderId?: string) => void
  onCreateFolder: (parentId?: string) => void
  onRename: (id: string, currentName: string) => void
  onDelete: (id: string, isFolder: boolean) => void
  onToggleFavorite: (id: string) => void
  onArchive: (id: string) => void
  recentDocs: Document[]
  favoriteDocs: Document[]
  expandedFolders: Set<string>
  onToggleFolder: (folderId: string) => void
}

type FolderTreeInternalProps = FolderTreeProps & {
  expandedFolders: Set<string>
  onToggleFolder: (folderId: string) => void
}

export function FolderTree({
  documents,
  folders,
  selectedId,
  currentFolderId,
  onSelectDocument,
  onSelectFolder,
  onCreateDocument,
  onCreateFolder,
  onRename,
  onDelete,
  onToggleFavorite,
  onArchive,
  recentDocs,
  favoriteDocs,
  expandedFolders: externalExpandedFolders,
  onToggleFolder: externalOnToggleFolder,
}: FolderTreeInternalProps) {
  const { isDarkMode } = useDarkMode()
  const [expandRecents, setExpandRecents] = useState(false)
  const [expandFavorites, setExpandFavorites] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    item: Document
  } | null>(null)
  
  const expandedFolders = externalExpandedFolders
  const toggleFolder = externalOnToggleFolder


  const buildTree = (parentId: string | null = null): Document[] => {
    return folders
      .filter(f => f.parent_id === parentId)
      .sort((a, b) => a.position - b.position)
  }

  const getDocsInFolder = (folderId: string | null): Document[] => {
    return documents
      .filter(d => d.parent_id === folderId)
      .sort((a, b) => a.position - b.position)
  }

  const renderFolder = (folder: Document, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const childFolders = buildTree(folder.id)
    const childDocs = getDocsInFolder(folder.id)
    const hasChildren = childFolders.length > 0 || childDocs.length > 0

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
            currentFolderId === folder.id ? 'bg-gray-200 dark:bg-gray-700' : ''
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => {
            onSelectFolder(folder.id)
            if (hasChildren) toggleFolder(folder.id)
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            setContextMenu({ x: e.clientX, y: e.clientY, item: folder })
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folder.id)
              }}
              className="p-0.5"
            >
              {isExpanded ? (
                <FiChevronDown className="w-3 h-3" />
              ) : (
                <FiChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          <FiFolder className="w-4 h-4 text-blue-500" />
          <span className="flex-1 text-sm truncate">{folder.title}</span>
        </div>

        {isExpanded && (
          <div>
            {childFolders.map(child => renderFolder(child, level + 1))}
            {childDocs.map(doc => renderDocument(doc, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderDocument = (doc: Document, level: number = 0) => {
    return (
      <div
        key={doc.id}
        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
          selectedId === doc.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${level * 12 + 20}px` }}
        onClick={() => onSelectDocument(doc.id)}
        onContextMenu={(e) => {
          e.preventDefault()
          setContextMenu({ x: e.clientX, y: e.clientY, item: doc })
        }}
      >
        {doc.icon ? (
          <span className="text-sm">{doc.icon}</span>
        ) : (
          <FiFile className="w-4 h-4 text-gray-400" />
        )}
        <span className="flex-1 text-sm truncate">{doc.title}</span>
        {doc.is_favorite && <FiStar className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
      </div>
    )
  }

  const rootFolders = buildTree(null)
  const rootDocs = getDocsInFolder(currentFolderId)

  return (
    <div
      className={`w-64 h-full border-r flex flex-col ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Documents</h2>
          <div className="flex gap-1">
            <button
              onClick={() => onCreateFolder()}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="New Folder"
            >
              <FiFolderPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onCreateDocument()}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="New Document"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Access */}
        <div className="space-y-1">
          {/* Recents Dropdown */}
          <div>
            <button
              onClick={() => setExpandRecents(!expandRecents)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {expandRecents ? (
                <FiChevronDown className="w-3 h-3" />
              ) : (
                <FiChevronRight className="w-3 h-3" />
              )}
              <FiClock className="w-4 h-4" />
              <span>Recent</span>
            </button>
            {expandRecents && (
              <div className="ml-4 mt-1 space-y-0.5">
                {recentDocs.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-sm ${
                      selectedId === doc.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => onSelectDocument(doc.id)}
                  >
                    {doc.icon || <FiFile className="w-3 h-3 text-gray-400" />}
                    <span className="truncate text-xs">{doc.title}</span>
                  </div>
                ))}
                {recentDocs.length === 0 && (
                  <div className="px-2 py-1 text-xs text-gray-500">No recent documents</div>
                )}
              </div>
            )}
          </div>

          {/* Favorites Dropdown */}
          <div>
            <button
              onClick={() => setExpandFavorites(!expandFavorites)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {expandFavorites ? (
                <FiChevronDown className="w-3 h-3" />
              ) : (
                <FiChevronRight className="w-3 h-3" />
              )}
              <FiStar className="w-4 h-4" />
              <span>Favorites</span>
            </button>
            {expandFavorites && (
              <div className="ml-4 mt-1 space-y-0.5">
                {favoriteDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-sm ${
                      selectedId === doc.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => onSelectDocument(doc.id)}
                  >
                    {doc.icon || <FiFile className="w-3 h-3 text-gray-400" />}
                    <span className="truncate text-xs">{doc.title}</span>
                  </div>
                ))}
                {favoriteDocs.length === 0 && (
                  <div className="px-2 py-1 text-xs text-gray-500">No favorites</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 mb-2 ${
            currentFolderId === null ? 'bg-gray-200 dark:bg-gray-700' : ''
          }`}
          onClick={() => onSelectFolder(null)}
        >
          <FiFolder className="w-4 h-4 text-blue-500" />
          <span className="flex-1 text-sm font-medium">My Documents</span>
        </div>

        {rootFolders.map(folder => renderFolder(folder))}
        
        {currentFolderId === null && rootDocs.map(doc => renderDocument(doc))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRename={() => onRename(contextMenu.item.id, contextMenu.item.title)}
          onDelete={() => onDelete(contextMenu.item.id, contextMenu.item.is_folder)}
          onToggleFavorite={() => onToggleFavorite(contextMenu.item.id)}
          onArchive={() => onArchive(contextMenu.item.id)}
          isFavorite={contextMenu.item.is_favorite}
          isFolder={contextMenu.item.is_folder}
        />
      )}
    </div>
  )
}

