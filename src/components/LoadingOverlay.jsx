/**
 * LoadingOverlay — full-screen spinner (mirrors #loadingOverlay)
 */
export default function LoadingOverlay({ show }) {
  if (!show) return null;
  return (
    <div
      id="loadingOverlay"
      className="justify-content-center align-items-center"
      style={{
        display: 'flex',
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor: 'rgba(255,255,255,0.8)',
        zIndex: 9999,
      }}
    >
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}
