import { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react'
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  getHours,
  parseISO,
  addMinutes
} from 'date-fns'
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'
import type { CalendarEvent } from '@/lib/api-client'
import { createEvent, updateEvent, deleteEvent } from '@/lib/api-client'
import EventModal from './EventModal'
import EventPopover from './EventPopover'
import WeekView from './WeekView'
import MonthView from './MonthView'
import { useDragHandling } from './useDragHandling'
import type { CalendarComponentProps, ViewType } from './types'
import { HOUR_HEIGHT } from './types'

export default function CalendarComponent({ events, userId, onRefresh }: CalendarComponentProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>('week')
  const [currentTime, setCurrentTime] = useState(new Date())
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasScrolled = useRef(false)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined)
  
  // Popover State
  const [popoverEvent, setPopoverEvent] = useState<CalendarEvent | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  // Drag Handling Hook
  const {
    dragState,
    tempEvent,
    wasDraggingRef,
    handleDayMouseDown,
    handleEventMouseDown,
    handleResizeMouseDown
  } = useDragHandling(
    userId,
    onRefresh,
    scrollRef,
    setIsModalOpen,
    setSelectedEvent,
    setSelectedDate,
    setSelectedEndDate
  )

  // Update current time for the red line
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to current time
  useLayoutEffect(() => {
    if (view === 'week' && !hasScrolled.current && scrollRef.current) {
      const currentHour = getHours(new Date())
      const scrollHour = Math.max(0, currentHour - 2)
      scrollRef.current.scrollTop = scrollHour * HOUR_HEIGHT
      hasScrolled.current = true
    }
  }, [view])

  // Calendar Grid Logic
  const calendarDays = useMemo(() => {
    if (view === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(monthStart)
      const startDate = startOfWeek(monthStart)
      const endDate = endOfWeek(monthEnd)
      return eachDayOfInterval({ start: startDate, end: endDate })
    } else {
      const weekStart = startOfWeek(currentDate)
      const weekEnd = endOfWeek(weekStart)
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
    }
  }, [currentDate, view])

  const weekDays = useMemo(() => {
    const startDate = startOfWeek(currentDate)
    return Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(startDate)
      day.setDate(day.getDate() + i)
      return day
    })
  }, [currentDate])

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), [])

  // Header date formatting
  const headerTitle = useMemo(() => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy')
    } else {
      const weekStart = startOfWeek(currentDate)
      const weekEnd = endOfWeek(currentDate)
      const startMonth = format(weekStart, 'MMMM')
      const endMonth = format(weekEnd, 'MMMM')
      const startDay = format(weekStart, 'd')
      const endDay = format(weekEnd, 'd')
      const year = format(weekEnd, 'yyyy')
      
      // If week spans two months, show both
      if (startMonth !== endMonth) {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay} ${year}`
      }
      return `${startMonth} ${startDay}-${endDay} ${year}`
    }
  }, [currentDate, view])

  // Navigation
  const next = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
    else setCurrentDate(addWeeks(currentDate, 1))
  }
  
  const prev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
    else setCurrentDate(subWeeks(currentDate, 1))
  }

  // Event Handlers
  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation()
    if (wasDraggingRef.current) return
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopoverPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width
    })
    setPopoverEvent(event)
  }

  const handleEditFromPopover = () => {
    if (!popoverEvent) return
    setSelectedEvent(popoverEvent)
    setSelectedDate(parseISO(popoverEvent.start_time))
    setSelectedEndDate(parseISO(popoverEvent.end_time))
    setPopoverEvent(null)
    setIsModalOpen(true)
  }

  const handleDeleteFromPopover = async () => {
    if (!popoverEvent?.id) return
    await deleteEvent(userId, popoverEvent.id)
    setPopoverEvent(null)
    onRefresh()
  }

  const handleDayClick = (day: Date) => {
    const clickedDate = new Date(day)
    clickedDate.setHours(9, 0, 0, 0)
    setSelectedEvent(null)
    setSelectedDate(clickedDate)
    setSelectedEndDate(addMinutes(clickedDate, 60))
    setIsModalOpen(true)
  }

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    if (selectedEvent?.id) {
      await updateEvent(userId, selectedEvent.id, eventData)
    } else {
      await createEvent(userId, eventData)
    }
    onRefresh()
  }

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent(userId, eventId)
    onRefresh()
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] select-none">
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialDate={selectedDate}
        initialEndDate={selectedEndDate}
        event={selectedEvent}
      />
      
      {popoverEvent && popoverPosition && (
        <EventPopover
          event={popoverEvent}
          position={popoverPosition}
          onClose={() => setPopoverEvent(null)}
          onEdit={handleEditFromPopover}
          onDelete={handleDeleteFromPopover}
        />
      )}

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-primary)] z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={prev} 
              className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              <MdChevronLeft size={20} />
            </button>
            
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight min-w-[280px] text-center">
              {headerTitle}
            </h1>
            
            <button 
              onClick={next} 
              className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              <MdChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-0.5">
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              view === 'week' 
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              view === 'month' 
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Calendar Views */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {view === 'week' ? (
          <WeekView
            weekDays={weekDays}
            hours={hours}
            events={events}
            currentTime={currentTime}
            scrollRef={scrollRef}
            onDayMouseDown={handleDayMouseDown}
            onEventClick={handleEventClick}
            onEventMouseDown={handleEventMouseDown}
            onResizeMouseDown={handleResizeMouseDown}
            tempEvent={tempEvent}
            dragState={dragState}
            userId={userId}
          />
        ) : (
          <MonthView
            calendarDays={calendarDays}
            weekDays={weekDays}
            currentDate={currentDate}
            events={events}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        )}
      </div>
    </div>
  )
}
