import { useEffect, useState } from 'react'
import { fetchEmails, syncEmails } from '@/lib/api-client'
import type { Email } from '@/lib/api-client'
import EmailList from './EmailList'
import EmailDetail from './EmailDetail'
import { MdRefresh, MdSearch } from 'react-icons/md'

interface EmailLayoutProps {
  userId: string
}

export default function EmailLayout({ userId }: EmailLayoutProps) {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  const loadEmails = async () => {
    setLoading(true)
    try {
      const response = await fetchEmails(userId)
      setEmails(response.emails || [])
    } catch (error) {
      console.error('Error loading emails:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncEmails(userId)
      await loadEmails()
      setLastSynced(new Date())
    } catch (error) {
      console.error('Error syncing emails:', error)
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    loadEmails()
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

      <EmailList 
        emails={emails} 
        selectedEmailId={selectedEmail?.external_id || null}
        onSelectEmail={setSelectedEmail}
        loading={loading}
      />
    </div>
  )
}
