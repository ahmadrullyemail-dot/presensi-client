import { useState, useCallback } from 'react';
import ConfirmationModal from '../ConfirmationModal';
import CalendarMultiPicker from '../widgets/CalendarMultiPicker';
import { fileToBase64, getDatesFromRange, MONTH_NAMES } from '../../utils/helpers';

/**
 * PlanAutoModal — "Buat Rencana Absensi Auto" modal (mirrors planAuto())
 *
 * Props:
 *  show      – boolean
 *  onClose() – fn
 *  onSave(payload) – async fn
 */
export default function PlanAutoModal({ show, onClose, onSave }) {
  const [status,        setStatus]        = useState('');
  const [keterangan,    setKeterangan]    = useState('tahunan');
  const [permitFile,    setPermitFile]    = useState(null);
  const [imgError,      setImgError]      = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [dateRange,     setDateRange]     = useState({ start: null, end: null });
  const [showCalendar,  setShowCalendar]  = useState(false);
  const [saving,        setSaving]        = useState(false);

  const isOff  = status === 'Off';
  const isCuti = status === 'Cuti';

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) { setPermitFile(null); setImgError(''); return; }
    if (file.size > 1048576) {
      setImgError(`Ukuran file terlalu besar! Maksimal 1 MB (${file.size} bytes)`);
      setPermitFile(null); e.target.value = '';
    } else {
      setImgError(`Ukuran file sudah benar! (${file.size} bytes)`);
      setPermitFile(file);
    }
  }

  function handleCalendarChange({ selectedDates: sd, dateRange: dr }) {
    setSelectedDates(sd);
    setDateRange(dr);
  }

  function getDatesToSave() {
    if (isOff && dateRange.start && dateRange.end) {
      return getDatesFromRange(dateRange.start, dateRange.end);
    }
    if (isCuti) return selectedDates;
    return [];
  }

  const isValid = useCallback(() => {
    const dates = getDatesToSave();
    if (!status || dates.length === 0) return false;
    if (isCuti && !permitFile) return false;
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, selectedDates, dateRange, permitFile, isCuti]);

  async function handleConfirm() {
    if (!isValid()) return;
    setSaving(true);
    const datesToSave = getDatesToSave();
    const payload = {
      action: 'auto',
      status,
      listTanggal: datesToSave.join(','),
    };
    if (isCuti && permitFile) {
      payload.keterangan    = keterangan;
      payload.file_data     = await fileToBase64(permitFile);
      payload.file_type     = permitFile.type;
      payload.file_name     = permitFile.name;
    }
    await onSave(payload);
    setSaving(false);
    handleReset();
  }

  function handleReset() {
    setStatus(''); setKeterangan('tahunan');
    setPermitFile(null); setImgError('');
    setSelectedDates([]); setDateRange({ start: null, end: null });
    setShowCalendar(false);
    onClose();
  }

  function dateDisplayValue() {
    const dates = getDatesToSave();
    if (dates.length === 0) return '';
    if (isOff && dateRange.start && dateRange.end) {
      const [y1,m1,d1] = dateRange.start.split('-').map(Number);
      const [y2,m2,d2] = dateRange.end.split('-').map(Number);
      return `${d1} ${MONTH_NAMES[m1-1]} ${y1} - ${d2} ${MONTH_NAMES[m2-1]} ${y2} (${dates.length} Hari)`;
    }
    if (selectedDates.length === 1) {
      const [y,m,d] = selectedDates[0].split('-').map(Number);
      return `${d} ${MONTH_NAMES[m-1]} ${y}`;
    }
    return `${selectedDates.length} Tanggal Terpilih`;
  }

  return (
    <ConfirmationModal
      show={show}
      title="Tambah Rencana Absensi Auto"
      message=""
      onConfirm={handleConfirm}
      onCancel={handleReset}
      confirmDisabled={!isValid() || saving}
    >
      <div id="autoLogModal">
        {/* File upload (only for Cuti) */}
        {isCuti && (
          <div className="mb-4 text-start">
            <label htmlFor="auto-log-permit-file" className="form-label fw-semibold">
              Bukti Izin Cuti (KECUALI OFF DUTY)
            </label>
            <input
              type="file"
              className="form-control rounded-3 shadow-sm"
              id="auto-log-permit-file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            <small
              className={`form-text ${imgError.includes('besar') ? 'text-danger' : imgError ? 'text-success' : 'text-muted'}`}
              id="alert-img-auto"
            >
              {imgError || 'Unggah file .jpg atau .png sebagai bukti cuti (maks. 1 MB).'}
            </small>
          </div>
        )}

        {/* Status */}
        <div className="mb-3 text-start">
          <label htmlFor="auto-log-status" className="form-label fw-semibold">Status Absensi</label>
          <select
            className="form-select rounded-3 shadow-sm"
            id="auto-log-status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setSelectedDates([]); setDateRange({ start: null, end: null }); }}
          >
            <option value="" disabled>Pilih Status Absensi</option>
            <option value="Cuti">Cuti</option>
            <option value="Off">Off</option>
          </select>
        </div>

        {/* Keterangan (Cuti only) */}
        {isCuti && (
          <div className="mb-3 text-start">
            <select
              className="form-select rounded-3 shadow-sm"
              id="auto-log-keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
            >
              <option value="tahunan">Tahunan</option>
              <option value="menikah">Pekerja Menikah</option>
              <option value="menikahkanAnak">Menikahkan anak</option>
              <option value="menghitankanAnak">Mengkhitankan anak</option>
              <option value="membaptiskanAnak">Membaptiskan anak</option>
              <option value="mentatahkanGigi">Mentatahkan gigi</option>
              <option value="istriMelahirkan">Istri Melahirkan/Keguguran</option>
              <option value="melahirkan">Pekerja Melahirkan</option>
              <option value="anggotaKeluargaSerumah">Anggota keluarga serumah</option>
              <option value="siomamMeninggal">Suami/Istri, orang tua/mertua, anak atau menantu meninggal dunia</option>
            </select>
          </div>
        )}

        {/* Calendar multi-picker */}
        {status && (
          <div id="calendar-auto" className="mb-4 position-relative text-start">
            <label className="form-label fw-semibold">Tanggal Absensi</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control rounded-start-3 shadow-sm"
                id="auto-date-display"
                placeholder={isOff ? 'Pilih Tanggal Awal dan Akhir (Range)' : 'Pilih Tanggal (Multi-Select)'}
                readOnly
                value={dateDisplayValue()}
                onClick={() => setShowCalendar(v => !v)}
              />
              <button
                className="btn btn-outline-secondary rounded-end-3"
                type="button"
                onClick={() => setShowCalendar(v => !v)}
              >
                📅
              </button>
            </div>
            {showCalendar && (
              <CalendarMultiPicker
                mode={status}
                keterangan={keterangan}
                selectedDates={selectedDates}
                dateRange={dateRange}
                onChange={handleCalendarChange}
              />
            )}
          </div>
        )}
      </div>
    </ConfirmationModal>
  );
}
