import { useState, useRef, useEffect } from 'react'
import { parseISO, getHours, getMinutes, setHours, setMinutes, addMinutes, differenceInMinutes } from 'date-fns'
import type { CalendarEvent } from '@/lib/api-client'
import type { DragState } from './types'
import { HOUR_HEIGHT } from './types'
import { updateEvent } from '@/lib/api-client'

interface InteractionRef {
  startX: number
  startY: number
  event?: CalendarEvent
  type: 'move' | 'resize-start' | 'resize-end' | 'create'
  day?: Date
  startTime?: Date
}

export function useDragHandling(
  userId: string,
  onRefresh: () => void,
  scrollRef: React.RefObject<HTMLDivElement | null>,
  setIsModalOpen: (open: boolean) => void,
  setSelectedEvent: (event: CalendarEvent | null) => void,
  setSelectedDate: (date: Date) => void,
  setSelectedEndDate: (date: Date | undefined) => void
) {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [tempEvent, setTempEvent] = useState<Partial<CalendarEvent> | null>(null)
  const tempEventRef = useRef<Partial<CalendarEvent> | null>(null)
  const interactionRef = useRef<InteractionRef | null>(null)
  const wasDraggingRef = useRef(false)

  // Helper to update temp event (both state and ref)
  const updateTempEvent = (event: Partial<CalendarEvent> | null) => {
    setTempEvent(event)
    tempEventRef.current = event
  }

  // Global Mouse Up and Move handlers
  useEffect(() => {
    const handleMouseUp = async () => {
      interactionRef.current = null
      
      if (!dragState) return

      const currentTempEvent = tempEventRef.current

      if (dragState.type === 'create' && currentTempEvent) {
        setSelectedEvent(null)
        setSelectedDate(parseISO(currentTempEvent.start_time!))
        setSelectedEndDate(parseISO(currentTempEvent.end_time!))
        setIsModalOpen(true)
      } else if ((dragState.type === 'move' || dragState.type.startsWith('resize')) && currentTempEvent && dragState.event) {
        try {
          await updateEvent(userId, dragState.event.id!, {
            start_time: currentTempEvent.start_time,
            end_time: currentTempEvent.end_time
          })
          onRefresh()
        } catch (error) {
          console.error('Failed to update event:', error)
        }
      }

      setDragState(null)
      updateTempEvent(null)
      
      wasDraggingRef.current = true
      setTimeout(() => { wasDraggingRef.current = false }, 0)
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Handle initial drag threshold if pending
      if (interactionRef.current && !dragState) {
        const dx = e.clientX - interactionRef.current.startX
        const dy = e.clientY - interactionRef.current.startY
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist > 5) {
          if (interactionRef.current.type === 'create' && interactionRef.current.day && interactionRef.current.startTime) {
            setDragState({
              type: 'create',
              initialY: interactionRef.current.startY,
              initialTime: interactionRef.current.startTime,
              day: interactionRef.current.day
            })
            updateTempEvent({
              start_time: interactionRef.current.startTime.toISOString(),
              end_time: addMinutes(interactionRef.current.startTime, 30).toISOString(),
              title: '(New Event)'
            })
          } else if (interactionRef.current.type === 'move' && interactionRef.current.event) {
            const containerRect = scrollRef.current!.getBoundingClientRect()
            const scrollOffset = scrollRef.current!.scrollTop
            const relativeY = interactionRef.current.startY - containerRect.top + scrollOffset

            setDragState({
              type: 'move',
              event: interactionRef.current.event,
              initialY: relativeY,
              initialTime: parseISO(interactionRef.current.event.start_time)
            })
            updateTempEvent(interactionRef.current.event)
          } else if ((interactionRef.current.type === 'resize-start' || interactionRef.current.type === 'resize-end') && interactionRef.current.event) {
            const containerRect = scrollRef.current!.getBoundingClientRect()
            const scrollOffset = scrollRef.current!.scrollTop
            const relativeY = interactionRef.current.startY - containerRect.top + scrollOffset
            
            setDragState({
              type: interactionRef.current.type,
              event: interactionRef.current.event,
              initialY: relativeY,
              initialTime: parseISO(interactionRef.current.event.start_time)
            })
            updateTempEvent(interactionRef.current.event)
          }
        }
        return
      }

      if (!dragState || !scrollRef.current) return

      const scrollRect = scrollRef.current.getBoundingClientRect()
      const scrollOffset = scrollRef.current.scrollTop
      const relativeY = e.clientY - scrollRect.top + scrollOffset
      
      const snappedY = Math.round(relativeY / 12) * 12
      const snappedMinutes = (snappedY / HOUR_HEIGHT) * 60
      
      if (dragState.type === 'create' && dragState.day) {
        const startMinutes = (dragState.initialY / HOUR_HEIGHT) * 60
        
        let start = new Date(dragState.day)
        start.setHours(0, 0, 0, 0)
        start = addMinutes(start, Math.min(startMinutes, snappedMinutes))
        
        let end = new Date(dragState.day)
        end.setHours(0, 0, 0, 0)
        end = addMinutes(end, Math.max(startMinutes, snappedMinutes))
        
        updateTempEvent({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          title: '(New Event)'
        })
      } else if (dragState.type === 'move' && dragState.event) {
        const originalStart = parseISO(dragState.event.start_time)
        const originalEnd = parseISO(dragState.event.end_time)
        const duration = differenceInMinutes(originalEnd, originalStart)
        
        const initialMinutes = (dragState.initialY / HOUR_HEIGHT) * 60
        const deltaMinutes = snappedMinutes - initialMinutes
        
        let newStart = addMinutes(originalStart, deltaMinutes)
        
        const startTotalMinutes = getHours(newStart) * 60 + getMinutes(newStart)
        const snappedStartMinutes = Math.round(startTotalMinutes / 15) * 15
        newStart = setHours(newStart, 0)
        newStart = setMinutes(newStart, snappedStartMinutes)
        
        const newEnd = addMinutes(newStart, duration)
        
        updateTempEvent({
          ...dragState.event,
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString()
        })
      } else if (dragState.type === 'resize-end' && dragState.event) {
        const start = parseISO(dragState.event.start_time)
        
        let newEnd = new Date(start)
        newEnd.setHours(0, 0, 0, 0)
        newEnd = addMinutes(newEnd, snappedMinutes)
        
        if (differenceInMinutes(newEnd, start) < 15) {
          newEnd = addMinutes(start, 15)
        }
        
        updateTempEvent({
          ...dragState.event,
          end_time: newEnd.toISOString()
        })
      } else if (dragState.type === 'resize-start' && dragState.event) {
        const end = parseISO(dragState.event.end_time)
        
        let newStart = new Date(end)
        newStart.setHours(0, 0, 0, 0)
        newStart = addMinutes(newStart, snappedMinutes)
        
        if (differenceInMinutes(end, newStart) < 15) {
          newStart = addMinutes(end, -15)
        }
        
        updateTempEvent({
          ...dragState.event,
          start_time: newStart.toISOString()
        })
      }
    }

    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [dragState, userId, onRefresh, scrollRef, setIsModalOpen, setSelectedEvent, setSelectedDate, setSelectedEndDate])

  const handleDayMouseDown = (e: React.MouseEvent, day: Date) => {
    if (e.button !== 0) return
    
    const scrollOffset = scrollRef.current?.scrollTop || 0
    const containerRect = scrollRef.current!.getBoundingClientRect()
    const relativeY = e.clientY - containerRect.top + scrollOffset
    
    const snappedY = Math.floor(relativeY / 12) * 12
    
    const start = new Date(day)
    start.setHours(0, 0, 0, 0)
    const startMinutes = (snappedY / HOUR_HEIGHT) * 60
    const startTime = addMinutes(start, startMinutes)
    
    interactionRef.current = {
      type: 'create',
      startX: e.clientX,
      startY: snappedY,
      day,
      startTime
    }
    
    setDragState({
      type: 'create',
      initialY: snappedY,
      initialTime: startTime,
      day
    })

    updateTempEvent({
      start_time: startTime.toISOString(),
      end_time: addMinutes(startTime, 30).toISOString(),
      title: '(New Event)'
    })
  }

  const handleEventMouseDown = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation()
    if (e.button !== 0) return

    interactionRef.current = {
      type: 'move',
      startX: e.clientX,
      startY: e.clientY,
      event
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent, event: CalendarEvent, type: 'start' | 'end') => {
    e.stopPropagation()
    if (e.button !== 0) return

    interactionRef.current = {
      type: type === 'start' ? 'resize-start' : 'resize-end',
      startX: e.clientX,
      startY: e.clientY,
      event
    }
  }

  return {
    dragState,
    tempEvent,
    wasDraggingRef,
    handleDayMouseDown,
    handleEventMouseDown,
    handleResizeMouseDown
  }
}

