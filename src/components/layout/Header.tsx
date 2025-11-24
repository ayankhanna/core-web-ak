import { useState, useRef, useEffect } from 'react'
import { MdMenu, MdChat, MdMail, MdCalendarToday, MdCheckBox, MdDescription, MdLogout, MdLightMode, MdDarkMode } from 'react-icons/md'
import { useDarkMode } from '@/contexts/DarkModeContext'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

type ViewType = 'chat' | 'email' | 'calendar' | 'tasks' | 'docs'

interface HeaderProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

export default function Header({ currentView, onViewChange }: HeaderProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  return (
    <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#212121]/80 backdrop-blur-sm">
      <div className="w-full px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2f2f2f] rounded-lg transition-colors text-gray-600 dark:text-gray-400"
            >
              <MdMenu size={24} />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#2f2f2f] rounded-lg shadow-lg border border-[var(--border-color)] py-2 z-[100]">
                <button
                  onClick={() => {
                    toggleDarkMode()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors"
                >
                  {isDarkMode ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                
                <div className="my-1 border-t border-[var(--border-color)]" />
                
                <button
                  onClick={() => {
                    handleSignOut()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors"
                >
                  <MdLogout size={20} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2f2f2f] px-3 py-2 rounded-lg transition-colors text-gray-700 dark:text-gray-200">
            <span className="font-semibold text-lg">Core OS</span>
            <span className="text-gray-400 text-xs">›</span>
          </div>
        </div>
        
        <div className="flex items-center gap-8 text-gray-600 dark:text-gray-400">
          <button
            onClick={() => onViewChange('chat')}
            className={`hover:text-black dark:hover:text-white transition-colors ${
              currentView === 'chat' ? 'text-black dark:text-white' : ''
            }`}
            title="Chat"
          >
            <MdChat size={24} />
          </button>
          
          <button
            onClick={() => onViewChange('email')}
            className={`hover:text-black dark:hover:text-white transition-colors relative ${
              currentView === 'email' ? 'text-black dark:text-white' : ''
            }`}
            title="Email"
          >
            <MdMail size={24} />
          </button>
          
          <button
            onClick={() => onViewChange('calendar')}
            className={`hover:text-black dark:hover:text-white transition-colors ${
              currentView === 'calendar' ? 'text-black dark:text-white' : ''
            }`}
            title="Calendar"
          >
            <MdCalendarToday size={24} />
          </button>
          
          <button
            onClick={() => onViewChange('tasks')}
            className={`hover:text-black dark:hover:text-white transition-colors ${
              currentView === 'tasks' ? 'text-black dark:text-white' : ''
            }`}
            title="Tasks"
          >
            <MdCheckBox size={24} />
          </button>
          
          <button
            onClick={() => onViewChange('docs')}
            className={`hover:text-black dark:hover:text-white transition-colors ${
              currentView === 'docs' ? 'text-black dark:text-white' : ''
            }`}
            title="Documents"
          >
            <MdDescription size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}

