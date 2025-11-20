import { format, isSameMonth, isToday, isSameDay, parseISO } from 'date-fns'
import type { CalendarEvent } from '@/lib/api-client'
import type { MonthViewProps } from './types'

export default function MonthView({
  calendarDays,
  weekDays,
  currentDate,
  events,
  onDayClick,
  onEventClick
}: MonthViewProps) {
  
  const getMonthEvents = (date: Date) => {
    return events.filter(event => 
      isSameDay(parseISO(event.start_time), date)
    ).sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <div className="grid grid-cols-7 mb-3">
        {weekDays.map(day => (
          <div key={day.toString()} className="text-[var(--text-tertiary)] text-xs font-bold uppercase tracking-widest text-center">
            {format(day, 'EEE')}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-5 border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm bg-[var(--calendar-bg)]">
        {calendarDays.map((day) => {
          const dayEvents = getMonthEvents(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isTodayDate = isToday(day)

          return (
            <div
              key={day.toString()}
              onClick={() => onDayClick(day)}
              className={`
                p-2 flex flex-col gap-1
                border-r border-b border-[var(--border-color)]
                transition-colors duration-200
                cursor-pointer hover:bg-[var(--bg-secondary)]/20
                ${!isCurrentMonth ? 'bg-[var(--bg-secondary)]/40' : ''}
                ${isTodayDate ? 'bg-[var(--bg-secondary)]' : ''}
              `}
            >
              <div className="flex items-center justify-center mb-1">
                <span 
                  className={`
                    w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                    ${isTodayDate 
                      ? 'bg-[var(--event-bg)] text-[var(--event-text)]' 
                      : isCurrentMonth ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
                    }
                  `}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                {dayEvents.slice(0, 4).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => onEventClick(e, event)}
                    className="
                      px-1.5 py-1 rounded-[3px]
                      bg-[var(--bg-primary)] border border-[var(--border-color)]
                      hover:border-[var(--event-bg)] transition-all cursor-pointer
                      shadow-sm
                    "
                  >
                    <div className="flex items-center gap-1.5 pointer-events-none">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${event.is_all_day ? 'bg-blue-400' : 'bg-[var(--event-bg)]'}`} />
                      <p className="text-[10px] font-medium text-[var(--text-primary)] truncate leading-none">
                        {event.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

