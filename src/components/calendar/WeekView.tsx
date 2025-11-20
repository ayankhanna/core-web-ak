import { format, isToday, setHours, parseISO, isSameDay, getHours, getMinutes } from 'date-fns'
import type { CalendarEvent } from '@/lib/api-client'
import type { WeekViewProps } from './types'
import { HOUR_HEIGHT } from './types'
import { getPositionedEvents } from './eventPositioning'

export default function WeekView({
  weekDays,
  hours,
  events,
  currentTime,
  scrollRef,
  onDayMouseDown,
  onEventClick,
  onEventMouseDown,
  onResizeMouseDown,
  tempEvent,
  dragState,
  userId
}: WeekViewProps) {
  
  const CurrentTimeLine = () => {
    const hour = getHours(currentTime)
    const min = getMinutes(currentTime)
    const top = (hour * 60 + min) * (HOUR_HEIGHT / 60)

    return (
      <div 
        className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
        style={{ top: `${top}px` }}
      >
        <div className="w-full h-px bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]"></div>
        <div className="absolute -left-1.5 w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm ring-2 ring-white dark:ring-black"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Week Header */}
      <div className="grid grid-cols-[60px_1fr] border-b border-[var(--border-color)] bg-[var(--bg-primary)] z-20 shadow-sm">
        <div className="p-2 border-r border-[var(--border-color)]"></div>
        <div className="grid grid-cols-7">
          {weekDays.map(day => (
            <div 
              key={day.toString()} 
              className={`
                py-3 text-center border-r border-[var(--border-color)] last:border-r-0 flex items-center justify-center gap-1.5
                ${isToday(day) ? 'bg-[var(--bg-secondary)]/50' : ''}
              `}
            >
              <span className={`text-sm font-medium uppercase ${isToday(day) ? 'text-[var(--event-bg)]' : 'text-[var(--text-tertiary)]'}`}>
                {format(day, 'EEE')}
              </span>
              <span className={`
                w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold
                ${isToday(day) ? 'bg-[var(--event-bg)] text-[var(--event-text)]' : 'text-[var(--text-primary)]'}
              `}>
                {format(day, 'd')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Time Grid */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar relative"
      >
        <div className="grid grid-cols-[60px_1fr]" style={{ minHeight: hours.length * HOUR_HEIGHT }}>
          {/* Time Labels */}
          <div className="border-r border-[var(--border-color)] bg-[var(--bg-secondary)] sticky left-0 z-10">
            {hours.map(hour => (
              <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
                <span className="absolute -top-2.5 right-3 text-[11px] font-medium text-[var(--text-tertiary)] font-mono tracking-tight">
                  {hour === 0 ? '' : format(setHours(new Date(), hour), 'h a')}
                </span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          <div className="grid grid-cols-7 relative bg-[var(--calendar-bg)]">
            {/* Horizontal Grid Lines */}
            {hours.map(hour => (
              <div 
                key={hour} 
                className="absolute w-full border-b border-[var(--border-color)] pointer-events-none"
                style={{ top: `${hour * HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Days */}
            {weekDays.map(day => {
              const isTodayDate = isToday(day)
              
              // Prepare events for rendering
              let displayEvents = events
              
              if (tempEvent && dragState?.type === 'create' && dragState.day && isSameDay(day, dragState.day)) {
                displayEvents = [...displayEvents, { ...tempEvent, id: 'temp', user_id: userId } as CalendarEvent]
              } else if (tempEvent && (dragState?.type === 'move' || dragState?.type.startsWith('resize'))) {
                displayEvents = displayEvents.map(e => 
                  e.id === dragState.event?.id 
                    ? { ...tempEvent, id: e.id, user_id: userId } as CalendarEvent 
                    : e
                )
              }

              const positionedEvents = getPositionedEvents(displayEvents, day)

              return (
                <div 
                  key={day.toString()} 
                  className={`
                    relative border-r border-[var(--border-color)] last:border-r-0 h-full
                    ${isTodayDate ? 'bg-[var(--bg-secondary)]/30' : ''}
                    transition-colors
                  `}
                  onMouseDown={(e) => onDayMouseDown(e, day)}
                >
                  {isTodayDate && <CurrentTimeLine />}
                  
                  {positionedEvents.map(event => {
                    const isTemp = event.id === 'temp'
                    const isDragging = dragState?.event?.id === event.id

                    return (
                      <div
                        key={event.id}
                        onMouseDown={(e) => !isTemp && onEventMouseDown(e, event)}
                        onClick={(e) => !isTemp && onEventClick(e, event)}
                        className={`
                          absolute rounded-[4px] px-2 py-1
                          bg-[var(--event-bg)] text-[var(--event-text)]
                          shadow-sm border border-white/20
                          group z-10 overflow-hidden
                          ${isTemp ? 'opacity-80 ring-2 ring-[var(--text-primary)]' : 'hover:brightness-95 cursor-pointer transition-all'}
                          ${isDragging ? 'cursor-grabbing z-50 shadow-lg' : ''}
                        `}
                        style={{
                          top: `${event.top}px`,
                          height: `${event.height}px`,
                          left: `${event.left}%`,
                          width: `${event.width}%`,
                          maxWidth: event.width < 100 ? 'calc(100% - 2px)' : '100%'
                        }}
                        title={`${event.title} (${format(parseISO(event.start_time), 'p')} - ${format(parseISO(event.end_time), 'p')})`}
                      >
                        {/* Resize Handles */}
                        {!isTemp && (
                          <>
                            <div 
                              className="absolute top-0 left-0 right-0 h-2 cursor-n-resize opacity-0 group-hover:opacity-100 z-20"
                              onMouseDown={(e) => onResizeMouseDown(e, event, 'start')}
                            />
                            <div 
                              className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 z-20"
                              onMouseDown={(e) => onResizeMouseDown(e, event, 'end')}
                            />
                          </>
                        )}

                        <div className="flex flex-col h-full pointer-events-none">
                          <div className="font-semibold text-[11px] leading-tight truncate">
                            {event.title}
                          </div>
                          {event.height > 30 && (
                            <div className="opacity-80 text-[10px] leading-tight mt-0.5 truncate font-medium">
                              {format(parseISO(event.start_time), 'h:mm a')}
                              {isTemp && event.end_time && (
                                <span> - {format(parseISO(event.end_time), 'h:mm a')}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

