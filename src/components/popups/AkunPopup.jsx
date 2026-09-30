import { useState, useEffect } from 'react';

/**
 * AkunPopup — Employee account info panel (mirrors #akun-popup)
 *
 * Props:
 *  show      – boolean
 *  akun      – { nama, id, job, cat, tel, ema }
 *  onUpdate(wa, email) – fn
 *  onClose() – fn
 */
export default function AkunPopup({ show, akun, onUpdate, onClose }) {
  const formatWa = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    if (str.startsWith('0')) return str;
    if (str.startsWith('+62')) return '0' + str.slice(3);
    if (str.startsWith('62')) return '0' + str.slice(2);
    return '0' + str;
  };

  const [wa, setWa] = useState(() => formatWa(akun?.tel));
  const [email, setEmail] = useState(() => akun?.ema ?? '');

  useEffect(() => {
    if (akun?.tel !== undefined) {
      setWa(formatWa(akun.tel));
    }
  }, [akun?.tel]);

  useEffect(() => {
    if (akun?.ema !== undefined) {
      setEmail(akun.ema || '');
    }
  }, [akun?.ema]);

  return (
    <div id="akun-popup" className={`popup-panel ${show ? 'show' : ''}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Informasi Akun Pegawai</h5>
        {onClose && (
          <button
            type="button"
            className="btn-close"
            aria-label="Tutup"
            onClick={onClose}
          />
        )}
      </div>

      <div className="card p-3 mb-2 border-0 shadow-sm bg-light-subtle rounded-3">
        <div className="d-flex align-items-center mb-3">
          <span className="material-icons text-primary me-3" style={{ fontSize: '3rem' }}>
            account_circle
          </span>
          <div>
            <h6 className="mb-0 fw-bold" id="user-name">{akun?.nama || '-'}</h6>
            <p className="text-muted small mb-0" id="user-id">ID Pegawai: {akun?.id || '-'}</p>
          </div>
        </div>

        <ul className="list-group list-group-flush rounded-2 overflow-hidden border">
          <li className="list-group-item d-flex justify-content-between align-items-center px-3 py-2 bg-white">
            <span className="text-muted small">Posisi / Jabatan</span>
            <span className="fw-semibold text-end small" id="user-position">{akun?.job || '-'}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center px-3 py-2 bg-white">
            <span className="text-muted small">Kategori</span>
            <span className="fw-semibold text-end small" id="user-cat">{akun?.cat || '-'}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center px-3 py-2 bg-white">
            <label htmlFor="user-wa" className="text-muted small mb-0">No. WhatsApp</label>
            <div className="ms-auto" style={{ maxWidth: '60%' }}>
              <input
                type="tel"
                id="user-wa"
                className="form-control form-control-sm text-end fw-semibold"
                value={wa}
                placeholder="08xxxxxxxxxx"
                onChange={(e) => setWa(e.target.value)}
              />
            </div>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center px-3 py-2 bg-white">
            <label htmlFor="user-email" className="text-muted small mb-0">Email</label>
            <div className="ms-auto" style={{ maxWidth: '60%' }}>
              <input
                type="email"
                id="user-email"
                className="form-control form-control-sm text-end fw-semibold"
                value={email}
                placeholder="nama@email.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </li>
        </ul>

        <div className="d-flex justify-content-end mt-3">
          <button
            type="button"
            className="btn btn-primary btn-sm px-4 rounded-pill shadow-sm fw-semibold"
            onClick={() => onUpdate(wa, email)}
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}
