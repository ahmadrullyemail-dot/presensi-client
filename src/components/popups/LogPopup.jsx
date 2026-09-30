import { convertDriveViewToThumbnailId, formatIndonesianDate } from '../../utils/helpers';

/**
 * LogPopup — Presensi / Pending / Reject info panel (mirrors #log-popup)
 *
 * Props:
 *  show        – boolean
 *  activeTab   – 'log'|'pending'|'reject'
 *  onTabChange(tab) – fn
 *  loading     – boolean
 *  logs        – { log:[], pending:[], reject:[] } | null
 *  onEdit(date, notes)   – fn
 *  onDelete(date, notes) – fn (pending)
 *  onAddLog()            – fn
 *  onDownload()          – fn
 */
export default function LogPopup({
  show,
  activeTab,
  onTabChange,
  loading,
  logs,
  onEdit,
  onDelete,
  onAddLog,
  onDownload,
}) {
  const tabs = [
    { key: 'log',     label: 'Presensi' },
    { key: 'pending', label: 'Pending' },
    { key: 'reject',  label: 'Reject' },
  ];

  return (
    <div id="log-popup" className={`popup-panel ${show ? 'show' : ''}`}>
      <h5 className="fw-bold mb-3">Log presensi, pending & reject</h5>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4" id="log-nav-tabs">
        {tabs.map(({ key, label }) => (
          <li className="nav-item" key={key}>
            <a
              className={`nav-link ${activeTab === key ? 'active' : ''}`}
              id={`${key}-tab-link`}
              href="#"
              data-tab={key}
              onClick={(e) => { e.preventDefault(); onTabChange(key); }}
            >
              <span className="mb-0">{label}</span>
            </a>
          </li>
        ))}
      </ul>

      {/* Loading */}
      {loading && (
        <div
          id="loading-indicator"
          className="justify-content-center align-items-center"
          style={{ display: 'flex', minHeight: 80 }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="table-responsive scrollable-table mb-3">
          <table className="table table-striped table-hover">
            <thead id="log-table-header">
              <tr>
                <th>Tanggal</th>
                <th>Catatan Log</th>
                {activeTab === 'reject'  && <><th>Image</th><th>Reject Reason</th></>}
                {activeTab === 'pending' && <><th>Image</th><th>Hapus</th></>}
                {activeTab === 'log'     && <th>Edit</th>}
              </tr>
            </thead>
            <tbody id="log-table-body">
              <LogTableBody
                tab={activeTab}
                data={logs?.[activeTab] ?? []}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div className="row g-3">
        <div className="col-6 col-sm-6 d-grid">
          <button
            className="btn btn-primary btn-sm shadow-sm rounded-pill"
            onClick={onAddLog}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="me-1" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Tambah Presensi
          </button>
        </div>
        <div className="col-6 col-sm-6 d-grid">
          <button
            className="btn btn-outline-secondary btn-sm shadow-sm rounded-pill"
            onClick={onDownload}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="me-1" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v7h1a1 1 0 110 2H9a1 1 0 110-2h1V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Download Presensi
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Table body ───────────────────────────────────────────────────────────────

function statusBadge(notes) {
  const type = notes.split(' ')[0];
  const map = {
    Masuk:   'text-bg-success rounded-pill',
    Pulang:  'text-bg-danger rounded-pill',
    Sakit:   'text-bg-secondary rounded-pill',
    Izin:    'text-bg-info',
    Cuti:    'text-bg-warning rounded-pill',
    OffDuty: 'text-bg-dark rounded-pill',
  };
  const cls = map[type] || 'text-bg-secondary rounded-pill';
  return <span className={`badge ${cls} px-3 py-1`}>{type}</span>;
}

function LogTableBody({ tab, data, onEdit, onDelete }) {
  if (!data || data.length === 0) {
    return (
      <tr><td colSpan="4" className="text-center">Tidak ada log untuk tab ini.</td></tr>
    );
  }

  return data.map((entry, i) => {
    const imageId = convertDriveViewToThumbnailId(entry.image);
    const thumbUrl = imageId ? `https://drive.google.com/thumbnail?id=${imageId}` : null;

    return (
      <tr key={i}>
        <td width="20%">{formatIndonesianDate(entry.date)}</td>
        <td>
          {statusBadge(entry.notes)}{' '}
          {entry.notes.split(' ')[1]}
        </td>

        {tab === 'reject' && (
          <>
            <td>
              {thumbUrl
                ? <img src={thumbUrl} alt="Log" style={{ maxWidth: 50, maxHeight: 50 }} />
                : 'No Image'}
            </td>
            <td>{entry.rejectReason || 'N/A'}</td>
          </>
        )}

        {tab === 'pending' && (
          <>
            <td>
              {thumbUrl
                ? <img src={thumbUrl} alt="Log" style={{ maxWidth: 50, maxHeight: 50 }} />
                : 'No Image'}
            </td>
            <td>
              <span
                className="material-icons"
                style={{ cursor: 'pointer', color: '#dc3545' }}
                onClick={() => onDelete(entry.date, entry.notes)}
              >
                delete
              </span>
            </td>
          </>
        )}

        {tab === 'log' && (
          <td>
            <span
              className="material-icons"
              style={{ cursor: 'pointer' }}
              onClick={() => onEdit(entry.date, entry.notes)}
            >
              edit
            </span>
          </td>
        )}
      </tr>
    );
  });
}
