import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Calendar.module.css';

export function Calendar({
  selectedDate,
  onSelectDate,
  events = [], // [{ id, date: 'YYYY-MM-DD', title, status, type }]
  className = '',
}) {
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days = [];

  // Previous month fill
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month,
      year,
      isCurrentMonth: true,
    });
  }

  // Next month fill to complete 35 or 42 grid cells
  const remainingCells = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  const today = new Date();
  const isToday = (d) =>
    d.day === today.getDate() &&
    d.month === today.getMonth() &&
    d.year === today.getFullYear();

  const formatDateStr = (d) => {
    const m = String(d.month + 1).padStart(2, '0');
    const day = String(d.day).padStart(2, '0');
    return `${d.year}-${m}-${day}`;
  };

  return (
    <div className={`${styles.calendar} ${className}`}>
      <div className={styles.header}>
        <div className={styles.monthTitle}>
          <h3>
            {monthNames[month]} {year}
          </h3>
        </div>
        <div className={styles.navControls}>
          <button
            type="button"
            onClick={goToToday}
            className={styles.todayBtn}
          >
            Today
          </button>
          <button
            type="button"
            onClick={prevMonth}
            className={styles.navBtn}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className={styles.navBtn}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={styles.dayNamesGrid}>
        {dayNames.map((name) => (
          <div key={name} className={styles.dayName}>
            {name}
          </div>
        ))}
      </div>

      <div className={styles.daysGrid}>
        {days.map((item, idx) => {
          const dateStr = formatDateStr(item);
          const dayEvents = events.filter((e) => e.date === dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <div
              key={idx}
              className={`${styles.dayCell} ${!item.isCurrentMonth ? styles.otherMonth : ''} ${isToday(item) ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelectDate && onSelectDate(dateStr, dayEvents)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === 'Enter' || e.key === ' ') &&
                onSelectDate &&
                onSelectDate(dateStr, dayEvents)
              }
            >
              <span className={styles.dayNumber}>{item.day}</span>
              {dayEvents.length > 0 && (
                <div className={styles.eventsList}>
                  {dayEvents.slice(0, 2).map((ev) => (
                    <span
                      key={ev.id || ev.title}
                      className={`${styles.eventPill} ${ev.type === 'deadline' ? styles.deadline : styles.milestone}`}
                      title={ev.title}
                    >
                      {ev.title}
                    </span>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className={styles.moreCount}>
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
