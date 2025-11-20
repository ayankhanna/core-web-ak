import { useState, useEffect } from 'react'
import { MdClose, MdDelete, MdSave, MdAccessTime, MdLocationOn, MdNotes } from 'react-icons/md'
import { format, addHours } from 'date-fns'
import type { CalendarEvent } from '@/lib/api-client'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (eventData: Partial<CalendarEvent>) => Promise<void>
  onDelete?: (eventId: string) => Promise<void>
  initialDate?: Date
  initialEndDate?: Date
  event?: CalendarEvent | null
}

export default function EventModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  initialDate,
  initialEndDate, 
  event 
}: EventModalProps) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      if (event) {
        setTitle(event.title)
        setStartTime(event.start_time.slice(0, 16)) // format for datetime-local: YYYY-MM-DDThh:mm
        setEndTime(event.end_time.slice(0, 16))
        setIsAllDay(event.is_all_day || false)
        setLocation(event.location || '')
        setDescription(event.description || '')
      } else {
        const start = initialDate || new Date()
        // Round up to nearest 30 min if exact time not provided via drag
        if (!initialDate) {
            start.setMilliseconds(0)
            start.setSeconds(0)
            const minutes = start.getMinutes()
            if (minutes > 30) {
            start.setMinutes(0)
            start.setHours(start.getHours() + 1)
            } else {
            start.setMinutes(30)
            }
        }

        const end = initialEndDate || addHours(start, 1)

        setTitle('')
        setStartTime(format(start, "yyyy-MM-dd'T'HH:mm"))
        setEndTime(format(end, "yyyy-MM-dd'T'HH:mm"))
        setIsAllDay(false)
        setLocation('')
        setDescription('')
      }
    }
  }, [isOpen, event, initialDate, initialEndDate])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        title: title || '(No Title)',
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        is_all_day: isAllDay,
        location,
        description,
        ...(event?.id ? { id: event.id } : {})
      })
      onClose()
    } catch (error) {
      console.error('Failed to save event:', error)
      alert('Failed to save event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!event?.id || !onDelete) return
    
    if (confirm('Are you sure you want to delete this event?')) {
      setLoading(true)
      try {
        await onDelete(event.id)
        onClose()
      } catch (error) {
        console.error('Failed to delete event:', error)
        alert('Failed to delete event. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="bg-[var(--bg-primary)] rounded-2xl shadow-2xl w-full max-w-[448px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[var(--border-color)]">
        
        {/* Header Actions (Top Right) */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
            {/* Drag handle area if needed, or empty space */}
            <div className="flex-1" />
            <div className="flex items-center gap-1">
                {event?.id && onDelete && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="p-2 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-[var(--bg-secondary)] rounded-full transition-colors"
                        title="Delete event"
                    >
                        <MdDelete size={20} />
                    </button>
                )}
                <button 
                    onClick={onClose}
                    className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-full transition-colors"
                >
                    <MdClose size={20} />
                </button>
            </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-1">
          {/* Title Input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Add title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="
                w-full text-2xl font-normal bg-transparent border-0 
                focus:border-0 focus:ring-0 focus:outline-none px-0 py-1 
                placeholder-[var(--text-tertiary)] text-[var(--text-primary)] 
                transition-all
              "
              autoFocus
            />
          </div>

          <div className="space-y-5">
            {/* Time Section */}
            <div className="flex gap-4">
                <div className="mt-1 text-[var(--text-tertiary)]">
                    <MdAccessTime size={22} />
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex flex-col gap-2">
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                            className="bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] border-0 rounded px-3 py-2 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--event-bg)]/20 outline-none transition-colors cursor-pointer"
                        />
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                            className="bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] border-0 rounded px-3 py-2 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--event-bg)]/20 outline-none transition-colors cursor-pointer"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer select-none w-fit">
                        <input
                            type="checkbox"
                            checked={isAllDay}
                            onChange={(e) => setIsAllDay(e.target.checked)}
                            className="rounded border-[var(--border-color)] text-[var(--event-bg)] focus:ring-[var(--event-bg)] w-4 h-4"
                        />
                        All day
                    </label>
                </div>
            </div>

            {/* Location Section */}
            <div className="flex gap-4">
                <div className="mt-1 text-[var(--text-tertiary)]">
                    <MdLocationOn size={22} />
                </div>
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Add location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] border-0 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--event-bg)]/20 outline-none placeholder-[var(--text-tertiary)] transition-colors"
                    />
                </div>
            </div>

            {/* Description Section */}
            <div className="flex gap-4">
                <div className="mt-1 text-[var(--text-tertiary)]">
                    <MdNotes size={22} />
                </div>
                <div className="flex-1">
                    <textarea
                        placeholder="Add description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] border-0 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--event-bg)]/20 outline-none resize-none placeholder-[var(--text-tertiary)] transition-colors block"
                    />
                </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[var(--event-bg)] text-[var(--event-text)] hover:opacity-90 rounded-full text-sm font-medium transition-all shadow-sm flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <MdSave size={18} />
              )}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
