/**
 * TimePicker — reusable hour/minute/second spinner
 * Mirrors the original embedded-time-picker / add-time-picker-widget
 *
 * Props:
 *  hour, minute, second – string values (padded 2 digits)
 *  onChange(unit, value) – callback
 *  prefix – id prefix string (for unique ids)
 */
export default function TimePicker({ hour, minute, second, onChange, prefix = '' }) {
  function changeUnit(unit, delta) {
    const max = unit === 'hour' ? 23 : 59;
    let current = parseInt(unit === 'hour' ? hour : unit === 'minute' ? minute : second, 10) || 0;
    current += delta;
    if (current > max) current = 0;
    if (current < 0) current = max;
    onChange(unit, String(current).padStart(2, '0'));
  }

  function handleInput(unit, e) {
    const max = unit === 'hour' ? 23 : 59;
    let val = e.target.value.replace(/[^0-9]/g, '').substring(0, 2);
    if (val !== '' && parseInt(val, 10) > max) val = String(max);
    onChange(unit, val.padStart(2, '0'));
  }

  const ChevronUp = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 15-6-6-6 6"/>
    </svg>
  );
  const ChevronDown = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );

  const units = [
    { key: 'hour',   value: hour,   label: 'Jam',   max: 23 },
    { key: 'minute', value: minute, label: 'Menit', max: 59 },
    { key: 'second', value: second, label: 'Detik', max: 59 },
  ];

  return (
    <div className="d-flex align-items-end justify-content-center">
      {units.map((u) => (
        <div className="time-column" key={u.key}>
          <button
            type="button"
            className="time-picker-btn top-btn"
            onClick={() => changeUnit(u.key, 1)}
          >
            <ChevronUp />
          </button>
          <input
            type="number"
            className="time-picker-input"
            id={`${prefix}-${u.key}`}
            min="0"
            max={u.max}
            value={u.value}
            onChange={(e) => handleInput(u.key, e)}
          />
          <button
            type="button"
            className="time-picker-btn bottom-btn"
            onClick={() => changeUnit(u.key, -1)}
          >
            <ChevronDown />
          </button>
          <small className="text-muted mt-1">{u.label}</small>
        </div>
      ))}
    </div>
  );
}
