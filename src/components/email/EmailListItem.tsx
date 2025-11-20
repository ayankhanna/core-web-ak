import { format, isToday, isYesterday } from 'date-fns'
import type { Email } from '@/lib/api-client'

interface EmailListItemProps {
  email: Email
  isSelected: boolean
  onClick: () => void
}

export default function EmailListItem({ email, isSelected, onClick }: EmailListItemProps) {
  const date = email.received_at ? new Date(email.received_at) : new Date()
  
  const formatTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'h:mm a')
    }
    if (isYesterday(date)) {
      return 'Yesterday'
    }
    return format(date, 'MMM d')
  }

  // Extract name from "Name <email>" format if possible
  const getSenderName = (from: string) => {
    const match = from.match(/^"?(.*?)"?\s*<.*>$/)
    return match ? match[1] : from.split('<')[0].trim() || from
  }

  return (
    <div 
      onClick={onClick}
      className={`
        group px-6 py-4 cursor-pointer border-b border-[var(--border-color)] transition-all duration-150
        hover:bg-[var(--bg-secondary)]
        ${email.is_unread ? 'bg-[var(--bg-primary)] font-medium' : 'bg-[var(--bg-primary)]/50 text-[var(--text-secondary)]'}
      `}
    >
      <div className="flex items-center w-full gap-6">
        {/* Sender - Fixed Width */}
        <div className={`w-48 truncate flex-shrink-0 ${email.is_unread ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
          {getSenderName(email.from)}
        </div>

        {/* Subject - Flex Grow */}
        <div className="flex-1 truncate text-[var(--text-primary)]">
          {email.subject}
        </div>

        {/* Time - Fixed Width */}
        <div className="w-24 text-right text-xs text-[var(--text-tertiary)] flex-shrink-0 whitespace-nowrap">
          {formatTime(date)}
        </div>
      </div>
    </div>
  )
}
