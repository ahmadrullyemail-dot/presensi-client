import { useState, useCallback } from 'react';
import ConfirmationModal from '../ConfirmationModal';
import TimePicker from '../widgets/TimePicker';
import CalendarPicker from '../widgets/CalendarPicker';
import { fileToBase64, padTwo, MONTH_NAMES } from '../../utils/helpers';

/**
 * AddLogModal — "Tambah Presensi" modal flow
 *
 * Props:
 *  show       – boolean
 *  onClose()  – fn
 *  onSave(payload) – async fn
 */
export default function AddLogModal({ show, onClose, onSave }) {
  const now = new Date();

  const [permitFile,    setPermitFile]    = useState(null);
  const [permitError,   setPermitError]   = useState('');
  const [status,        setStatus]        = useState('');
  const [selectedDate,  setSelectedDate]  = useState('');
  const [hour,          setHour]          = useState(padTwo(now.getHours()));
  const [minute,        setMinute]        = useState(padTwo(now.getMinutes()));
  const [second,        setSecond]        = useState(padTwo(now.getSeconds()));
  const [showCalendar,  setShowCalendar]  = useState(false);
  const [showTimePicker,setShowTimePicker]= useState(false);
  const [saving,        setSaving]        = useState(false);

  const needsTime = ['Masuk', 'Pulang', 'Izin'].includes(status);
  const isOff     = status === 'Off';

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) { setPermitFile(null); setPermitError(''); return; }
    if (file.size > 1048576) {
      setPermitError(`Ukuran file terlalu besar! Maksimal 1 MB (${file.size} bytes)`);
      setPermitFile(null);
      e.target.value = '';
    } else {
      setPermitError(`Ukuran file sudah benar! (${file.size} bytes)`);
      setPermitFile(file);
    }
  }

  function handleTimeChange(unit, val) {
    if (unit === 'hour')   setHour(val);
    if (unit === 'minute') setMinute(val);
    if (unit === 'second') setSecond(val);
  }

  const isValid = useCallback(() => {
    if (!status || !selectedDate) return false;
    if (needsTime && (!hour || !minute || !second)) return false;
    if (!isOff && !permitFile) return false;
    return true;
  }, [status, selectedDate, needsTime, hour, minute, second, isOff, permitFile]);

  function handleReset() {
    setPermitFile(null); setPermitError('');
    setStatus(''); setSelectedDate('');
    const n = new Date();
    setHour(padTwo(n.getHours())); setMinute(padTwo(n.getMinutes())); setSecond(padTwo(n.getSeconds()));
    setShowCalendar(false); setShowTimePicker(false);
    onClose();
  }

  async function handleConfirm() {
    if (!isValid()) return;
    setSaving(true);
    let base64 = '', mime = '', fname = '';
    if (!isOff && permitFile) {
      base64 = await fileToBase64(permitFile);
      mime   = permitFile.type;
      fname  = permitFile.name;
    }
    const timeStr = `${hour}:${minute}:${second}`;
    await onSave({
      action: 'add',
      status,
      tanggal: selectedDate,
      time: timeStr,
      file_data: base64,
      file_mime_type: mime,
      file_name: fname,
    });
    setSaving(false);
    handleReset();
  }

  // Format display date
  function displayDate() {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    return `${d} ${MONTH_NAMES[m-1]} ${y}`;
  }

  return (
    <ConfirmationModal
      show={show}
      title="Tambah Presensi"
      message=""
      onConfirm={handleConfirm}
      onCancel={handleReset}
      confirmDisabled={!isValid() || saving}
    >
      <div id="addLogModal">
        {/* Permit file */}
        {!isOff && (
          <div id="permit-file-container" className="mb-4 text-start">
            <label htmlFor="add-log-permit-file" className="form-label fw-semibold">
              Izin Perubahan Presensi <span className="text-danger">(Wajib)</span>
            </label>
            <input
              type="file"
              className="form-control rounded-3 shadow-sm"
              id="add-log-permit-file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            <small
              className={`form-text ${permitError.includes('besar') ? 'text-danger' : permitError ? 'text-success' : 'text-muted'}`}
              id="alert-img-add"
            >
              {permitError || 'Unggah file .jpg atau .png sebagai izin (maks. 1 MB).'}
            </small>
          </div>
        )}

        {/* Status */}
        <div className="mb-3 text-start">
          <label htmlFor="add-log-status" className="form-label fw-semibold">Status Presensi</label>
          <select
            className="form-select rounded-3 shadow-sm"
            id="add-log-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="" disabled>Pilih Status Presensi</option>
            <option value="Masuk">Masuk</option>
            <option value="Pulang">Pulang</option>
            <option value="Izin">Izin</option>
            <option value="Sakit">Sakit</option>
            <option value="Cuti">Cuti</option>
            <option value="Off">Off</option>
          </select>
        </div>

        {/* Date picker */}
        <div className="mb-4 position-relative text-start">
          <label className="form-label fw-semibold">Tanggal Presensi</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control rounded-start-3 shadow-sm"
              id="add-date-display"
              placeholder="Pilih Tanggal"
              readOnly
              value={displayDate()}
              onClick={() => { setShowCalendar(v => !v); setShowTimePicker(false); }}
            />
            <button
              className="btn btn-outline-secondary rounded-end-3"
              type="button"
              onClick={() => { setShowCalendar(v => !v); setShowTimePicker(false); }}
            >
              📅
            </button>
          </div>
          {showCalendar && (
            <CalendarPicker
              selectedDate={selectedDate}
              onSelect={(d) => { setSelectedDate(d); setShowCalendar(false); }}
              onClose={() => setShowCalendar(false)}
            />
          )}
        </div>

        {/* Time picker */}
        {needsTime && (
          <div id="time-input-container" className="mb-4 position-relative text-start">
            <label className="form-label fw-semibold">Waktu (HH:MM:SS)</label>
            <input
              type="text"
              className={`form-control shadow-sm rounded-3 ${hour && minute && second ? 'is-valid' : ''}`}
              id="add-time-display"
              placeholder="Pilih Waktu"
              readOnly
              value={hour && minute && second ? `${hour}:${minute}:${second}` : ''}
              onClick={() => { setShowTimePicker(v => !v); setShowCalendar(false); }}
            />
            {showTimePicker && (
              <div
                id="add-time-picker-widget"
                className="p-3 rounded-3 mt-2"
                style={{ display: 'block' }}
              >
                <TimePicker
                  prefix="add-popup"
                  hour={hour}
                  minute={minute}
                  second={second}
                  onChange={handleTimeChange}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </ConfirmationModal>
  );
}
