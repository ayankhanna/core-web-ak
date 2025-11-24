/**
 * Documents Main Component - Rebuilt with Notion-style editor and folder structure
 */
import { useState, useEffect, useCallback } from 'react'
import { FolderTree } from './FolderTree'
import { SimpleEditor } from './SimpleEditor'
import type { Document } from './types'
import {
  getDocuments,
  getDocument,
  createDocument,
  createFolder,
  updateDocument,
  deleteDocument,
  archiveDocument,
  favoriteDocument,
  unfavoriteDocument,
} from '../../lib/api-client'
import { supabase } from '../../lib/supabase'
import {
  FiStar,
  FiTrash2,
  FiArchive,
  FiMoreVertical,
} from 'react-icons/fi'
import { useDarkMode } from '../../contexts/DarkModeContext'

export function Documents() {
  const { isDarkMode } = useDarkMode()
  const [allItems, setAllItems] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Get user ID and restore cache immediately
  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        // Restore from cache IMMEDIATELY (optimistic)
        const cachedData = localStorage.getItem(`docsCache_${user.id}`)
        if (cachedData) {
          try {
            const { allItems, selectedDocumentId, selectedDocument, currentFolderId, expandedFolders } = JSON.parse(cachedData)
            setAllItems(allItems || [])
            setSelectedDocumentId(selectedDocumentId || null)
            setSelectedDocument(selectedDocument || null)
            setCurrentFolderId(currentFolderId || null)
            setExpandedFolders(new Set(expandedFolders || []))
            setLoading(false) // Stop loading immediately
          } catch (e) {
            console.error('Failed to parse cache:', e)
          }
        }
      }
    }
    getUserId()
  }, [])

  // Load all items (folders and documents)
  const loadAllItems = useCallback(async (options?: { favorites_only?: boolean }) => {
    if (!userId) return

    try {
      setLoading(true)
      const response = await getDocuments(userId, options)
      setAllItems(response.documents || [])
    } catch (error) {
      console.error('Failed to load items:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Load items in background (after cache is shown)
  useEffect(() => {
    if (userId) {
      // Fetch fresh data in background
      loadAllItems()
    }
  }, [userId, loadAllItems])
  
  // Save to cache whenever state changes
  useEffect(() => {
    if (userId && allItems.length > 0) {
      const cacheData = {
        allItems,
        selectedDocumentId,
        selectedDocument,
        currentFolderId,
        expandedFolders: Array.from(expandedFolders),
      }
      localStorage.setItem(`docsCache_${userId}`, JSON.stringify(cacheData))
    }
  }, [userId, allItems, selectedDocumentId, selectedDocument, currentFolderId, expandedFolders])

  // Load selected document
  useEffect(() => {
    if (!userId || !selectedDocumentId) return

    const loadDocument = async () => {
      try {
        const doc = await getDocument(userId, selectedDocumentId)
        // Don't load if it's a folder
        if (!doc.is_folder) {
          setSelectedDocument(doc)
        }
      } catch (error) {
        console.error('Failed to load document:', error)
      }
    }

    loadDocument()
  }, [userId, selectedDocumentId])

  // Handle document selection
  const handleSelectDocument = useCallback((documentId: string) => {
    const item = allItems.find(i => i.id === documentId)
    if (item && !item.is_folder) {
      setSelectedDocumentId(documentId)
    }
  }, [allItems])

  // Handle folder selection
  const handleSelectFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId)
    setSelectedDocumentId(null)
    setSelectedDocument(null)
  }, [])

  // Handle create document
  const handleCreateDocument = useCallback(async (folderId?: string) => {
    if (!userId) return

    try {
      const newDoc = await createDocument(userId, {
        title: 'Untitled',
        content: '',
        parent_id: folderId || currentFolderId || undefined,
      })
      setAllItems((prev) => [newDoc, ...prev])
      setSelectedDocumentId(newDoc.id)
      setSelectedDocument(newDoc)
    } catch (error) {
      console.error('Failed to create document:', error)
      alert('Failed to create document')
    }
  }, [userId, currentFolderId])

  // Handle create folder
  const handleCreateFolder = useCallback(async (parentId?: string) => {
    if (!userId) return

    try {
      const title = prompt('Folder name:', 'New Folder')
      if (!title) return

      const newFolder = await createFolder(userId, {
        title,
        parent_id: parentId || currentFolderId || undefined,
      })
      setAllItems((prev) => [newFolder, ...prev])
    } catch (error) {
      console.error('Failed to create folder:', error)
      alert('Failed to create folder')
    }
  }, [userId, currentFolderId])

  // Handle update document content
  const handleUpdateContent = useCallback(
    async (content: string) => {
      if (!userId || !selectedDocumentId || !selectedDocument) return

      try {
        const updated = await updateDocument(userId, selectedDocumentId, { content })
        setSelectedDocument(updated)
        setAllItems((prev) =>
          prev.map((item) => (item.id === selectedDocumentId ? updated : item))
        )
        setLastSaved(new Date())
      } catch (error) {
        console.error('Failed to update content:', error)
      }
    },
    [userId, selectedDocumentId, selectedDocument]
  )

  // Handle update title
  const handleUpdateTitle = useCallback(
    async (title: string) => {
      if (!userId || !selectedDocumentId) return

      try {
        const updated = await updateDocument(userId, selectedDocumentId, { title })
        setSelectedDocument(updated)
        setAllItems((prev) =>
          prev.map((item) => (item.id === selectedDocumentId ? updated : item))
        )
      } catch (error) {
        console.error('Failed to update title:', error)
      }
    },
    [userId, selectedDocumentId]
  )

  // Handle update icon
  const handleUpdateIcon = useCallback(
    async (icon: string) => {
      if (!userId || !selectedDocumentId) return

      try {
        const updated = await updateDocument(userId, selectedDocumentId, { icon })
        setSelectedDocument(updated)
        setAllItems((prev) =>
          prev.map((item) => (item.id === selectedDocumentId ? updated : item))
        )
      } catch (error) {
        console.error('Failed to update icon:', error)
      }
    },
    [userId, selectedDocumentId]
  )

  // Handle archive document
  const handleArchiveDocument = useCallback(async () => {
    if (!userId || !selectedDocumentId) return

    try {
      await archiveDocument(userId, selectedDocumentId)
      setAllItems((prev) => prev.filter((item) => item.id !== selectedDocumentId))
      setSelectedDocumentId(null)
      setSelectedDocument(null)
    } catch (error) {
      console.error('Failed to archive document:', error)
      alert('Failed to archive document')
    }
  }, [userId, selectedDocumentId])

  // Handle delete document
  const handleDeleteDocument = useCallback(async () => {
    if (!userId || !selectedDocumentId) return

    try {
      await deleteDocument(userId, selectedDocumentId)
      setAllItems((prev) => prev.filter((item) => item.id !== selectedDocumentId))
      setSelectedDocumentId(null)
      setSelectedDocument(null)
    } catch (error) {
      console.error('Failed to delete document:', error)
      alert('Failed to delete document')
    }
  }, [userId, selectedDocumentId])

  // Handle toggle favorite
  const handleToggleFavorite = useCallback(async () => {
    if (!userId || !selectedDocumentId || !selectedDocument) return

    try {
      if (selectedDocument.is_favorite) {
        const updated = await unfavoriteDocument(userId, selectedDocumentId)
        setSelectedDocument(updated)
        setAllItems((prev) =>
          prev.map((item) => (item.id === selectedDocumentId ? updated : item))
        )
      } else {
        const updated = await favoriteDocument(userId, selectedDocumentId)
        setSelectedDocument(updated)
        setAllItems((prev) =>
          prev.map((item) => (item.id === selectedDocumentId ? updated : item))
        )
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }, [userId, selectedDocumentId, selectedDocument])

  // Handle rename
  const handleRename = useCallback(async (id: string, currentName: string) => {
    if (!userId) return
    
    const newName = prompt('Rename:', currentName)
    if (!newName || newName === currentName) return

    try {
      const updated = await updateDocument(userId, id, { title: newName })
      setAllItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
    } catch (error) {
      console.error('Failed to rename:', error)
      alert('Failed to rename')
    }
  }, [userId])

  // Handle context menu delete
  const handleContextDelete = useCallback(async (id: string, isFolder: boolean) => {
    if (!userId) return

    const confirmMsg = isFolder 
      ? 'Delete this folder and all its contents? This cannot be undone.'
      : 'Delete this document? This cannot be undone.'
    
    if (!confirm(confirmMsg)) return

    try {
      await deleteDocument(userId, id)
      setAllItems((prev) => prev.filter((item) => item.id !== id))
      if (selectedDocumentId === id) {
        setSelectedDocumentId(null)
        setSelectedDocument(null)
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete')
    }
  }, [userId, selectedDocumentId])

  // Handle context menu toggle favorite
  const handleContextToggleFavorite = useCallback(async (id: string) => {
    if (!userId) return

    try {
      const item = allItems.find(i => i.id === id)
      if (!item) return

      const updated = item.is_favorite
        ? await unfavoriteDocument(userId, id)
        : await favoriteDocument(userId, id)
      
      setAllItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
      if (selectedDocumentId === id) {
        setSelectedDocument(updated)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }, [userId, allItems, selectedDocumentId])

  // Handle context menu archive
  const handleContextArchive = useCallback(async (id: string) => {
    if (!userId) return

    try {
      await archiveDocument(userId, id)
      setAllItems((prev) => prev.filter((item) => item.id !== id))
      if (selectedDocumentId === id) {
        setSelectedDocumentId(null)
        setSelectedDocument(null)
      }
    } catch (error) {
      console.error('Failed to archive:', error)
      alert('Failed to archive')
    }
  }, [userId, selectedDocumentId])

  // Handle toggle folder - MUST be before any returns!
  const handleToggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  if (loading && !userId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    )
  }

  const folders = allItems.filter((item) => item.is_folder)
  const documents = allItems.filter((item) => !item.is_folder)
  const recentDocs = documents
    .filter(d => d.last_opened_at)
    .sort((a, b) => {
      if (!a.last_opened_at) return 1
      if (!b.last_opened_at) return -1
      return new Date(b.last_opened_at).getTime() - new Date(a.last_opened_at).getTime()
    })
  const favoriteDocs = documents.filter(d => d.is_favorite)

  return (
    <div className="flex h-full bg-[var(--bg-primary)]">
      <FolderTree
        documents={documents}
        folders={folders}
        selectedId={selectedDocumentId}
        currentFolderId={currentFolderId}
        onSelectDocument={handleSelectDocument}
        onSelectFolder={handleSelectFolder}
        onCreateDocument={handleCreateDocument}
        onCreateFolder={handleCreateFolder}
        onRename={handleRename}
        onDelete={handleContextDelete}
        onToggleFavorite={handleContextToggleFavorite}
        onArchive={handleContextArchive}
        recentDocs={recentDocs}
        favoriteDocs={favoriteDocs}
        expandedFolders={expandedFolders}
        onToggleFolder={handleToggleFolder}
      />

      {/* Editor Area */}
      {selectedDocument ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-gray-500">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                  selectedDocument.is_favorite ? 'text-yellow-500' : ''
                }`}
                title={selectedDocument.is_favorite ? 'Unfavorite' : 'Favorite'}
              >
                <FiStar
                  className={`w-5 h-5 ${
                    selectedDocument.is_favorite ? 'fill-yellow-500' : ''
                  }`}
                />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiMoreVertical className="w-5 h-5" />
                </button>

                {showMenu && (
                  <div
                    className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    } border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <button
                      onClick={() => {
                        handleArchiveDocument()
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FiArchive className="w-4 h-4" />
                      <span>Archive</span>
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            'Are you sure you want to delete this document? This cannot be undone.'
                          )
                        ) {
                          handleDeleteDocument()
                          setShowMenu(false)
                        }
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-16 py-8">
              {/* Icon */}
              <button
                onClick={() => {
                  const emoji = prompt('Enter an emoji:', selectedDocument.icon || '')
                  if (emoji !== null) {
                    handleUpdateIcon(emoji || '📄')
                  }
                }}
                className="mb-4 text-6xl hover:opacity-80 transition-opacity"
                title="Click to change icon"
              >
                {selectedDocument.icon || '📄'}
              </button>

              {/* Title */}
              <input
                type="text"
                value={selectedDocument.title}
                onChange={(e) => {
                  setSelectedDocument((prev) => prev ? { ...prev, title: e.target.value } : null)
                }}
                onBlur={(e) => handleUpdateTitle(e.target.value)}
                placeholder="Untitled"
                className={`w-full text-4xl font-bold mb-8 bg-transparent border-none outline-none p-0 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              />

              {/* Simple Editor */}
              <SimpleEditor
                initialContent={selectedDocument.content}
                onChange={handleUpdateContent}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-lg">Select a document to start editing</p>
            <p className="text-sm text-gray-400 mt-2">or create a new one</p>
          </div>
        </div>
      )}
    </div>
  )
}
