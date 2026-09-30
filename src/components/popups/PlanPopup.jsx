/**
 * PlanPopup — Auto Off & Cuti panel (mirrors #plan-popup)
 *
 * Props:
 *  show      – boolean
 *  onShow()  – fn (Lihat Rencana)
 *  onPlan()  – fn (Buat Rencana)
 */
export default function PlanPopup({ show, onShow, onPlan, onClose }) {
  return (
    <div id="plan-popup" className={`popup-panel ${show ? 'show' : ''}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Auto Off &amp; Cuti</h5>
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
        <div className="col-6">
          <div className="card-menu" onClick={onShow}>
            <div className="icon"><span className="material-icons">calendar_today</span></div>
            <p>Lihat Rencana</p>
          </div>
        </div>
        <div className="col-6">
          <div className="card-menu" onClick={onPlan}>
            <div className="icon"><span className="material-icons">edit_calendar</span></div>
            <p>Buat Rencana</p>
          </div>
        </div>
      </div>
    </div>
  );
}
