import { useEffect, useRef } from 'react';
import { formatDate } from '../utils/helpers';

/**
 * MainBoard — mirrors the main-clock div
 *
 * Props:
 *  akunNama     – string
 *  akunPosition – string
 *  alert        – string (HTML)
 *  setAlert     – fn
 *  todayStatus  – { loading, html } object
 *  onDeleteLog  – fn(id, action, time)
 */
export default function MainBoard({ akunNama, akunPosition, alert, setAlert, todayStatus, onDeleteLog }) {
  const timeRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      if (timeRef.current) timeRef.current.textContent = `${hh}:${mm}:${ss}`;
      if (dateRef.current) dateRef.current.textContent = formatDate(now);
    }
    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="main-clock mb-2" id="main-display">
      {/* Header card */}
      <div className="text-center row">
        <div className="card shadow mb-2 col-12" style={{ backgroundColor: 'white' }}>
          <img
            src="/logo-sample.svg"
            alt="Logo Presensi"
            className="img-fluid mx-auto d-block"
            style={{ maxWidth: 220, maxHeight: 80 }}
          />
        </div>
        <h5 className="mb-1 fw-bold">Form Absensi Pegawai</h5>
        <h6 className="mb-1 small text-muted">main</h6>
        <hr />
        <p className="text-medium">
          Selamat datang, <span className="fw-bold" id="welcome">{akunNama}</span>
        </p>
        <span
          className="text-medium"
          id="main-alert"
          dangerouslySetInnerHTML={{ __html: alert || '' }}
        />
      </div>

      {/* Today status */}
      <div className="status-display w-100 mb-4 px-3" id="today-status">
        <TodayStatusCard
          loading={todayStatus.loading}
          data={todayStatus.data}
          onDeleteLog={onDeleteLog}
        />
      </div>

      {/* Clock */}
      <div className="clock-group-container">
        <div className="main-time-display" id="main-time" ref={timeRef}>00:00:00</div>
        <div className="main-date-display" id="main-date" ref={dateRef}>...</div>
        <div className="text-medium fw-bold text-center" id="main-position">
          {akunPosition}
        </div>
      </div>
    </main>
  );
}

// ── Today Status Card ────────────────────────────────────────────────────────

function TodayStatusCard({ loading, data, onDeleteLog }) {
  if (loading) {
    return (
      <div className="card shadow-sm p-3 bg-white text-dark text-center">
        <span className="spinner-border spinner-border-sm me-2 text-primary" role="status" aria-hidden="true" />
        <h6 className="fw-bold mb-0 mt-1">Memuat status presensi...</h6>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card shadow-sm p-3 bg-white text-dark text-center">
        <h6 className="fw-bold mb-0 text-danger">Tidak Ada Log Presensi Hari Ini</h6>
      </div>
    );
  }

  const items = [];
  for (let i = 0; i < data.length; i += 4) {
    if (i + 3 >= data.length) continue;
    const id     = data[i];
    const action = data[i + 1];
    const time   = data[i + 2];
    const remark = data[i + 3];

    let badgeCls = 'bg-secondary';
    let textCls  = 'text-muted';
    if (action === 'Masuk')   { badgeCls = 'bg-success';   textCls = 'text-success'; }
    if (action === 'Pulang')  { badgeCls = 'bg-danger';    textCls = 'text-danger'; }
    if (action === 'OffDuty') { badgeCls = 'bg-dark';      textCls = 'text-dark'; }
    if (action === 'Cuti')    { badgeCls = 'bg-warning';   textCls = 'text-warning'; }
    if (action === 'Sakit')   { badgeCls = 'bg-secondary'; textCls = 'text-secondary'; }
    if (action === 'Izin')    { badgeCls = 'bg-info';      textCls = 'text-info'; }

    items.push(
      <li key={id + time} className="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <span className={`badge ${badgeCls} text-white me-2`}>{action}</span>
          <span className={`fw-bold ${textCls}`}>{time}</span>
          {remark && remark !== 'undefined' && remark !== '' && (
            <span className="badge rounded-pill bg-warning text-white ms-1">{remark}</span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger delete-log-btn"
          onClick={() => onDeleteLog(id, action, time)}
        >
          Hapus
        </button>
      </li>
    );
  }

  return (
    <div className="card shadow-sm p-3 bg-white text-dark">
      <h6 className="fw-bold mb-3 text-dark">Log Presensi Hari Ini</h6>
      <ul className="list-group list-group-flush">{items}</ul>
    </div>
  );
}
