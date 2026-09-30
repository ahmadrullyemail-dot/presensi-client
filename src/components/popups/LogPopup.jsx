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
 *  onClose()             – fn
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
  onClose,
}) {
  const tabs = [
    { key: 'log',     label: 'Presensi', count: logs?.log?.length ?? 0 },
    { key: 'pending', label: 'Pending',  count: logs?.pending?.length ?? 0 },
    { key: 'reject',  label: 'Reject',   count: logs?.reject?.length ?? 0 },
  ];

  return (
    <div id="log-popup" className={`popup-panel ${show ? 'show' : ''}`}>
      {/* Header with Title and Close Button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Log Presensi, Pending &amp; Reject</h5>
        {onClose && (
          <button
            type="button"
            className="btn-close"
            aria-label="Tutup"
            onClick={onClose}
          />
        )}
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3" id="log-nav-tabs">
        {tabs.map(({ key, label, count }) => (
          <li className="nav-item" key={key}>
            <a
              className={`nav-link ${activeTab === key ? 'active fw-bold' : ''}`}
              id={`${key}-tab-link`}
              href="#"
              data-tab={key}
              onClick={(e) => { e.preventDefault(); onTabChange(key); }}
            >
              <span>{label}</span>
              {count > 0 && (
                <span
                  className={`badge rounded-pill ms-1 ${
                    activeTab === key ? 'bg-primary text-white' : 'bg-secondary-subtle text-dark'
                  }`}
                  style={{ fontSize: '0.72rem' }}
                >
                  {count}
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>

      {/* Loading Indicator */}
      {loading && (
        <div
          id="loading-indicator"
          className="d-flex justify-content-center align-items-center py-4"
          style={{ minHeight: 120 }}
        >
          <div className="spinner-border text-primary me-2" role="status">
            <span className="visually-hidden">Memuat...</span>
          </div>
          <span className="text-muted small">Memuat data log presensi...</span>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="table-responsive scrollable-table mb-3 shadow-sm rounded border">
          <table className="table table-striped table-hover mb-0 align-middle">
            <thead id="log-table-header" className="table-light">
              <tr>
                <th style={{ minWidth: '110px' }}>Tanggal</th>
                <th>Catatan Log</th>
                {activeTab === 'reject'  && (
                  <>
                    <th style={{ width: '60px' }} className="text-center">Bukti</th>
                    <th>Alasan Reject</th>
                  </>
                )}
                {activeTab === 'pending' && (
                  <>
                    <th style={{ width: '60px' }} className="text-center">Bukti</th>
                    <th style={{ width: '60px' }} className="text-center">Hapus</th>
                  </>
                )}
                {activeTab === 'log' && (
                  <th style={{ width: '60px' }} className="text-center">Edit</th>
                )}
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
      <div className="row g-2 pt-1">
        <div className="col-6 col-sm-6 d-grid">
          <button
            type="button"
            className="btn btn-primary btn-sm shadow-sm rounded-pill py-2 fw-semibold"
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
            type="button"
            className="btn btn-outline-secondary btn-sm shadow-sm rounded-pill py-2 fw-semibold"
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

// ── Helpers & Table Body ──────────────────────────────────────────────────────

function parseNotes(notes) {
  if (!notes || typeof notes !== 'string') {
    return { type: null, text: notes || '-' };
  }
  const trimmed = notes.trim();
  const parts = trimmed.split(/\s+/);
  const first = parts[0];

  const knownTypes = [
    'Masuk', 'Pulang', 'Sakit', 'Izin', 'Cuti',
    'OffDuty', 'Off', 'Check-In', 'Check-Out',
  ];

  if (knownTypes.includes(first)) {
    return {
      type: first,
      text: parts.slice(1).join(' '),
    };
  }
  return { type: null, text: trimmed };
}

function StatusBadge({ type }) {
  if (!type) return null;
  const map = {
    Masuk:      'bg-success',
    'Check-In': 'bg-success',
    Pulang:     'bg-danger',
    'Check-Out':'bg-danger',
    Sakit:      'bg-secondary',
    Izin:       'bg-info text-dark',
    Cuti:       'bg-warning text-dark',
    OffDuty:    'bg-dark text-white',
    Off:        'bg-dark text-white',
  };
  const cls = map[type] || 'bg-secondary';
  return <span className={`badge ${cls} rounded-pill me-1 px-2 py-1`}>{type}</span>;
}

function getImageThumbnail(imageUrl) {
  if (!imageUrl) return null;
  const driveId = convertDriveViewToThumbnailId(imageUrl);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}`;
  }
  return imageUrl;
}

function LogTableBody({ tab, data, onEdit, onDelete }) {
  const colSpanCount = tab === 'log' ? 3 : 4;

  if (!data || data.length === 0) {
    return (
      <tr>
        <td colSpan={colSpanCount} className="text-center py-4 text-muted">
          Tidak ada data untuk tab ini.
        </td>
      </tr>
    );
  }

  return data.map((entry, i) => {
    const date = entry?.date || (Array.isArray(entry) ? entry[0] : '-');
    const notes = entry?.notes || (Array.isArray(entry) ? entry[1] : '');
    const image = entry?.image || (Array.isArray(entry) ? entry[2] : null);
    const rejectReason = entry?.rejectReason || (Array.isArray(entry) ? entry[3] : '');

    const { type, text } = parseNotes(notes);
    const thumbUrl = getImageThumbnail(image);

    return (
      <tr key={i}>
        <td className="small fw-semibold text-nowrap">
          {formatIndonesianDate(date)}
        </td>
        <td className="small">
          {type && <StatusBadge type={type} />}
          <span>{text}</span>
        </td>

        {tab === 'reject' && (
          <>
            <td className="text-center">
              {thumbUrl ? (
                <a href={image} target="_blank" rel="noopener noreferrer" title="Lihat foto bukti">
                  <img
                    src={thumbUrl}
                    alt="Bukti"
                    className="rounded border shadow-sm"
                    style={{ width: 40, height: 40, objectFit: 'cover' }}
                  />
                </a>
              ) : (
                <span className="text-muted small">-</span>
              )}
            </td>
            <td className="small text-danger fw-semibold">
              {rejectReason || 'N/A'}
            </td>
          </>
        )}

        {tab === 'pending' && (
          <>
            <td className="text-center">
              {thumbUrl ? (
                <a href={image} target="_blank" rel="noopener noreferrer" title="Lihat foto bukti">
                  <img
                    src={thumbUrl}
                    alt="Bukti"
                    className="rounded border shadow-sm"
                    style={{ width: 40, height: 40, objectFit: 'cover' }}
                  />
                </a>
              ) : (
                <span className="text-muted small">-</span>
              )}
            </td>
            <td className="text-center">
              <button
                type="button"
                className="btn btn-outline-danger btn-sm p-1"
                title="Batalkan pengajuan"
                onClick={() => onDelete(date, notes)}
              >
                <span className="material-icons" style={{ fontSize: '18px', verticalAlign: 'middle' }}>
                  delete
                </span>
              </button>
            </td>
          </>
        )}

        {tab === 'log' && (
          <td className="text-center">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm p-1"
              title="Edit waktu presensi"
              onClick={() => onEdit(date, notes)}
            >
              <span className="material-icons" style={{ fontSize: '18px', verticalAlign: 'middle' }}>
                edit
              </span>
            </button>
          </td>
        )}
      </tr>
    );
  });
}
