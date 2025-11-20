import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { getAllEvents, ensureWatches } from '@/lib/api-client'
import type { CalendarEvent } from '@/lib/api-client'
import Sidebar from '@/components/layout/Sidebar'
import CalendarComponent from '@/components/calendar/Calendar'
import PlaceholderView from '@/components/PlaceholderView'
import { useDarkMode } from '@/contexts/DarkModeContext'

import EmailLayout from '@/components/email/EmailLayout'

type User = {
  id: string
  email: string
  name: string | null
}

type ViewType = 'calendar' | 'email' | 'tasks' | 'docs'

export default function Dashboard() {
  const navigate = useNavigate()
  const { isDarkMode } = useDarkMode()
  const [user, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<ViewType>('calendar')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  // Simple in-memory cache
  const eventCache = useRef<{ [key: string]: { events: CalendarEvent[], timestamp: number } }>({})
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        navigate('/login')
        return
      }

      // Get user profile
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', authUser.id)
        .single()

      if (userData) {
        setUser(userData)
      }

      // Ensure watch subscriptions are active (runs in background)
      ensureWatches(authUser.id)
        .then(watchResult => {
          console.log('🔔 Watch subscriptions verified:', watchResult.status)
          if (watchResult.status === 'all_active' || watchResult.status === 'setup_completed') {
            console.log('✅ Real-time sync active')
          }
        })
        .catch(err => {
          console.warn('⚠️ Watch check failed (non-critical):', err.message)
        })

      // Initial fetch with cache check
      await fetchEvents(authUser.id)

      setLoading(false)
    }

    checkAuth()
  }, [navigate])

  const fetchEvents = async (userId: string, forceRefresh = false) => {
    const now = Date.now()
    const cached = eventCache.current[userId]

    if (!forceRefresh && cached && (now - cached.timestamp < CACHE_DURATION)) {
      console.log('📦 Using cached events')
      setEvents(cached.events)
      setLastSynced(new Date(cached.timestamp))
      return
    }

    try {
      console.log('🌍 Fetching events from API...')
      const response = await getAllEvents(userId)
      console.log('📅 API Response:', response)
      console.log('📅 Events count:', response.events?.length || 0)
      
      const newEvents = response.events || []
      setEvents(newEvents)
      setLastSynced(new Date())
      
      // Update cache
      eventCache.current[userId] = {
        events: newEvents,
        timestamp: now
      }
    } catch (err: any) {
      console.error('Error fetching events:', err)
    }
  }

  const refreshEvents = async () => {
    if (!user) return
    await fetchEvents(user.id, true)
  }

  const renderView = () => {
    switch (currentView) {
      case 'calendar':
        return (
          <CalendarComponent
            events={events}
            userId={user?.id || ''}
            onRefresh={refreshEvents}
          />
        )
      case 'email':
        return user ? <EmailLayout userId={user.id} /> : null
      case 'tasks':
        return (
          <PlaceholderView
            title="Tasks"
            description="Organize and track your tasks with ease."
          />
        )
      case 'docs':
        return (
          <PlaceholderView
            title="Documents"
            description="Store and manage your documents in one place."
          />
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-200"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
            style={{ borderColor: isDarkMode ? '#ffffff' : '#000000' }}
          ></div>
          <p 
            className="mt-4 transition-colors duration-200"
            style={{ color: 'var(--text-secondary)' }}
          >
            Loading...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="h-screen flex overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Sidebar */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative" style={{ marginLeft: '72px' }}>
        {renderView()}
        
        {/* Last Synced Indicator */}
        {currentView === 'calendar' && lastSynced && (
          <div className="absolute bottom-4 right-6 text-[10px] text-[var(--text-tertiary)] font-mono opacity-60 pointer-events-none select-none bg-[var(--bg-primary)]/80 px-2 py-1 rounded backdrop-blur-sm border border-[var(--border-color)]">
            Last synced: {format(lastSynced, 'h:mm a')}
          </div>
        )}
      </main>
    </div>
  )
}


