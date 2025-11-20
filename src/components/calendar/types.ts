import type { CalendarEvent } from '@/lib/api-client'

export type ViewType = 'week' | 'month'

export interface PositionedEvent extends CalendarEvent {
  top: number
  height: number
  left: number
  width: number
}

export type DragState = {
  type: 'create' | 'move' | 'resize-start' | 'resize-end'
  event?: CalendarEvent
  initialTime: Date
  initialY: number
  day?: Date
}

export interface CalendarComponentProps {
  events: CalendarEvent[]
  userId: string
  onRefresh: () => void
}

export interface WeekViewProps {
  weekDays: Date[]
  hours: number[]
  events: CalendarEvent[]
  currentTime: Date
  scrollRef: React.RefObject<HTMLDivElement | null>
  onDayMouseDown: (e: React.MouseEvent, day: Date) => void
  onEventClick: (e: React.MouseEvent, event: CalendarEvent) => void
  onEventMouseDown: (e: React.MouseEvent, event: CalendarEvent) => void
  onResizeMouseDown: (e: React.MouseEvent, event: CalendarEvent, type: 'start' | 'end') => void
  tempEvent: Partial<CalendarEvent> | null
  dragState: DragState | null
  userId: string
}

export interface MonthViewProps {
  calendarDays: Date[]
  weekDays: Date[]
  currentDate: Date
  events: CalendarEvent[]
  onDayClick: (day: Date) => void
  onEventClick: (e: React.MouseEvent, event: CalendarEvent) => void
}

export const HOUR_HEIGHT = 48
export const GRID_HEIGHT = 24 * HOUR_HEIGHT

