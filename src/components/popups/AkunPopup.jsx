import { useState } from 'react';

/**
 * AkunPopup — Employee account info panel (mirrors #akun-popup)
 *
 * Props:
 *  show   – boolean
 *  akun   – { nama, id, job, cat, tel, ema }
 *  onUpdate(wa, email) – fn
 */
export default function AkunPopup({ show, akun, onUpdate }) {
  const [wa,    setWa]    = useState(akun?.tel ? '0' + akun.tel : akun?.tel ?? '');
  const [email, setEmail] = useState(akun?.ema ?? '');

  // sync when akun prop changes
  if (akun?.tel !== undefined && wa === '' && akun.tel) {
    setWa('0' + akun.tel);
  }
  if (akun?.ema !== undefined && email === '' && akun.ema) {
    setEmail(akun.ema);
  }

  return (
    <div id="akun-popup" className={`popup-panel ${show ? 'show' : ''}`}>
      <h5 className="fw-bold mb-3">Informasi Akun Pegawai</h5>
      <div className="card p-3 mb-3 border-0 shadow-sm">
        <div className="d-flex align-items-center mb-3">
          <span className="material-icons text-primary me-3" style={{ fontSize: '3rem' }}>
            account_circle
          </span>
          <div>
            <h6 className="mb-0 fw-bold" id="user-name">{akun?.nama}</h6>
            <p className="text-muted small mb-0" id="user-id">ID Pegawai: {akun?.id}</p>
          </div>
        </div>

        <ul className="list-group list-group-flush">
          <li className="list-group-item d-flex justify-content-between align-items-center px-0">
            <span className="text-muted">Posisi</span>
            <span className="fw-medium text-end" id="user-position">{akun?.job}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center px-0">
            <span className="text-muted">Category</span>
            <span className="fw-medium text-end" id="user-cat">{akun?.cat}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center px-0">
            <span className="text-muted">Whatsapp</span>
            <div className="ms-auto">
              <input
                type="tel"
                id="user-wa"
                className="fw-medium text-end me-1 border-0"
                value={wa}
                onChange={(e) => setWa(e.target.value)}
              />
            </div>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center px-0">
            <span className="text-muted">Email</span>
            <div className="ms-auto">
              <input
                type="email"
                id="user-email"
                className="fw-medium text-end me-1 border-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </li>
          <div className="d-flex align-items-center mt-3">
            <button
              className="btn btn-primary ms-auto"
              onClick={() => onUpdate(wa, email)}
            >
              Update
            </button>
          </div>
        </ul>
      </div>
    </div>
  );
}
