import { useEffect, useState, useRef } from 'react'
import { fetchEmails, syncEmails } from '@/lib/api-client'
import type { Email } from '@/lib/api-client'
import EmailList from './EmailList'
import EmailDetail from './EmailDetail'
import { MdRefresh, MdSearch } from 'react-icons/md'

interface EmailLayoutProps {
  userId: string
}

// Cache outside component to persist across remounts
const emailCache: { [userId: string]: { emails: Email[], timestamp: number } } = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function EmailLayout({ userId }: EmailLayoutProps) {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [syncing, setSyncing] = useState<boolean>(false)
  const initialLoadDone = useRef(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncEmails(userId)
      // Force reload emails after sync (bypass cache)
      await loadEmails(true)
    } catch (error) {
      console.error('Error syncing emails:', error)
    } finally {
      setSyncing(false)
    }
  }

  const loadEmails = async (skipCacheCheck = false) => {
    const now = Date.now()
    const cached = emailCache[userId]

    // Use cache if available and fresh
    if (!skipCacheCheck && cached && (now - cached.timestamp < CACHE_DURATION)) {
      console.log('📦 Email cache still fresh, skipping fetch')
      return
    }

    try {
      console.log('🔄 Fetching fresh emails from API...')
      const response = await fetchEmails(userId)
      const newEmails = response.emails || []
      
      // Only update if changed
      const hasChanges = JSON.stringify(newEmails) !== JSON.stringify(cached?.emails || [])
      if (hasChanges || !cached) {
        console.log('✨ Updated with', newEmails.length, 'emails')
        setEmails(newEmails)
      } else {
        console.log('✓ Email data unchanged')
      }
      
      // Update cache
      emailCache[userId] = {
        emails: newEmails,
        timestamp: now
      }
      
      // Auto-trigger sync if no emails found (first time user)
      if (newEmails.length === 0 && !initialLoadDone.current) {
        console.log('📭 No emails in database, triggering initial sync...')
        handleSync()
      }
    } catch (error) {
      console.error('❌ Error loading emails:', error)
    }
  }

  useEffect(() => {
    // Load from cache instantly if available
    const cached = emailCache[userId]
    if (cached) {
      console.log('⚡ Loading emails from cache instantly')
      setEmails(cached.emails)
    }

    // Stop loading state immediately
    setLoading(false)
    initialLoadDone.current = true

    // Fetch fresh data in background
    loadEmails().catch(err => {
      console.warn('Background email fetch failed:', err)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Detail View
  if (selectedEmail) {
    return (
      <div className="h-full w-full absolute inset-0 bg-[var(--bg-primary)] z-10">
        <EmailDetail 
          email={selectedEmail} 
          userId={userId}
          onClose={() => setSelectedEmail(null)}
        />
      </div>
    )
  }

  // List View
  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] w-full">
      {/* Toolbar */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Inbox</h2>
        
        <div className="flex items-center gap-4">
          {/* Search Box */}
          <div className="relative w-64 hidden md:block">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)]" size={20} />
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full pl-10 pr-4 py-2 rounded-full bg-[var(--bg-secondary)] border-none text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
            />
          </div>

          <button 
            onClick={handleSync}
            disabled={syncing}
            className={`
              p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)]
              ${syncing ? 'animate-spin' : ''}
            `}
            title="Sync Emails"
          >
            <MdRefresh size={22} />
          </button>
        </div>
      </div>

      {(() => {
        // @ts-ignore - TypeScript incorrectly infers selectedEmail type
        const emailId: string | null = selectedEmail?.external_id ?? null
        return (
          <EmailList 
            emails={emails}
            selectedEmailId={emailId}
            onSelectEmail={(email: Email) => setSelectedEmail(email)}
            loading={loading}
          />
        )
      })()}
    </div>
  )
}
