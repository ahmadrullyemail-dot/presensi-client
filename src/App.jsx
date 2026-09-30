import { useState, useEffect, useCallback, useRef } from 'react';
import LoadingOverlay from './components/LoadingOverlay';
import MainBoard from './components/MainBoard';
import BottomNavBar from './components/BottomNavBar';
import ConfirmationModal from './components/ConfirmationModal';
import BindingPage from './components/BindingPage';

// Popups
import CicoPopup from './components/popups/CicoPopup';
import IzinPopup from './components/popups/IzinPopup';
import LogPopup from './components/popups/LogPopup';
import PlanPopup from './components/popups/PlanPopup';
import AkunPopup from './components/popups/AkunPopup';

// Modals
import AddLogModal from './components/modals/AddLogModal';
import EditLogModal from './components/modals/EditLogModal';
import KetidakhadiranModal from './components/modals/KetidakhadiranModal';
import PlanAutoModal from './components/modals/PlanAutoModal';
import ShowAutoModal from './components/modals/ShowAutoModal';

// API & Helpers
import * as api from './api/api';
import { getPosition, getDeviceInfo, isMobile } from './utils/helpers';
import { downloadPresensiPDF } from './utils/pdfGenerator';
import { DEMO_UUID, mockUserAgent, mockADay, mockAMonth } from './mockData';

export default function App() {
  // ── Routing: 'checking' | 'binding' | 'main' ────────────────────────────────
  // 'checking' = sedang verifikasi UUID (loading awal)
  // 'binding'  = device belum punya UUID, tampilkan halaman Binding
  const [page, setPage] = useState('checking');
  const [bindingAlert, setBindingAlert] = useState('');

  // ── Global States ──────────────────────────────────────────────────────────
  const [initialLoading, setInitialLoading] = useState(true);
  const [alert, setAlert] = useState('');
  const alertTimerRef = useRef(null);


  const [akun, setAkun] = useState({
    nama: '',
    id: '',
    job: '',
    cat: '',
    pos: '',
    tel: '',
    ema: '',
  });

  const [cico, setCico] = useState({
    checkIn: '-',
    checkOut: '-',
    loadingIn: false,
    loadingOut: false,
  });

  const [todayStatus, setTodayStatus] = useState({
    loading: false,
    data: [],
  });

  const [activePopup, setActivePopup] = useState(null);

  // Monthly Logs State
  const [logs, setLogs] = useState({ log: [], pending: [], reject: [], INFO: [] });
  const [activeLogTab, setActiveLogTab] = useState('log');
  const [logLoading, setLogLoading] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmDisabled: false,
  });

  // Specialized Modals
  const [ketidakhadiranModal, setKetidakhadiranModal] = useState({ show: false, type: 'Cuti' });
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [editLogModal, setEditLogModal] = useState({ show: false, date: '', notes: '' });
  const [showPlanAutoModal, setShowPlanAutoModal] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState({ show: false, loading: false, data: null });

  // ── Alert Helper ───────────────────────────────────────────────────────────
  const showAlert = useCallback((htmlMsg, durationMs = 8000) => {
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    setAlert(htmlMsg);
    if (durationMs > 0) {
      alertTimerRef.current = setTimeout(() => {
        setAlert('');
      }, durationMs);
    }
  }, []);

  // ── Fetch Today's Attendance (aDay) ─────────────────────────────────────────
  const fetchTodayStatus = useCallback(async (currentUuid) => {
    const uuid = currentUuid || localStorage.getItem('uuid');
    if (!uuid) return;
    setTodayStatus(prev => ({ ...prev, loading: true }));

    // ── DEMO MODE ────────────────────────────────────────────────────────────
    if (uuid === DEMO_UUID) {
      const dataArr = mockADay.data;
      let inTime = '-', outTime = '-';
      for (let i = 0; i < dataArr.length; i += 4) {
        if (dataArr[i + 1] === 'Masuk') inTime = dataArr[i + 2];
        if (dataArr[i + 1] === 'Pulang') outTime = dataArr[i + 2];
      }
      setTodayStatus({ loading: false, data: dataArr });
      setCico(prev => ({ ...prev, checkIn: inTime, checkOut: outTime }));
      return;
    }

    try {
      const res = await api.getADay(uuid);
      if (res && res.status === 'login_required') {
        localStorage.removeItem('uuid');
        localStorage.removeItem('admin_uuid');
        setBindingAlert('Sesi perangkat telah berakhir. Silakan daftarkan ulang perangkat Anda.');
        setPage('binding');
        return;
      }
      if (res && res.data) {
        setTodayStatus({ loading: false, data: res.data });

        // Update CICO times based on today status data
        const dataArr = res.data;
        let inTime = '-';
        let outTime = '-';
        for (let i = 0; i < dataArr.length; i += 4) {
          if (dataArr[i + 1] === 'Masuk') inTime = dataArr[i + 2];
          if (dataArr[i + 1] === 'Pulang') outTime = dataArr[i + 2];
        }
        setCico(prev => ({ ...prev, checkIn: inTime, checkOut: outTime }));
      } else {
        setTodayStatus({ loading: false, data: [] });
      }
    } catch (err) {
      console.warn('Gagal memuat status hari ini:', err);
      setTodayStatus({ loading: false, data: [] });
    }
  }, []);

  // ── Initial Setup & UserAgent ──────────────────────────────────────────────
  useEffect(() => {
    if (isMobile()) {
      document.body.classList.add('mobile-body');
    }

    // Check UUID from query string or localStorage
    const params = new URLSearchParams(window.location.search);
    const queryUuid = params.get('uuid');
    const queryAuid = params.get('auid') || params.get('admin_uuid');

    if (queryUuid) localStorage.setItem('uuid', queryUuid);
    if (queryAuid) localStorage.setItem('admin_uuid', queryAuid);

    let uuid = localStorage.getItem('uuid');

    // ── 1. Jika tidak ada UUID: langsung tampilkan Binding Page ──────────────
    if (!uuid) {
      setInitialLoading(false);
      setBindingAlert('');
      setPage('binding');
      return;
    }

    async function initUser() {
      // ── DEMO MODE: bypass semua API ─────────────────────────────────────────
      if (uuid === DEMO_UUID) {
        const res = mockUserAgent;
        setAkun({
          nama: res.nama,
          id: res.id,
          job: res.job,
          cat: res.cat,
          pos: res.pos,
          tel: res.tel,
          ema: res.ema,
        });
        setCico({ checkIn: '-', checkOut: '-', loadingIn: false, loadingOut: false });
        setPage('main');
        fetchTodayStatus(uuid);
        setInitialLoading(false);
        return;
      }

      let lat = 0, lon = 0, acc = 1000;
      try {
        const pos = await getPosition();
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        acc = pos.coords.accuracy;
      } catch (err) {
        console.warn('Geolocation tidak aktif atau ditolak:', err);
      }

      const deviceInfo = getDeviceInfo();
      const userAgentPayload = {
        uuid,
        auid: localStorage.getItem('admin_uuid') || '',
        device: [deviceInfo],
      };

      try {
        const res = await api.getUserAgent(userAgentPayload, lat, lon, acc);
        if (res && res.status === 'success') {
          // ── 2. UUID ADA DAN TELAH DIVERIFIKASI SERVER: Tampilkan di MainBoard ───
          setAkun({
            nama: res.nama || '',
            id: res.id || uuid,
            job: res.job || '',
            cat: res.cat || '',
            pos: res.pos || '',
            tel: res.tel || '',
            ema: res.ema || '',
          });
          if (res.cico) {
            setCico({
              checkIn: res.cico.checkIn ? new Date(res.cico.checkIn).toTimeString().split(' ')[0] : '-',
              checkOut: res.cico.checkOut ? new Date(res.cico.checkOut).toTimeString().split(' ')[0] : '-',
              loadingIn: false,
              loadingOut: false,
            });
          }
          setPage('main');
          fetchTodayStatus(uuid);
        } else {
          // ── 3. UUID ADA TETAPI TIDAK DIVERIFIKASI SERVER: Tampilkan BindingPage ─
          console.warn('Verifikasi UUID ditolak oleh server:', res);
          localStorage.removeItem('uuid');
          localStorage.removeItem('admin_uuid');
          setBindingAlert(res?.message || 'UUID perangkat tidak terverifikasi atau telah kadaluarsa. Silakan lakukan binding perangkat kembali.');
          setPage('binding');
        }
      } catch (e) {
        console.warn('Gagal memverifikasi UUID ke server:', e);
        // Server error / penolakan koneksi saat verifikasi UUID
        localStorage.removeItem('uuid');
        localStorage.removeItem('admin_uuid');
        setBindingAlert('Gagal memverifikasi UUID ke server. Silakan daftarkan ulang perangkat Anda.');
        setPage('binding');
      } finally {
        setInitialLoading(false);
      }
    }

    initUser();
  }, [fetchTodayStatus]);

  // ── Fetch Monthly Logs ─────────────────────────────────────────────────────
  const fetchMonthlyLogs = useCallback(async (tab = 'log') => {
    const uuid = localStorage.getItem('uuid');
    if (!uuid) return;
    setLogLoading(true);

    // ── DEMO MODE ────────────────────────────────────────────────────────────
    if (uuid === DEMO_UUID) {
      const logData = mockAMonth.data[Object.keys(mockAMonth.data)[0]];
      setLogs({
        log: logData.log || [],
        pending: logData.pending || [],
        reject: logData.reject || [],
        INFO: logData.INFO || [],
      });
      setLogLoading(false);
      return;
    }

    const now = new Date();
    try {
      const res = await api.getAMonth(uuid, now.getMonth(), now.getFullYear(), 'full');
      if (res && res.data) {
        const logData = res.data[Object.keys(res.data)[0]] || res.data;
        setLogs({
          log: logData.log || [],
          pending: logData.pending || [],
          reject: logData.reject || [],
          INFO: logData.INFO || [akun.nama, akun.job, akun.cat],
        });
      }
    } catch (e) {
      console.warn('Gagal memuat monthly logs:', e);
    } finally {
      setLogLoading(false);
    }
  }, [akun]);

  // ── Toggle Navigation Popups ───────────────────────────────────────────────
  function handleTogglePopup(name) {
    if (activePopup === name) {
      setActivePopup(null);
    } else {
      setActivePopup(name);
      if (name === 'log') {
        setActiveLogTab('log');
        fetchMonthlyLogs('log');
      }
    }
  }

  function closeAllPopups() {
    setActivePopup(null);
  }

  // ── Check-In / Check-Out Handler ───────────────────────────────────────────
  function handlePresensiAction(actionType) {
    // actionType: 'Check-In' | 'Check-Out'
    closeAllPopups();
    setConfirmModal({
      show: true,
      title: 'Konfirmasi Presensi',
      message: `Pilih <b>Ya, lanjutkan</b> untuk merekam waktu presensi <b>${actionType}</b> pada hari ini, <br>atau pilih <b>Batal</b> untuk membatalkan.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        showAlert(`${actionType} dikonfirmasi. Mencatat presensi dan lokasi GPS...`);

        const isCheckIn = actionType === 'Check-In';
        setCico(prev => ({
          ...prev,
          loadingIn: isCheckIn ? true : prev.loadingIn,
          loadingOut: !isCheckIn ? true : prev.loadingOut,
        }));

        let lat = 0, lon = 0, acc = 1000;
        try {
          const position = await getPosition();
          lat = position.coords.latitude;
          lon = position.coords.longitude;
          acc = position.coords.accuracy;
        } catch (e) {
          console.warn('GPS error:', e);
        }

        const pushCiCo = {
          action: actionType.replace('-', ''),
          uuid: localStorage.getItem('uuid'),
          device: getDeviceInfo(),
          lat,
          lng: lon,
          acc,
        };

        try {
          const res = await api.check(pushCiCo);
          const response = typeof res === 'string' ? JSON.parse(res) : res;

          if (isCheckIn) {
            if (response.checkIn && !response.alert) {
              showAlert(`Presensi ${actionType} Berhasil!`);
              setCico(prev => ({
                ...prev,
                checkIn: new Date(response.checkIn).toTimeString().split(' ')[0],
              }));
            } else if (response.alert) {
              showAlert(`<span class="text-danger">${response.alert}</span>`);
            } else {
              showAlert(`<span class="text-danger">Presensi ${actionType} gagal dicatat oleh server.</span>`);
            }
          } else {
            if (response.checkOut && !response.alert) {
              showAlert(`Presensi ${actionType} Berhasil!`);
              setCico(prev => ({
                ...prev,
                checkOut: new Date(response.checkOut).toTimeString().split(' ')[0],
              }));
            } else if (response.alert) {
              showAlert(`<span class="text-danger">${response.alert}</span>`);
            } else {
              showAlert(`<span class="text-danger">Presensi ${actionType} gagal dicatat oleh server.</span>`);
            }
          }
        } catch (e) {
          console.error(e);
          showAlert(`<span class="text-danger">Gagal melakukan presensi ${actionType}: ${e.message || 'Terjadi kesalahan sistem'}</span>`);
        } finally {
          setCico(prev => ({ ...prev, loadingIn: false, loadingOut: false }));
          fetchTodayStatus();
        }
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, show: false })),
    });
  }

  // ── Ketidakhadiran (Cuti, Izin, Sakit, Off) ─────────────────────────────────
  function handleOpenKetidakhadiran(type) {
    closeAllPopups();
    setKetidakhadiranModal({ show: true, type });
  }

  async function handleSaveKetidakhadiran(pushData) {
    closeAllPopups();
    showAlert(`Memproses pengajuan ${ketidakhadiranModal.type}...`);
    try {
      if (pushData.type === 'Izin') {
        try {
          const pos = await getPosition();
          pushData.lat = pos.coords.latitude;
          pushData.lng = pos.coords.longitude;
          pushData.acc = pos.coords.accuracy;
        } catch (err) {
          console.warn('GPS error:', err);
        }
      }
      pushData.uuid = localStorage.getItem('uuid');
      const res = await api.submitKetidakhadiran(pushData);
      const response = typeof res === 'string' ? JSON.parse(res) : res;
      if (response && response.alert) {
        showAlert(`<span class="text-danger">${response.alert}</span>`);
      } else {
        showAlert(response?.message || `Pengajuan ${pushData.type} berhasil dikirim!`);
      }
    } catch (e) {
      console.error(e);
      showAlert(`<span class="text-danger">Gagal mengajukan ${pushData.type}: ${e.message || 'Terjadi kesalahan'}</span>`);
    } finally {
      fetchTodayStatus();
    }
  }

  // ── Delete Today's Log ─────────────────────────────────────────────────────
  function handleDeleteTodayLog(id, action, time) {
    setConfirmModal({
      show: true,
      title: 'Hapus Log Presensi Hari Ini',
      message: `Apakah Anda yakin ingin membatalkan presensi <b>${action}</b> pada jam <b>${time}</b>?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        showAlert(`Menghapus log presensi ${action}...`);
        const now = new Date();
        try {
          const res = await api.deleteLog(localStorage.getItem('uuid'), now.getMonth(), now.getFullYear(), action, time);
          const response = typeof res === 'string' ? JSON.parse(res) : res;
          if (response && response.alert) {
            showAlert(`<span class="text-danger">${response.alert}</span>`);
          } else {
            showAlert(response?.message || `Presensi ${action} berhasil dihapus.`);
          }
        } catch (e) {
          console.error(e);
          showAlert(`<span class="text-danger">Gagal menghapus presensi ${action}: ${e.message || 'Terjadi kesalahan'}</span>`);
        } finally {
          fetchTodayStatus();
        }
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, show: false })),
    });
  }

  // ── Pending Log Deletion ───────────────────────────────────────────────────
  function handleDeletePending(date, notes) {
    const actionType = (notes || '').split(' ')[0];
    const waktu = (notes || '').split(' ')[1];
    setConfirmModal({
      show: true,
      title: 'Hapus Pending Presensi',
      message: `Apakah Anda yakin ingin membatalkan pending presensi <b>${actionType}</b> pada tanggal <b>${date}</b>?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        showAlert('Menghapus pending presensi...');
        const now = new Date();
        try {
          const res = await api.removeLog(localStorage.getItem('uuid'), now.getMonth(), now.getFullYear(), date, actionType, waktu);
          const response = typeof res === 'string' ? JSON.parse(res) : res;
          if (response && response.alert) {
            showAlert(`<span class="text-danger">${response.alert}</span>`);
          } else {
            showAlert(response?.message || 'Pending presensi berhasil dihapus.');
          }
        } catch (e) {
          console.error(e);
          showAlert(`<span class="text-danger">Gagal menghapus pending presensi: ${e.message || 'Terjadi kesalahan'}</span>`);
        } finally {
          fetchMonthlyLogs(activeLogTab);
        }
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, show: false })),
    });
  }

  // ── Add Presensi Manual Flow ───────────────────────────────────────────────
  async function handleSaveAddLog(payload) {
    showAlert('Form sedang diproses, mohon menunggu...');
    const now = new Date();
    try {
      const fullPayload = {
        ...payload,
        uuid: localStorage.getItem('uuid'),
        sheet: now.getMonth(),
        tahun: now.getFullYear(),
      };
      const res = await api.addLog(fullPayload);
      const response = typeof res === 'string' ? JSON.parse(res) : res;
      if (response && response.alert) {
        showAlert(`<span class="text-danger">${response.alert}</span>`);
      } else {
        showAlert(response?.message || 'Penambahan presensi berhasil diajukan!');
        fetchMonthlyLogs('pending');
        setActiveLogTab('pending');
      }
    } catch (e) {
      console.error(e);
      showAlert(`<span class="text-danger">Gagal menambahkan presensi: ${e.message || 'Terjadi kesalahan'}</span>`);
    }
  }

  // ── Edit Presensi Flow ─────────────────────────────────────────────────────
  function handleOpenEditLog(date, notes) {
    setEditLogModal({ show: true, date, notes });
  }

  async function handleSaveEditLog(payload) {
    showAlert('Menyimpan perubahan presensi...');
    try {
      const fullPayload = {
        ...payload,
        uuid: localStorage.getItem('uuid'),
      };
      const res = await api.editLog(fullPayload);
      const response = typeof res === 'string' ? JSON.parse(res) : res;
      if (response && response.alert) {
        showAlert(`<span class="text-danger">${response.alert}</span>`);
      } else {
        showAlert(response?.message || 'Perubahan presensi berhasil diajukan (Pending)!');
        fetchMonthlyLogs('pending');
        setActiveLogTab('pending');
      }
    } catch (e) {
      console.error(e);
      showAlert(`<span class="text-danger">Gagal mengajukan perubahan: ${e.message || 'Terjadi kesalahan'}</span>`);
    }
  }

  // ── Download PDF Flow ──────────────────────────────────────────────────────
  function handleDownloadPDF() {
    showAlert('<span class="fw-bold">Mempersiapkan file PDF untuk didownload, harap menunggu...</span>', 10000);
    closeAllPopups();
    try {
      downloadPresensiPDF(logs, akun);
    } catch (err) {
      console.error('PDF error:', err);
      showAlert('<span class="text-danger">Gagal membuat PDF: ' + err.message + '</span>');
    }
  }

  // ── Auto Off & Cuti Handlers ───────────────────────────────────────────────
  async function handleShowAuto() {
    closeAllPopups();
    setShowAutoModal({ show: true, loading: true, data: null });
    try {
      const res = await api.showAuto(localStorage.getItem('uuid'));
      setShowAutoModal({ show: true, loading: false, data: res?.data || res });
    } catch (err) {
      console.warn('Gagal memuat auto plan:', err);
      showAlert(`<span class="text-danger">Gagal memuat rencana absensi: ${err.message || 'Terjadi kesalahan'}</span>`);
      setShowAutoModal({
        show: true,
        loading: false,
        data: null,
      });
    }
  }

  function handleOpenPlanAuto() {
    closeAllPopups();
    setShowPlanAutoModal(true);
  }

  async function handleSavePlanAuto(payload) {
    showAlert('Menyimpan rencana absensi...');
    try {
      const fullPayload = {
        ...payload,
        uuid: localStorage.getItem('uuid'),
      };
      const res = await api.autoLog(fullPayload);
      const response = typeof res === 'string' ? JSON.parse(res) : res;
      if (response && response.alert) {
        showAlert(`<span class="text-danger">${response.alert}</span>`);
      } else {
        showAlert(response?.message || 'Rencana absensi berhasil disimpan!');
      }
    } catch (e) {
      console.error(e);
      showAlert(`<span class="text-danger">Gagal menyimpan rencana absensi: ${e.message || 'Terjadi kesalahan'}</span>`);
    }
  }

  // ── Account Update ─────────────────────────────────────────────────────────
  async function handleUpdateAkun(wa, email) {
    showAlert('Memperbarui informasi akun...');
    try {
      const res = await api.updateAkun(localStorage.getItem('uuid'), wa, email);
      const response = typeof res === 'string' ? JSON.parse(res) : res;
      if (response && response.alert) {
        showAlert(`<span class="text-danger">${response.alert}</span>`);
      } else {
        setAkun(prev => ({ ...prev, tel: wa, ema: email }));
        showAlert(response?.message || 'Data akun berhasil diperbarui!');
      }
    } catch (e) {
      console.error(e);
      showAlert(`<span class="text-danger">Gagal memperbarui akun: ${e.message || 'Terjadi kesalahan'}</span>`);
    }
  }

  // ── Callback dipanggil BindingPage setelah UUID diterima ──────────────────
  function handleBound(newUuid) {
    setBindingAlert('');
    setPage('checking');       // paksa re-init
    setInitialLoading(true);
    // Trigger ulang useEffect dengan mereset state UUID-dependent
    setAkun({ nama: 'Pegawai', id: '-', job: '-', cat: '-', pos: '-', tel: '', ema: '' });
    window.location.reload(); // reload paling bersih untuk memuat halaman utama
  }

  // ── Page: checking ─────────────────────────────────────────────────────────
  if (page === 'checking') {
    return (
      <div className="main-container d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Memverifikasi sesi...</span>
        </div>
      </div>
    );
  }

  // ── Page: binding ──────────────────────────────────────────────────────────
  if (page === 'binding') {
    return (
      <div className="main-container">
        <BindingPage onBound={handleBound} initialAlert={bindingAlert} />
      </div>
    );
  }

  // ── Page: main ─────────────────────────────────────────────────────────────
  return (
    <div className="main-container" id="main-content">
      <LoadingOverlay show={initialLoading} />

      {/* Main Clock, Header & Today Attendance Card */}
      <MainBoard
        akunNama={akun.nama}
        akunPosition={akun.pos || akun.job}
        alert={alert}
        setAlert={setAlert}
        todayStatus={todayStatus}
        onDeleteLog={handleDeleteTodayLog}
      />

      {/* Popup Backdrop */}
      {activePopup && (
        <div
          className="popup-backdrop"
          onClick={closeAllPopups}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            zIndex: 1005,
            backdropFilter: 'blur(1px)',
          }}
        />
      )}

      {/* Popups */}
      <CicoPopup
        show={activePopup === 'cico'}
        checkIn={cico.checkIn}
        checkOut={cico.checkOut}
        loadingIn={cico.loadingIn}
        loadingOut={cico.loadingOut}
        onCheckIn={() => handlePresensiAction('Check-In')}
        onCheckOut={() => handlePresensiAction('Check-Out')}
        onClose={closeAllPopups}
      />

      <IzinPopup
        show={activePopup === 'izin'}
        onKetidakhadiran={handleOpenKetidakhadiran}
        onClose={closeAllPopups}
      />

      <LogPopup
        show={activePopup === 'log'}
        activeTab={activeLogTab}
        onTabChange={(tab) => {
          setActiveLogTab(tab);
          fetchMonthlyLogs(tab);
        }}
        loading={logLoading}
        logs={logs}
        onEdit={handleOpenEditLog}
        onDelete={handleDeletePending}
        onAddLog={() => {
          closeAllPopups();
          setShowAddLogModal(true);
        }}
        onDownload={handleDownloadPDF}
        onClose={closeAllPopups}
      />

      <PlanPopup
        show={activePopup === 'plan'}
        onShow={handleShowAuto}
        onPlan={handleOpenPlanAuto}
        onClose={closeAllPopups}
      />

      <AkunPopup
        show={activePopup === 'akun'}
        akun={akun}
        onUpdate={handleUpdateAkun}
        onClose={closeAllPopups}
      />

      {/* Bottom Navigation */}
      <BottomNavBar
        activePopup={activePopup}
        onToggle={handleTogglePopup}
      />

      {/* Dialog Modals */}
      <ConfirmationModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
        confirmDisabled={confirmModal.confirmDisabled}
      />

      <KetidakhadiranModal
        show={ketidakhadiranModal.show}
        type={ketidakhadiranModal.type}
        onClose={() => setKetidakhadiranModal({ show: false, type: 'Cuti' })}
        onSave={handleSaveKetidakhadiran}
      />

      <AddLogModal
        show={showAddLogModal}
        onClose={() => setShowAddLogModal(false)}
        onSave={handleSaveAddLog}
      />

      <EditLogModal
        key={`${editLogModal.date}-${editLogModal.notes}`}
        show={editLogModal.show}
        date={editLogModal.date}
        notes={editLogModal.notes}
        onClose={() => setEditLogModal({ show: false, date: '', notes: '' })}
        onSave={handleSaveEditLog}
      />

      <PlanAutoModal
        show={showPlanAutoModal}
        onClose={() => setShowPlanAutoModal(false)}
        onSave={handleSavePlanAuto}
      />

      <ShowAutoModal
        show={showAutoModal.show}
        loading={showAutoModal.loading}
        data={showAutoModal.data}
        onClose={() => setShowAutoModal({ show: false, loading: false, data: null })}
      />
    </div>
  );
}
