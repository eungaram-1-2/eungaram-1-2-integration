// =============================================
// 모달 (포커스 트랩 + ESC 키 지원)
// =============================================
let _modalPrevFocus = null;
let _modalKeyHandler = null;

function openModal(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;

    const overlay = document.getElementById('modalOverlay');
    overlay.classList.add('active');

    // 이전 포커스 저장 후 모달 첫 포커서블 요소로 이동
    _modalPrevFocus = document.activeElement;
    setTimeout(() => {
        const modal = overlay.querySelector('[role="dialog"]');
        const focusable = modal?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable && focusable.length > 0) {
            focusable[0].focus();
        }
    }, 0);

    // 포커스 트랩 + ESC 핸들러
    _modalKeyHandler = function(e) {
        const modal = document.getElementById('modalOverlay').querySelector('[role="dialog"]');
        if (!modal) return;

        if (e.key === 'Escape') {
            closeModal();
            return;
        }

        if (e.key === 'Tab') {
            const focusable = Array.from(modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )).filter(el => !el.disabled);
            if (!focusable.length) return;
            const first = focusable[0];
            const last  = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };
    document.addEventListener('keydown', _modalKeyHandler);
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    if (_modalKeyHandler) {
        document.removeEventListener('keydown', _modalKeyHandler);
        _modalKeyHandler = null;
    }
    // 모달 닫힌 후 원래 포커스 복구
    if (_modalPrevFocus && typeof _modalPrevFocus.focus === 'function') {
        _modalPrevFocus.focus();
    }
    _modalPrevFocus = null;
}
