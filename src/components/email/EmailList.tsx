import type { Email } from '@/lib/api-client'
import EmailListItem from './EmailListItem'

interface EmailListProps {
  emails: Email[]
  selectedEmailId: string | null
  onSelectEmail: (email: Email) => void
  loading: boolean
}

export default function EmailList({ emails, selectedEmailId, onSelectEmail, loading }: EmailListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          <p className="text-sm text-[var(--text-tertiary)]">Loading emails...</p>
        </div>
      </div>
    )
  }

  if (emails.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <div className="text-5xl mb-4">📬</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            No emails yet
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] mb-4">
            Your emails are being synced from Gmail. This may take a few moments.
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            Tip: Click the refresh button above to manually sync your emails.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
      {emails.map((email) => (
        <EmailListItem
          key={email.external_id}
          email={email}
          isSelected={selectedEmailId === email.external_id}
          onClick={() => onSelectEmail(email)}
        />
      ))}
    </div>
  )
}

