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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  if (emails.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-[var(--text-tertiary)]">
        <p>No emails found</p>
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

