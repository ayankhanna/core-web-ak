import { useEffect, useRef } from 'react'
import { MdClose, MdDelete, MdEdit, MdLocationOn, MdNotes } from 'react-icons/md'
import { format, parseISO } from 'date-fns'
import type { CalendarEvent } from '@/lib/api-client'

interface EventPopoverProps {
  event: CalendarEvent
  onClose: () => void
  onEdit: () => void
  onDelete: () => Promise<void>
  position: { top: number; left: number; width: number }
}

export default function EventPopover({ 
  event, 
  onClose, 
  onEdit, 
  onDelete,
  position 
}: EventPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleDelete = async () => {
    if (confirm('Delete this event?')) {
      await onDelete()
      onClose()
    }
  }

  // Calculate position to keep within viewport
  const style: React.CSSProperties = {
    top: Math.min(position.top, window.innerHeight - 200), // Prevent going off bottom
    left: Math.min(Math.max(position.left + position.width + 10, 10), window.innerWidth - 320), // Default right
  }

  // If too close to right edge, flip to left
  if (position.left + position.width + 320 > window.innerWidth) {
    style.left = position.left - 310
  }

  return (
    <div 
      ref={popoverRef}
      style={style}
      className="fixed z-50 w-[300px] bg-[var(--bg-primary)] rounded-lg shadow-xl border border-[var(--border-color)] animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-end gap-1 p-2 bg-[var(--bg-secondary)]/50 border-b border-[var(--border-color)]">
        <button
          onClick={onEdit}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
          title="Edit event"
        >
          <MdEdit size={18} />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
          title="Delete event"
        >
          <MdDelete size={18} />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
          title="Close"
        >
          <MdClose size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title color accent */}
        <div className="flex gap-3">
          <div className="w-1 self-stretch rounded-full bg-[var(--event-bg)] flex-shrink-0 mt-1.5 mb-1" />
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] leading-tight">
              {event.title || '(No Title)'}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-[var(--text-secondary)]">
              {format(parseISO(event.start_time), 'EEEE, MMMM d')}
              {event.is_all_day ? (
                <span className="text-[var(--text-tertiary)] text-xs bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">All day</span>
              ) : (
                <span className="text-[var(--text-tertiary)]">
                  {format(parseISO(event.start_time), 'h:mm a')} - {format(parseISO(event.end_time), 'h:mm a')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        {(event.location || event.description) && (
          <div className="space-y-2 pt-2">
            {event.location && (
              <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <MdLocationOn className="flex-shrink-0 mt-0.5 text-[var(--text-tertiary)]" size={16} />
                <span>{event.location}</span>
              </div>
            )}
            {event.description && (
              <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <MdNotes className="flex-shrink-0 mt-0.5 text-[var(--text-tertiary)]" size={16} />
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}




