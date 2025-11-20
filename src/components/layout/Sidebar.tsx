import { useState } from 'react'
import { 
  MdCalendarToday, 
  MdEmail, 
  MdTask, 
  MdFolder,
  MdLogout,
  MdLightMode,
  MdDarkMode
} from 'react-icons/md'
import { useDarkMode } from '@/contexts/DarkModeContext'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

type ViewType = 'calendar' | 'email' | 'tasks' | 'docs'

interface SidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems: Array<{ id: ViewType; icon: typeof MdCalendarToday; label: string; active: boolean }> = [
    { id: 'calendar', icon: MdCalendarToday, label: 'Calendar', active: true },
    { id: 'email', icon: MdEmail, label: 'Email', active: true },
    { id: 'tasks', icon: MdTask, label: 'Tasks', active: false },
    { id: 'docs', icon: MdFolder, label: 'Documents', active: false },
  ]

  return (
    <div 
      className="fixed left-0 top-0 h-screen flex flex-col items-center py-4 transition-colors duration-200 z-50"
      style={{
        width: '72px',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)'
      }}
    >
      {/* Logo / Brand */}
      <div className="mb-8 flex items-center justify-center">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-colors"
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
          }}
        >
          10x
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-2 w-full px-2">
        {navItems.map(({ id, icon: Icon, label, active }) => (
          <button
            key={id}
            onClick={() => active && onViewChange(id)}
            disabled={!active}
            className={`
              w-full h-14 rounded-xl flex items-center justify-center
              transition-all duration-200 relative group
              ${active ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}
            `}
            style={{
              backgroundColor: currentView === id && active 
                ? 'var(--sidebar-bg-active)' 
                : 'transparent',
              color: 'var(--sidebar-icon)'
            }}
            title={label}
          >
            <Icon size={24} />
            
            {/* Hover Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {label}
            </div>
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-2 w-full px-2">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full h-14 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          style={{ color: 'var(--sidebar-icon)' }}
          title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {isDarkMode ? <MdLightMode size={24} /> : <MdDarkMode size={24} />}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full h-14 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
          style={{ color: isDarkMode ? '#ef4444' : '#dc2626' }}
          title="Logout"
        >
          <MdLogout size={24} />
        </button>
      </div>
    </div>
  )
}

