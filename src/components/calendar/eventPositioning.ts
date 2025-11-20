import { parseISO, getHours, getMinutes, isSameDay } from 'date-fns'
import type { CalendarEvent } from '@/lib/api-client'
import type { PositionedEvent } from './types'
import { HOUR_HEIGHT } from './types'

export function getPositionedEvents(events: CalendarEvent[], date: Date): PositionedEvent[] {
  // Filter events for this day
  const dayEvents = events
    .filter(e => isSameDay(parseISO(e.start_time), date) && !e.is_all_day)
    .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())

  if (dayEvents.length === 0) return []

  // Calculate vertical positions
  const positioned = dayEvents.map(event => {
    const start = parseISO(event.start_time)
    const end = parseISO(event.end_time)
    const startMin = getHours(start) * 60 + getMinutes(start)
    const endMin = getHours(end) * 60 + getMinutes(end)
    
    return {
      ...event,
      top: (startMin / 60) * HOUR_HEIGHT,
      height: Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 20), // Min height 20px
      left: 0,
      width: 100
    }
  })

  // Calculate overlaps
  const groups: PositionedEvent[][] = []
  
  positioned.forEach(event => {
    // Find a group this event overlaps with
    const group = groups.find(g => 
      g.some(e => 
        (event.top < e.top + e.height) && (event.top + event.height > e.top)
      )
    )
    
    if (group) {
      group.push(event)
    } else {
      groups.push([event])
    }
  })

  // Assign widths and left offsets based on groups
  groups.forEach(group => {
    const width = 100 / group.length
    group.forEach((event, index) => {
      event.left = index * width
      event.width = width
    })
  })

  return positioned
}

