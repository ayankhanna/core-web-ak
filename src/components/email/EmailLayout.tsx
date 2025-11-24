import { useEffect, useState, useRef } from 'react'
import { fetchEmails, syncEmails } from '@/lib/api-client'
import type { Email } from '@/lib/api-client'
import EmailList from './EmailList'
import EmailDetail from './EmailDetail'
import ComposeEmailModal from './ComposeEmailModal'
import { MdRefresh, MdSearch, MdEdit } from 'react-icons/md'

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
  const [activeInbox, setActiveInbox] = useState<'important' | 'other'>('important')
  const [showComposeModal, setShowComposeModal] = useState<boolean>(false)
  const initialLoadDone = useRef(false)

  const handleSync = async () => {
    console.log('🔵 handleSync called, userId:', userId)
    setSyncing(true)
    try {
      console.log('🔵 Calling syncEmails API...')
      const result = await syncEmails(userId)
      console.log('✅ Sync result:', result)
      // Force reload emails after sync (bypass cache)
      await loadEmails(true)
    } catch (error) {
      console.error('❌ Error syncing emails:', error)
      alert(`Sync failed: ${error}`)
    } finally {
      setSyncing(false)
      console.log('🔵 Sync completed')
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

  // Filter emails by importance
  const importantEmails = emails.filter(email => email.ai_important === true)
  const otherEmails = emails.filter(email => email.ai_important === false || email.ai_important === undefined || email.ai_important === null)
  
  const displayedEmails = activeInbox === 'important' ? importantEmails : otherEmails

  // Two-column Layout: Left Nav (always visible) | Email List OR Email Detail
  return (
    <>
      <div className="h-full flex bg-[var(--bg-primary)] w-full">
        {/* Left Sidebar - Email Categories - Always Visible */}
        <div className="w-56 border-r border-[var(--border-color)] flex flex-col py-4 flex-shrink-0">
          {/* Compose Button */}
          <div className="px-3 mb-6">
            <button
              onClick={() => setShowComposeModal(true)}
              className="
                w-full flex items-center gap-3 px-4 py-2.5
                text-[var(--text-secondary)] font-normal text-sm
                hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]
                transition-colors rounded-lg
              "
            >
              <MdEdit size={18} />
              <span>Compose</span>
            </button>
          </div>

          <div className="px-3 mb-2">
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 mb-2">
              Inbox
            </h3>
          </div>
        
        <nav className="flex-1 px-2 space-y-1">
          <button
            onClick={() => {
              setActiveInbox('important')
              setSelectedEmail(null) // Close detail when switching inbox
            }}
            className={`
              w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${activeInbox === 'important' 
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }
            `}
          >
            <span>Important</span>
            <span className="text-xs">{importantEmails.length}</span>
          </button>
          
          <button
            onClick={() => {
              setActiveInbox('other')
              setSelectedEmail(null) // Close detail when switching inbox
            }}
            className={`
              w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${activeInbox === 'other' 
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }
            `}
          >
            <span>Other</span>
            <span className="text-xs">{otherEmails.length}</span>
          </button>
        </nav>
      </div>

      {/* Right Side: Show either Email List OR Email Detail */}
      {selectedEmail ? (
        // Show Email Detail
        <div className="flex-1">
          <EmailDetail 
            email={selectedEmail} 
            userId={userId}
            onClose={() => setSelectedEmail(null)}
          />
        </div>
      ) : (
        // Show Email List
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex-shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {activeInbox === 'important' ? 'Important' : 'Other'}
              </h2>
            </div>
            
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
                emails={displayedEmails}
                selectedEmailId={emailId}
                onSelectEmail={(email: Email) => setSelectedEmail(email)}
                loading={loading}
              />
            )
          })()}
        </div>
      )}
    </div>

    {/* Compose Modal */}
    {showComposeModal && (
      <ComposeEmailModal 
        userId={userId}
        onClose={() => setShowComposeModal(false)}
        onSuccess={() => {
          // Optionally trigger a sync to fetch the sent email
          console.log('✉️ Email sent successfully!')
        }}
      />
    )}
  </>
  )
}
