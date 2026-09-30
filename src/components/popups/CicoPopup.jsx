/**
 * CicoPopup — Check-In / Check-Out panel (mirrors #cico-popup)
 *
 * Props:
 *  show        – boolean
 *  checkIn     – string time or '-'
 *  checkOut    – string time or '-'
 *  loadingIn   – boolean
 *  loadingOut  – boolean
 *  onCheckIn   – fn()
 *  onCheckOut  – fn()
 */
export default function CicoPopup({
  show,
  checkIn,
  checkOut,
  loadingIn,
  loadingOut,
  onCheckIn,
  onCheckOut,
}) {
  return (
    <div id="cico-popup" className={`popup-panel ${show ? 'show' : ''}`}>
      <div className="row g-3">
        {/* Check-In */}
        <div className="col-6">
          <div
            className="check-box check-in-btn"
            id="check-in-box"
            onClick={onCheckIn}
            style={{ cursor: 'pointer' }}
          >
            <p className="mb-1">Check-In</p>
            <small>Hari ini</small>
            <div className="time-display" id="check-in-time">
              {!loadingIn && checkIn}
            </div>
            {loadingIn && (
              <div
                id="time-loading-i"
                className="justify-content-center align-items-center"
                style={{ display: 'flex' }}
              >
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Check-Out */}
        <div className="col-6">
          <div
            className="check-box check-out-btn"
            id="check-out-box"
            onClick={onCheckOut}
            style={{ cursor: 'pointer' }}
          >
            <p className="mb-1">Check-Out</p>
            <small>Hari ini</small>
            <div className="time-display" id="check-out-time">
              {!loadingOut && checkOut}
            </div>
            {loadingOut && (
              <div
                id="time-loading-o"
                className="justify-content-center align-items-center"
                style={{ display: 'flex' }}
              >
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
