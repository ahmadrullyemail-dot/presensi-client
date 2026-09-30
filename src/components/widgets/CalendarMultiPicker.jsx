import { useState } from 'react';
import { MONTH_NAMES, padTwo, getDatesFromRange, CUTI_LIMITS } from '../../utils/helpers';

/**
 * CalendarMultiPicker — multi-select (Cuti) or range-select (Off)
 *
 * Props:
 *  mode           – 'Cuti' | 'Off'
 *  keterangan     – cuti type string (for limit calculation)
 *  selectedDates  – string[] (Cuti mode)
 *  dateRange      – { start, end } (Off mode)
 *  onChange({ selectedDates, dateRange }) – callback
 */
export default function CalendarMultiPicker({
  mode,
  keterangan = 'tahunan',
  selectedDates = [],
  dateRange = { start: null, end: null },
  onChange,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const viewYear  = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  function changeMonth(delta) {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + delta);
    setViewDate(d);
  }

  function pickDate(dateStr) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    if (d <= today) return; // only future

    if (mode === 'Cuti') {
      const limit = CUTI_LIMITS[keterangan] ?? 12;
      const idx = selectedDates.indexOf(dateStr);
      let next;
      if (idx > -1) {
        next = selectedDates.filter(s => s !== dateStr);
      } else {
        if (selectedDates.length >= limit) return;
        next = [...selectedDates, dateStr].sort();
      }
      onChange({ selectedDates: next, dateRange });
    } else {
      // Off — range select
      const { start, end } = dateRange;
      let newStart = start, newEnd = end;
      if (!start || (start && end)) {
        newStart = dateStr; newEnd = null;
      } else if (start && !end) {
        const s = new Date(start), e = new Date(dateStr);
        if (e < s) { newStart = dateStr; newEnd = null; }
        else { newEnd = dateStr; }
      }
      onChange({ selectedDates, dateRange: { start: newStart, end: newEnd } });
    }
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const rangeStartMs = dateRange.start ? new Date(dateRange.start).setHours(0,0,0,0) : null;
  const rangeEndMs   = dateRange.end   ? new Date(dateRange.end).setHours(0,0,0,0)   : null;

  return (
    <div
      id="auto-calendar-popover"
      className="p-3 rounded-4 shadow-lg border"
      style={{ display: 'block', position: 'fixed', left: '50%', bottom: '50%', transform: 'translateX(-50%)', width: 300, backgroundColor: '#fff', zIndex: 1050 }}
    >
      {/* Header */}
      <div id="auto-calendar-header" className="d-flex justify-content-between align-items-center mb-2">
        <button type="button" className="btn btn-sm btn-light" onClick={() => changeMonth(-1)}>&lt;</button>
        <span id="auto-current-month-year" className="fw-bold text-primary">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button type="button" className="btn btn-sm btn-light" onClick={() => changeMonth(1)}>&gt;</button>
      </div>

      {/* Day names */}
      <div className="calendar-grid-container mb-1">
        {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
          <span key={d} className="calendar-header-day">{d}</span>
        ))}
      </div>

      {/* Days */}
      <div id="auto-calendar-days" className="calendar-grid-container">
        {blanks.map((_, i) => <div key={`b${i}`} className="calendar-day-cell" />)}
        {days.map(day => {
          const dateStr = `${viewYear}-${padTwo(viewMonth+1)}-${padTwo(day)}`;
          const dMs = new Date(viewYear, viewMonth, day).setHours(0,0,0,0);
          const isPastOrToday = dMs <= today.getTime();

          let isSelected = false;
          if (mode === 'Cuti') {
            isSelected = selectedDates.includes(dateStr);
          } else if (mode === 'Off') {
            if (rangeStartMs !== null && rangeEndMs !== null) {
              isSelected = dMs >= rangeStartMs && dMs <= rangeEndMs;
            } else if (rangeStartMs !== null) {
              isSelected = dMs === rangeStartMs;
            }
          }

          let cls = 'calendar-day';
          if (isSelected)    cls += ' day-selected';
          if (isPastOrToday) cls += ' day-disabled';

          return (
            <div key={day} className="calendar-day-cell">
              <span
                className={cls}
                onClick={isPastOrToday ? undefined : () => pickDate(dateStr)}
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
