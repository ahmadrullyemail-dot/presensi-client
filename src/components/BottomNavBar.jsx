/**
 * BottomNavBar — mirrors the original #bottom-nav-bar
 *
 * Props:
 *  activePopup – string | null  ('cico'|'izin'|'log'|'plan'|'akun')
 *  onToggle(name) – callback
 */
export default function BottomNavBar({ activePopup, onToggle }) {
  return (
    <nav id="bottom-nav-bar" className="bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0 }}>
      <div className="container">
        <div className="row text-center align-items-center g-0">

          <div className="col">
            <a
              href="#"
              id="izin-toggle"
              className={activePopup === 'izin' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); onToggle('izin'); }}
            >
              <span className="material-icons">flight</span>
              Pengajuan
            </a>
          </div>

          <div className="col">
            <a
              href="#"
              id="log-toggle"
              className={activePopup === 'log' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); onToggle('log'); }}
            >
              <span className="material-icons">sync</span>
              Info
            </a>
          </div>

          <div className="col d-flex justify-content-center">
            <a
              href="#"
              id="cico-toggle"
              className={`center-fab-link ${activePopup === 'cico' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); onToggle('cico'); }}
            >
              <span className="material-icons">timer</span>
            </a>
          </div>

          <div className="col">
            <a
              href="#"
              id="plan-toggle"
              className={activePopup === 'plan' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); onToggle('plan'); }}
            >
              <span className="material-icons">event</span>
              Auto
            </a>
          </div>

          <div className="col">
            <a
              href="#"
              id="akun-toggle"
              className={activePopup === 'akun' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); onToggle('akun'); }}
            >
              <span className="material-icons">person</span>
              Akun
            </a>
          </div>

        </div>
      </div>
    </nav>
  );
}
