import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { getAllEvents, ensureWatches } from '@/lib/api-client'
import type { CalendarEvent } from '@/lib/api-client'
import Sidebar from '@/components/layout/Sidebar'
import CalendarComponent from '@/components/calendar/Calendar'
import { useDarkMode } from '@/contexts/DarkModeContext'

import EmailLayout from '@/components/email/EmailLayout'
import { Documents } from '@/components/documents/Documents'
import { Tasks } from '@/components/tasks'

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

  // Update document title based on current view
  useEffect(() => {
    const viewTitles: Record<ViewType, string> = {
      calendar: 'Core - Calendar',
      email: 'Core - Email',
      tasks: 'Core - Tasks',
      docs: 'Core - Docs'
    }
    document.title = viewTitles[currentView]
  }, [currentView])

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

      // Load from cache immediately if available
      const cached = eventCache.current[authUser.id]
      if (cached) {
        console.log('⚡ Loading from cache instantly')
        setEvents(cached.events)
        setLastSynced(new Date(cached.timestamp))
      }

      // Stop showing loading state
      setLoading(false)

      // Fetch fresh data in background (non-blocking)
      fetchEvents(authUser.id, false).catch(err => {
        console.warn('Background fetch failed:', err)
      })

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
    }

    checkAuth()
  }, [navigate])

  const fetchEvents = async (userId: string, forceRefresh = false) => {
    const now = Date.now()
    const cached = eventCache.current[userId]

    // Skip fetch if cache is still fresh (unless force refresh)
    if (!forceRefresh && cached && (now - cached.timestamp < CACHE_DURATION)) {
      console.log('📦 Cache still fresh, skipping API call')
      return
    }

    try {
      console.log('🔄 Fetching fresh data from API...')
      const response = await getAllEvents(userId)
      
      const newEvents = response.events || []
      
      // Only update UI if data actually changed
      const hasChanges = JSON.stringify(newEvents) !== JSON.stringify(cached?.events || [])
      if (hasChanges || !cached) {
        console.log('✨ Updated with', newEvents.length, 'events', response.source ? `(source: ${response.source})` : '')
        setEvents(newEvents)
      } else {
        console.log('✓ Data unchanged')
      }
      
      setLastSynced(new Date())
      
      // Update cache
      eventCache.current[userId] = {
        events: newEvents,
        timestamp: now
      }
    } catch (err: any) {
      console.error('❌ Error fetching events:', err)
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
        return <Tasks />
      case 'docs':
        return <Documents />
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


