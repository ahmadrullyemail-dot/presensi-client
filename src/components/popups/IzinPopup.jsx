/**
 * IzinPopup — Ketidakhadiran panel (mirrors #izin-popup)
 *
 * Props:
 *  show          – boolean
 *  onKetidakhadiran(type) – fn called with 'Cuti'|'Izin'|'Sakit'|'Off'
 */
export default function IzinPopup({ show, onKetidakhadiran, onClose }) {
  const items = [
    { type: 'Cuti',  icon: 'beach_access',       label: 'Cuti' },
    { type: 'Izin',  icon: 'assignment_turned_in', label: 'Izin' },
    { type: 'Sakit', icon: 'local_hospital',       label: 'Sakit' },
    { type: 'Off',   icon: 'weekend',              label: 'Off' },
  ];

  return (
    <div id="izin-popup" className={`popup-panel ${show ? 'show' : ''}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Pengajuan Ketidakhadiran</h5>
        {onClose && (
          <button
            type="button"
            className="btn-close"
            aria-label="Tutup"
            onClick={onClose}
          />
        )}
      </div>
      <div className="row g-3">
        {items.map(({ type, icon, label }) => (
          <div className="col-3" key={type}>
            <div className="card-menu" onClick={() => onKetidakhadiran(type)}>
              <div className="icon">
                <span className="material-icons">{icon}</span>
              </div>
              <p>{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
