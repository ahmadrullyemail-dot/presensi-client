/**
 * PlanPopup — Auto Off & Cuti panel (mirrors #plan-popup)
 *
 * Props:
 *  show      – boolean
 *  onShow()  – fn (Lihat Rencana)
 *  onPlan()  – fn (Buat Rencana)
 */
export default function PlanPopup({ show, onShow, onPlan }) {
  return (
    <div id="plan-popup" className={`popup-panel ${show ? 'show' : ''}`}>
      <h5 className="fw-bold mb-3">Auto Off &amp; Cuti</h5>
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
