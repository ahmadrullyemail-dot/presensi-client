import { useState, useCallback } from 'react';
import ConfirmationModal from '../ConfirmationModal';
import { fileToBase64 } from '../../utils/helpers';

/**
 * KetidakhadiranModal — Cuti / Izin / Sakit / Off submission (mirrors handleMenuKetidakhadiran)
 *
 * Props:
 *  show      – boolean
 *  type      – 'Cuti'|'Izin'|'Sakit'|'Off'
 *  onClose() – fn
 *  onSave(pushData) – async fn
 */
export default function KetidakhadiranModal({ show, type, onClose, onSave }) {
  const [permitFile, setPermitFile] = useState(null);
  const [imgError,   setImgError]   = useState('');
  const [keterangan, setKeterangan] = useState('tahunan');
  const [remark,     setRemark]     = useState('');
  const [saving,     setSaving]     = useState(false);

  const isOff = type === 'Off';

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) { setPermitFile(null); setImgError(''); return; }
    if (file.size > 1048576) {
      setImgError(`Ukuran file terlalu besar! Maksimal 1 MB (${file.size} bytes)`);
      setPermitFile(null);
      e.target.value = '';
    } else {
      setImgError(`Ukuran file sudah benar! (${file.size} bytes)`);
      setPermitFile(file);
    }
  }

  const isValid = useCallback(() => {
    if (isOff) return true;
    return !!permitFile;
  }, [isOff, permitFile]);

  function handleReset() {
    setPermitFile(null); setImgError('');
    setKeterangan('tahunan'); setRemark('');
    onClose();
  }

  async function handleConfirm() {
    if (!isValid()) return;
    setSaving(true);

    const pushData = {
      type,
      file_data: '',
      file_type: '',
      file_name: '',
      lat: 0, lng: 0, acc: 1000,
    };

    if (type === 'Cuti' || type === 'Izin') {
      pushData.remark = type === 'Cuti' ? keterangan : remark;
    }

    if (!isOff && permitFile) {
      pushData.file_data = await fileToBase64(permitFile);
      pushData.file_type = permitFile.type;
      pushData.file_name = permitFile.name;
    }

    await onSave(pushData);
    setSaving(false);
    handleReset();
  }

  const titleMap = { Cuti: 'Pengajuan Cuti', Izin: 'Pengajuan Izin', Sakit: 'Pengajuan Sakit', Off: 'Pengajuan Off' };
  const msgMap = {
    Cuti:  'Lampirkan image dengan format <br><b>.jpg .jpeg .png</b> <br>untuk pengajuan Cuti hari ini',
    Izin:  'Lampirkan image dengan format <br><b>.jpg .jpeg .png</b> <br>untuk pengajuan Izin hari ini',
    Sakit: 'Lampirkan image dengan format <br><b>.jpg .jpeg .png</b> <br>untuk pengajuan Sakit hari ini',
    Off:   'Pilih <b>Ya, lanjutkan</b> untuk merekam aktifitas Off Duty pada hari ini, <br>atau pilih <b>Batal</b> untuk membatalkan.',
  };

  return (
    <ConfirmationModal
      show={show}
      title={titleMap[type] ?? `Pengajuan ${type}`}
      message={msgMap[type] ?? ''}
      onConfirm={handleConfirm}
      onCancel={handleReset}
      confirmDisabled={!isValid() || saving}
    >
      {/* Cuti jenis */}
      {type === 'Cuti' && (
        <div className="input-group mb-2 mt-2 text-start">
          <span className="input-group-text">Jenis</span>
          <select
            className="form-select shadow-sm"
            id="ketidakhadiran-log-keterangan"
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

      {/* Izin remark */}
      {type === 'Izin' && (
        <div className="input-group mb-2 mt-2 text-start">
          <span className="input-group-text">Remark</span>
          <input
            type="text"
            className="form-control"
            id="ketidakhadiran-log-keterangan"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>
      )}

      {/* File upload */}
      {!isOff && (
        <div className="mb-4 text-start">
          <label htmlFor="ketidakhadiran-log-permit-file" className="form-label fw-semibold">
            Bukti {type} Absensi <span className="text-danger">(Wajib)</span>
          </label>
          <input
            type="file"
            className="form-control rounded-3 shadow-sm"
            id="ketidakhadiran-log-permit-file"
            accept=".jpg,.jpeg,.png"
            onChange={handleFileChange}
          />
          <small
            className={`form-text ${imgError.includes('besar') ? 'text-danger' : imgError ? 'text-success' : 'text-muted'}`}
            id="alert-img-log"
          >
            {imgError || 'Unggah file .jpg atau .png sebagai bukti (maks. 1 MB).'}
          </small>
        </div>
      )}
    </ConfirmationModal>
  );
}
