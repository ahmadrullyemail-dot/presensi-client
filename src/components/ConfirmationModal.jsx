import { useEffect, useRef } from 'react';

/**
 * ConfirmationModal — mirrors the original #confirmation-modal
 *
 * Props:
 *  show        – boolean
 *  title       – string
 *  message     – string (HTML allowed via dangerouslySetInnerHTML)
 *  onConfirm   – fn()
 *  onCancel    – fn()
 *  hideConfirm – boolean (hide confirm button, e.g. "Lihat Rencana")
 *  confirmDisabled – boolean
 *  children    – extra form content injected inside modal (below message)
 */
export default function ConfirmationModal({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  hideConfirm = false,
  confirmDisabled = false,
  children,
}) {
  const modalRef = useRef(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`custom-modal ${show ? 'show' : ''}`}
      style={{ display: show ? 'flex' : 'none' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div className="custom-modal-content" ref={modalRef}>
        <h5 className="mb-3">{title}</h5>

        {message && (
          <p
            id="modal-message"
            className="mb-3"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        )}

        {children}

        <div className="d-flex justify-content-around mt-3">
          <button
            id="modal-cancel-btn"
            className="btn custom-modal-btn-cancel rounded-pill px-4"
            onClick={onCancel}
          >
            Batal
          </button>
          {!hideConfirm && (
            <button
              id="modal-confirm-btn"
              className="btn custom-modal-btn-confirm rounded-pill px-4"
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              Ya, Lanjutkan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
