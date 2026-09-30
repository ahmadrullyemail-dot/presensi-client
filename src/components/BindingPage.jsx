import { useState, useEffect, useRef } from 'react';
import { getPosition, formatDate } from '../utils/helpers';
import * as api from '../api/api';

/**
 * BindingPage — halaman pendaftaran perangkat
 *
 * Ditampilkan ketika device BELUM memiliki UUID di localStorage.
 * Setelah binding berhasil, server mengembalikan UUID yang disimpan
 * secara permanen di localStorage, lalu onBound() dipanggil agar
 * App.jsx pindah ke halaman utama.
 *
 * Props:
 *  onBound() — callback dipanggil setelah UUID berhasil diterima dari server
 *  initialAlert — pesan awal jika diarahkan dari validasi UUID gagal
 */
export default function BindingPage({ onBound, initialAlert = '' }) {
  const [idPegawai, setIdPegawai]       = useState('');
  const [positionInfo, setPositionInfo] = useState('Memeriksa izin lokasi...');
  const [loading, setLoading]           = useState(false);
  const [alertMsg, setAlertMsg]         = useState(initialAlert);
  const [showModal, setShowModal]       = useState(false);
  const coordsRef = useRef({ lat: 0, lon: 0, acc: 1000 });

  const timeRef = useRef(null);
  const dateRef = useRef(null);

  // Sync initialAlert jika ada perubahan dari parent
  useEffect(() => {
    if (initialAlert) {
      setAlertMsg(initialAlert);
    }
  }, [initialAlert]);

  // ── Real-time clock ──────────────────────────────────────────────────────
  useEffect(() => {
    function tick() {
      const now = new Date();
      if (timeRef.current)
        timeRef.current.textContent =
          `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      if (dateRef.current)
        dateRef.current.textContent = formatDate(now);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Get GPS & position info from backend ────────────────────────────────
  useEffect(() => {
    async function checkPosition() {
      let lat = 0, lon = 0, acc = 1000;
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        setPositionInfo(`Status Izin Browser: ${perm.state}`);

        if (perm.state === 'granted' || perm.state === 'prompt') {
          const pos = await getPosition();
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          acc = pos.coords.accuracy;
        }
      } catch (e) {
        console.warn('Geolocation error:', e);
      }

      coordsRef.current = { lat, lon, acc };

      try {
        const res = await api.checkPosition(lat, lon, acc);
        if (res && res.length > 0) {
          setPositionInfo(res[0]);
        }
      } catch (e) {
        console.warn('getPosition API error:', e);
      }
    }

    checkPosition();
  }, []);

  // ── Handle binding confirmation ─────────────────────────────────────────
  async function handleBind() {
    const trimmedId = idPegawai.toUpperCase().trim();
    if (!trimmedId) {
      setAlertMsg('Nomor Pegawai tidak boleh kosong.');
      return;
    }
    setAlertMsg('');
    setShowModal(true);
  }

  async function confirmBind() {
    setShowModal(false);
    setLoading(true);
    setAlertMsg('');

    const { lat, lon, acc } = coordsRef.current;

    const payload = {
      idPegawai: idPegawai.toUpperCase().trim(),
      uuid: localStorage.getItem('uuid') || null,
      lat,
      lon,
      acc,
    };

    try {
      const res = await api.binder(payload);

      if (res && res.status === 'success' && res.uuid) {
        // Simpan UUID secara permanen di localStorage
        localStorage.setItem('uuid', res.uuid);
        if (res.admin_uuid) localStorage.setItem('admin_uuid', res.admin_uuid);
        setAlertMsg('Binding berhasil! Memuat halaman utama...');
        setTimeout(() => onBound(res.uuid), 800);
      } else if (res && res.status === 'already_bound') {
        setAlertMsg(`⚠️ ${res.message || 'Perangkat ini sudah terikat dengan akun lain.'}`);
      } else if (res && res.status === 'not_found') {
        setAlertMsg(`❌ ${res.message || 'No Pegawai tidak ditemukan. Hubungi Admin.'}`);
      } else if (res && res.status === 'login_required') {
        localStorage.removeItem('uuid');
        setAlertMsg(`⚠️ ${res.message || 'Sesi tidak valid. Silakan ulangi binding.'}`);
      } else {
        setAlertMsg(res?.message || 'Binding gagal. Silakan coba lagi.');
      }
    } catch (e) {
      console.error('Binding error:', e);
      setAlertMsg(e.message || 'Gagal terhubung ke server. Pastikan koneksi internet aktif.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Loading overlay */}
      {loading && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(255,255,255,0.85)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
          }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Main layout */}
      <main className="main-clock mb-2" id="main-display">
        {/* Logo & header */}
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
          <h6 className="mb-1 small text-muted">binding</h6>
          <hr />
        </div>

        {/* Clock */}
        <div className="clock-group-container">
          <div className="main-time-display" id="main-time" ref={timeRef}>00:00:00</div>
          <div className="main-date-display mb-5" id="main-date" ref={dateRef}>...</div>
        </div>

        {/* Binding form */}
        <div className="mt-2 text-muted">
          <div id="formIdPegawai" className="m-3 text-start">
            <label htmlFor="idPegawai" className="form-label fw-semibold">
              No Pegawai:
            </label>
            <input
              type="text"
              id="idPegawai"
              className="form-control rounded-3 text-center text-uppercase shadow-sm"
              placeholder="Contoh: EMP-001"
              value={idPegawai}
              onChange={(e) => setIdPegawai(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleBind()}
              autoCapitalize="characters"
              autoComplete="off"
            />
          </div>

          {alertMsg && (
            <div className="mx-3 mb-2">
              <small
                className={`form-text ${
                  alertMsg.startsWith('Binding berhasil')
                    ? 'text-success fw-semibold'
                    : 'text-danger'
                }`}
              >
                {alertMsg}
              </small>
            </div>
          )}

          <div className="d-flex m-3 col-auto">
            <button
              type="button"
              id="binding"
              className="btn btn-success col-12 shadow-sm rounded-pill"
              onClick={handleBind}
              disabled={loading || !idPegawai.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Proses...
                </>
              ) : 'Binding'}
            </button>
          </div>

          {/* Tombol Demo / Preview */}
          <div className="mx-3 mb-2 text-center">
            <hr className="my-2" />
            <small className="text-muted d-block mb-2">Belum punya akun? Coba tampilan demo</small>
            <button
              type="button"
              id="demo-mode-btn"
              className="btn btn-outline-secondary btn-sm rounded-pill px-4"
              onClick={() => {
                localStorage.setItem('uuid', 'DEMO');
                onBound('DEMO');
              }}
            >
              🔍 Lihat Demo
            </button>
          </div>
        </div>

        {/* GPS Position info */}
        <div className="text-center text-muted small mx-3">
          <span className="fw-semibold">Check Position:</span>
          <p className="text-medium fw-bold mt-1" id="unbind-position">
            {positionInfo}
          </p>
        </div>
      </main>

      {/* Confirmation Modal */}
      <div
        className={`custom-modal ${showModal ? 'show' : ''}`}
        style={{ display: showModal ? 'flex' : 'none' }}
        onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
      >
        <div className="custom-modal-content">
          <h5 className="mb-3">Konfirmasi Binding</h5>
          <p id="modal-message" className="mb-4">
            Apakah Anda yakin ingin melakukan <b>Binding</b> dengan No Pegawai{' '}
            <b>{idPegawai.toUpperCase().trim()}</b>?<br />
            <small className="text-muted">
              Perangkat ini akan terhubung secara permanen dengan akun tersebut.
            </small>
          </p>
          <div className="d-flex justify-content-around">
            <button
              id="modal-cancel-btn"
              className="btn custom-modal-btn-cancel rounded-pill px-4"
              onClick={() => setShowModal(false)}
            >
              Batal
            </button>
            <button
              id="modal-confirm-btn"
              className="btn custom-modal-btn-confirm rounded-pill px-4"
              onClick={confirmBind}
            >
              Ya, Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
