import { useState } from 'react';
import ConfirmationModal from '../ConfirmationModal';
import { formatIndonesianDate } from '../../utils/helpers';

/**
 * ShowAutoModal — displays planned Off Duty, Cuti Tahunan, and Cuti Lainnya
 *
 * Props:
 *  show      – boolean
 *  loading   – boolean
 *  data      – { off: { dates, display }, tahunan: { dates, url, thumbnail }, nonTahunan: { dates, keterangan, url, thumbnail } }
 *  onClose() – fn
 */
export default function ShowAutoModal({ show, loading, data, onClose }) {
  const [activeTab, setActiveTab] = useState('off');

  if (!show) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  function renderDateList(dates) {
    if (!dates || dates.length === 0) {
      return <p className="text-muted text-center py-3">Tidak ada tanggal tercatat.</p>;
    }

    return (
      <div className="mt-3">
        <h6 className="fw-semibold text-secondary mb-2">
          Daftar Tanggal Absen ({dates.length} hari)
        </h6>
        <ul className="list-group">
          {dates.map((dateStr, idx) => {
            const dateObj = new Date(dateStr);
            const isoStr = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : '';
            const isToday = isoStr === todayStr;
            return (
              <li
                key={idx}
                className={`list-group-item-ketidakhadiran d-flex justify-content-between align-items-center p-2 px-3 ${
                  isToday ? 'bg-warning text-dark border border-2 border-warning shadow-sm' : ''
                }`}
              >
                <span className="fw-bold w-100 text-center">
                  {formatIndonesianDate(dateStr)}
                </span>
                {isToday && (
                  <span className="badge bg-danger rounded-pill px-2 py-1 text-xs">
                    HARI INI
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  function renderMediaBlock(thumbnail) {
    if (!thumbnail) return null;
    return (
      <div className="mb-3 p-3 bg-light rounded shadow-sm text-center">
        <h6 className="fw-semibold text-secondary mb-2">Dokumen Pendukung</h6>
        <img
          src={thumbnail}
          alt="Dokumen"
          className="img-fluid rounded mb-2"
          style={{ maxHeight: 120, objectFit: 'contain' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/400x100/A0AEC0/FFFFFF?text=Dokumen+Tidak+Tersedia';
          }}
        />
      </div>
    );
  }

  const off = data?.off;
  const tahunan = data?.tahunan;
  const nonTahunan = data?.nonTahunan;

  return (
    <ConfirmationModal
      show={show}
      title="Lihat Rencana Cuti &amp; Off"
      message=""
      hideConfirm={true}
      onCancel={onClose}
    >
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2 small">Memuat rencana absensi...</p>
        </div>
      ) : (
        <div id="blockShowAuto" className="text-start">
          <ul className="nav nav-tabs nav-justified bg-light p-1 rounded-3 mb-3">
            <li className="nav-item">
              <button
                className={`nav-link btn-sm ${activeTab === 'off' ? 'active fw-bold' : ''}`}
                onClick={() => setActiveTab('off')}
              >
                Off Duty
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn-sm ${activeTab === 'tahunan' ? 'active fw-bold' : ''}`}
                onClick={() => setActiveTab('tahunan')}
              >
                Cuti Tahunan
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn-sm ${activeTab === 'nonTahunan' ? 'active fw-bold' : ''}`}
                onClick={() => setActiveTab('nonTahunan')}
              >
                Cuti Lainnya
              </button>
            </li>
          </ul>

          <div className="tab-content tab-scroll">
            {activeTab === 'off' && (
              <div>
                {!off || !off.dates || off.dates.length === 0 ? (
                  <div className="alert alert-secondary text-center p-3">
                    <h6 className="alert-heading mb-1">Tidak Ada Data Off Duty</h6>
                    <small>Saat ini tidak ada rencana off yang tercatat.</small>
                  </div>
                ) : (
                  <>
                    {off.display && (
                      <div className="alert alert-warning text-center p-2 mb-3">
                        <strong>Periode Off:</strong>
                        <p className="mb-0 small">{off.display}</p>
                      </div>
                    )}
                    {renderDateList(off.dates)}
                  </>
                )}
              </div>
            )}

            {activeTab === 'tahunan' && (
              <div>
                {!tahunan || !tahunan.dates || tahunan.dates.length === 0 ? (
                  <div className="alert alert-secondary text-center p-3">
                    <h6 className="alert-heading mb-1">Tidak Ada Data Cuti Tahunan</h6>
                    <small>Saat ini tidak ada rencana cuti tahunan yang tercatat.</small>
                  </div>
                ) : (
                  <>
                    <div className="alert alert-success text-center p-2 mb-2">
                      Menggunakan Hak Cuti Tahunan
                    </div>
                    {renderMediaBlock(tahunan.thumbnail)}
                    {renderDateList(tahunan.dates)}
                  </>
                )}
              </div>
            )}

            {activeTab === 'nonTahunan' && (
              <div>
                {!nonTahunan || !nonTahunan.dates || nonTahunan.dates.length === 0 ? (
                  <div className="alert alert-secondary text-center p-3">
                    <h6 className="alert-heading mb-1">Tidak Ada Data Cuti Lainnya</h6>
                    <small>Saat ini tidak ada rencana cuti khusus yang tercatat.</small>
                  </div>
                ) : (
                  <>
                    {nonTahunan.keterangan && (
                      <div className="alert alert-info text-center p-2 mb-2">
                        <strong>Keterangan:</strong> {nonTahunan.keterangan.toUpperCase()}
                      </div>
                    )}
                    {renderMediaBlock(nonTahunan.thumbnail)}
                    {renderDateList(nonTahunan.dates)}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </ConfirmationModal>
  );
}
