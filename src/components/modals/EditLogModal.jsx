import { useState, useCallback } from 'react';
import ConfirmationModal from '../ConfirmationModal';
import TimePicker from '../widgets/TimePicker';
import { fileToBase64, formatIndonesianDate } from '../../utils/helpers';

/**
 * EditLogModal — edit an existing attendance log (mirrors handleEdit)
 *
 * Props:
 *  show         – boolean
 *  date         – ISO date string
 *  notes        – 'Masuk 08:00:00' etc.
 *  onClose()    – fn
 *  onSave(payload) – async fn
 */
export default function EditLogModal({ show, date, notes, onClose, onSave }) {
  const [hour,      setHour]      = useState(() => (notes || '').split(' ')[1]?.split(':')[0] ?? '00');
  const [minute,    setMinute]    = useState(() => (notes || '').split(' ')[1]?.split(':')[1] ?? '00');
  const [second,    setSecond]    = useState(() => (notes || '').split(' ')[1]?.split(':')[2] ?? '00');
  const [imageFile, setImageFile] = useState(null);
  const [imgError,  setImgError]  = useState('');
  const [saving,    setSaving]    = useState(false);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) { setImageFile(null); setImgError(''); return; }
    if (file.size > 1048576) {
      setImgError(`Ukuran file terlalu besar! Maksimal 1 MB (${file.size} bytes)`);
      setImageFile(null);
      e.target.value = '';
    } else {
      setImgError(`Ukuran file sudah benar! (${file.size} bytes)`);
      setImageFile(file);
    }
  }

  function handleTimeChange(unit, val) {
    if (unit === 'hour')   setHour(val);
    if (unit === 'minute') setMinute(val);
    if (unit === 'second') setSecond(val);
  }

  const isValid = useCallback(
    () => !!imageFile && !!hour && !!minute && !!second,
    [imageFile, hour, minute, second]
  );

  async function handleConfirm() {
    if (!isValid()) return;
    setSaving(true);
    const base64 = await fileToBase64(imageFile);
    const actionType = (notes || '').split(' ')[0];
    const oldTime    = (notes || '').split(' ')[1];
    await onSave({
      action: 'edit',
      status: actionType,
      tanggal: date,
      time: `${hour}:${minute}:${second}`,
      waktu: oldTime,
      file_data: base64,
      file_mime_type: imageFile.type,
      file_name: imageFile.name,
      sheet: new Date().getMonth(),
      tahun: new Date().getFullYear(),
    });
    setSaving(false);
    onClose();
  }

  if (!show) return null;

  const actionType = (notes || '').split(' ')[0];
  const dateLabel  = date ? formatIndonesianDate(date) : '';

  return (
    <ConfirmationModal
      show={show}
      title="Konfirmasi Edit"
      message={`Apakah Anda yakin melakukan <b>Edit</b> waktu <b>${actionType}</b> pada <b>${dateLabel}</b>? Presensi akan menjadi pending.`}
      onConfirm={handleConfirm}
      onCancel={onClose}
      confirmDisabled={!isValid() || saving}
    >
      {/* Image upload */}
      <div className="mb-4 text-start">
        <label htmlFor="edit-log-image" className="form-label fw-semibold">
          Bukti Foto (Image Proof)
        </label>
        <input
          type="file"
          className="form-control rounded-3 shadow-sm"
          id="edit-log-image"
          accept="image/*"
          onChange={handleFileChange}
        />
        <small
          className={`form-text ${imgError.includes('besar') ? 'text-danger' : imgError ? 'text-success' : 'text-muted'}`}
          id="alert-img"
        >
          {imgError || 'Unggah image (Wajib, maks. 1 MB).'}
        </small>
      </div>

      {/* Time picker */}
      <div className="mb-4 text-start">
        <label className="form-label fw-semibold">Ubah Waktu (HH:MM:SS)</label>
        <div id="embedded-time-picker" className="p-3 rounded-3">
          <TimePicker
            prefix="popup"
            hour={hour}
            minute={minute}
            second={second}
            onChange={handleTimeChange}
          />
        </div>
      </div>
    </ConfirmationModal>
  );
}
