 // modal helper for lan-windows
// This file creates a reusable confirmation modal and exposes showModal/hideModal
// as globals so other scripts (e.g., lan-windows-01.js) can call them without
// embedding modal DOM code inline.

(function () {
    // create overlay + modal DOM
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'app-modal-overlay';
    modalOverlay.className = 'app-modal-overlay';
    modalOverlay.style.display = 'none';

    const modal = document.createElement('div');
    modal.id = 'app-modal';
    modal.className = 'app-modal';
    modal.innerHTML = `
        <div class="app-modal__body">
            <div class="app-modal__message" id="app-modal-message"></div>
            <div class="app-modal__actions">
                <button id="app-modal-cancel" class="app-modal__btn app-modal__btn--cancel">Cancelar</button>
                <button id="app-modal-confirm" class="app-modal__btn app-modal__btn--confirm">Confirmar</button>
            </div>
        </div>
    `;
    modalOverlay.appendChild(modal);

    // Append to body when DOM is ready. If body already exists, append immediately.
    const appendModal = () => {
        if (!document.body.contains(modalOverlay)) document.body.appendChild(modalOverlay);
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', appendModal);
    } else {
        appendModal();
    }

    let _modalConfirmCb = null;
    let _modalCancelCb = null;

    window.showModal = (message, onConfirm, onCancel) => {
        const msgEl = document.getElementById('app-modal-message');
        const overlay = document.getElementById('app-modal-overlay');
        if (!msgEl || !overlay) return;
        msgEl.textContent = message;
        _modalConfirmCb = typeof onConfirm === 'function' ? onConfirm : null;
        _modalCancelCb = typeof onCancel === 'function' ? onCancel : null;
        overlay.style.display = 'flex';
        // focus the cancel button for accessibility
        const cancelBtn = document.getElementById('app-modal-cancel');
        if (cancelBtn) cancelBtn.focus();
    };

    window.hideModal = () => {
        const overlay = document.getElementById('app-modal-overlay');
        if (!overlay) return;
        overlay.style.display = 'none';
        _modalConfirmCb = null;
        _modalCancelCb = null;
    };

    // wire modal buttons
    document.addEventListener('click', (ev) => {
        if (!ev.target) return;
        if (ev.target.id === 'app-modal-confirm') {
            if (_modalConfirmCb) _modalConfirmCb();
            window.hideModal();
        }
        if (ev.target.id === 'app-modal-cancel') {
            if (_modalCancelCb) _modalCancelCb();
            window.hideModal();
        }
    });

    // keyboard support: Esc to cancel, Enter to confirm when modal visible
    document.addEventListener('keydown', (ev) => {
        const overlay = document.getElementById('app-modal-overlay');
        if (!overlay || overlay.style.display === 'none') return;
        if (ev.key === 'Escape') {
            if (_modalCancelCb) _modalCancelCb();
            window.hideModal();
        } else if (ev.key === 'Enter') {
            if (_modalConfirmCb) _modalConfirmCb();
            window.hideModal();
        }
    });

})();
