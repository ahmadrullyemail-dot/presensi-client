import { useState } from 'react';
import { MONTH_NAMES, padTwo } from '../../utils/helpers';

/**
 * CalendarPicker — single-select, past dates only (for Add/Edit Log)
 *
 * Props:
 *  selectedDate – 'YYYY-MM-DD' or ''
 *  onSelect(dateString) – callback
 *  onClose – callback
 */
export default function CalendarPicker({ selectedDate, onSelect, onClose }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function handleDayClick(day) {
    const dateStr = `${viewYear}-${padTwo(viewMonth + 1)}-${padTwo(day)}`;
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    if (d >= today) return; // disable today & future
    onSelect(dateStr);
    onClose?.();
  }

  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div
      id="add-calendar-popover"
      className="p-3 rounded-4 shadow-lg border"
      style={{ display: 'block', position: 'fixed', left: '50%', bottom: '50%', transform: 'translateX(-50%)', width: 280, backgroundColor: '#fff', zIndex: 1050 }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span id="add-current-month-year" className="fw-bold text-primary">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
      </div>

      {/* Day names */}
      <div className="calendar-grid-container mb-1">
        {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
          <span key={d} className="calendar-header-day">{d}</span>
        ))}
      </div>

      {/* Days */}
      <div id="add-calendar-days" className="calendar-grid-container">
        {blanks.map((_, i) => <div key={`b${i}`} className="calendar-day-cell" />)}
        {days.map(day => {
          const dateStr = `${viewYear}-${padTwo(viewMonth + 1)}-${padTwo(day)}`;
          const d = new Date(viewYear, viewMonth, day);
          d.setHours(0, 0, 0, 0);
          const isFutureOrToday = d >= today;
          const isSelected = selectedDate === dateStr;

          let cls = 'calendar-day';
          if (isSelected) cls += ' day-selected';
          if (isFutureOrToday) cls += ' day-disabled';

          return (
            <div key={day} className="calendar-day-cell">
              <span
                className={cls}
                onClick={isFutureOrToday ? undefined : () => handleDayClick(day)}
              >
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
