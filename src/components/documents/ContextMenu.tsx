/**
 * Context Menu for documents and folders
 */
import { useEffect, useRef } from 'react'
import { FiEdit2, FiTrash2, FiStar, FiArchive } from 'react-icons/fi'
import { useDarkMode } from '../../contexts/DarkModeContext'

type ContextMenuProps = {
  x: number
  y: number
  onClose: () => void
  onRename: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  onArchive: () => void
  isFavorite: boolean
  isFolder: boolean
}

export function ContextMenu({
  x,
  y,
  onClose,
  onRename,
  onDelete,
  onToggleFavorite,
  onArchive,
  isFavorite,
  isFolder,
}: ContextMenuProps) {
  const { isDarkMode } = useDarkMode()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 w-48 rounded-md shadow-lg py-1 ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <button
        onClick={() => {
          onRename()
          onClose()
        }}
        className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}
      >
        <FiEdit2 className="w-4 h-4" />
        <span>Rename</span>
      </button>

      <button
        onClick={() => {
          onToggleFavorite()
          onClose()
        }}
        className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}
      >
        <FiStar className={`w-4 h-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
        <span>{isFavorite ? 'Unfavorite' : 'Favorite'}</span>
      </button>

      {!isFolder && (
        <button
          onClick={() => {
            onArchive()
            onClose()
          }}
          className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          <FiArchive className="w-4 h-4" />
          <span>Archive</span>
        </button>
      )}

      <div className={`my-1 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

      <button
        onClick={() => {
          onDelete()
          onClose()
        }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
      >
        <FiTrash2 className="w-4 h-4" />
        <span>Delete</span>
      </button>
    </div>
  )
}

