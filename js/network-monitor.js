// =============================================
// 네트워크 모니터링 모듈
// 온라인/오프라인 상태, 배터리, 연결 속도 감지
// =============================================

const NetworkMonitor = {
    _isOnline: navigator.onLine,
    _toastEl: null,              // 현재 표시 중인 토스트 엘리먼트
    _batteryWarned: false,       // 배터리 경고 1회 제한
    _styleInjected: false,       // CSS 중복 주입 방지
    _slowConnectionNotified: false, // 느린 연결 알림 1회 제한

    // ──────────────────────────────────────────
    // 초기화
    // ──────────────────────────────────────────
    init() {
        this._injectStyles();

        // 온라인/오프라인 이벤트 리스너
        window.addEventListener('online',  () => this._onOnline());
        window.addEventListener('offline', () => this._onOffline());

        // 초기 상태 확인 (이미 오프라인인 경우)
        if (!navigator.onLine) {
            this._onOffline();
        }

        // 배터리 상태 확인
        this._checkBattery();

        // 연결 속도 확인
        this._checkConnection();
    },

    // ──────────────────────────────────────────
    // 온라인 복원 처리
    // ──────────────────────────────────────────
    _onOnline() {
        if (this._isOnline) return; // 이미 온라인 상태면 무시
        this._isOnline = true;
        console.log('[NetworkMonitor] 인터넷 연결 복원됨');
        this._showToast('인터넷 연결이 복원되었습니다.', 'success', 3000);

        // 느린 연결 알림 초기화 (재연결 후 재확인 가능)
        this._slowConnectionNotified = false;
        this._checkConnection();
    },

    // ──────────────────────────────────────────
    // 오프라인 처리
    // ──────────────────────────────────────────
    _onOffline() {
        if (!this._isOnline) return; // 이미 오프라인이면 무시
        this._isOnline = false;
        console.log('[NetworkMonitor] 인터넷 연결 끊김');
        // 오프라인 토스트는 계속 표시 (duration: 0 = 수동 닫기)
        this._showToast('인터넷 연결이 끊겼습니다.', 'warning', 0);
    },

    // ──────────────────────────────────────────
    // 토스트 메시지 표시
    // duration: 0이면 자동으로 사라지지 않음
    // ──────────────────────────────────────────
    _showToast(message, type = 'info', duration = 3000) {
        // 기존 토스트 제거
        if (this._toastEl) {
            this._toastEl.remove();
            this._toastEl = null;
        }

        const colors = {
            success: '#10b981',
            error:   '#ef4444',
            info:    '#7c3aed',
            warning: '#f59e0b'
        };
        const icons = {
            success: '✓',
            error:   '✕',
            info:    'ℹ',
            warning: '⚠'
        };

        const toast = document.createElement('div');
        toast.className = 'nm-toast';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.innerHTML = `
            <span class="nm-toast-icon">${icons[type] || 'ℹ'}</span>
            <span class="nm-toast-msg">${message}</span>
            ${duration === 0 ? '<button class="nm-toast-close" aria-label="닫기">✕</button>' : ''}
        `;
        toast.style.setProperty('--nm-bg', colors[type] || '#7c3aed');

        document.body.appendChild(toast);
        this._toastEl = toast;

        // 닫기 버튼 이벤트
        const closeBtn = toast.querySelector('.nm-toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this._dismissToast(toast));
        }

        // 등장 애니메이션
        requestAnimationFrame(() => {
            toast.classList.add('nm-toast--visible');
        });

        // 자동 사라짐 (duration > 0인 경우)
        if (duration > 0) {
            setTimeout(() => this._dismissToast(toast), duration);
        }

        return toast;
    },

    // 토스트 사라지기 애니메이션 + 제거
    _dismissToast(toastEl) {
        if (!toastEl || !toastEl.parentNode) return;
        toastEl.classList.remove('nm-toast--visible');
        toastEl.classList.add('nm-toast--hiding');
        setTimeout(() => {
            if (toastEl.parentNode) toastEl.remove();
            if (this._toastEl === toastEl) this._toastEl = null;
        }, 300);
    },

    // ──────────────────────────────────────────
    // 배터리 상태 확인 (20% 이하 시 1회 경고)
    // ──────────────────────────────────────────
    async _checkBattery() {
        if (!('getBattery' in navigator)) return;

        try {
            const battery = await navigator.getBattery();

            const checkLevel = () => {
                if (!this._batteryWarned && battery.level <= 0.2 && !battery.charging) {
                    this._batteryWarned = true;
                    const percent = Math.round(battery.level * 100);
                    this._showToast(`배터리가 ${percent}% 남았습니다. 충전하세요.`, 'warning', 5000);
                }
            };

            // 현재 상태 확인
            checkLevel();

            // 배터리 변화 감지
            battery.addEventListener('levelchange', checkLevel);
            battery.addEventListener('chargingchange', () => {
                // 충전 시작 시 경고 초기화 (이후 방전 시 다시 경고 가능)
                if (battery.charging) this._batteryWarned = false;
            });
        } catch (err) {
            console.warn('[NetworkMonitor] 배터리 API 사용 불가:', err);
        }
    },

    // ──────────────────────────────────────────
    // 연결 속도 감지 (느린 연결 시 애니메이션 비활성화)
    // ──────────────────────────────────────────
    _checkConnection() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) return;

        const applySlowMode = () => {
            const effectiveType = conn.effectiveType;
            const isSlow = effectiveType === '2g' || effectiveType === 'slow-2g';

            if (isSlow) {
                // 느린 연결: 애니메이션 비활성화
                document.documentElement.classList.add('reduce-motion');

                if (!this._slowConnectionNotified) {
                    this._slowConnectionNotified = true;
                    this._showToast('느린 연결이 감지되었습니다. 일부 기능이 제한될 수 있습니다.', 'info', 4000);
                }
                console.log(`[NetworkMonitor] 느린 연결 감지: ${effectiveType}`);
            } else {
                // 정상 연결: 애니메이션 활성화
                document.documentElement.classList.remove('reduce-motion');
            }
        };

        // 현재 연결 상태 확인
        applySlowMode();

        // 연결 상태 변화 감지
        conn.addEventListener('change', applySlowMode);
    },

    // ──────────────────────────────────────────
    // CSS 스타일 주입 (토스트 + reduce-motion)
    // ──────────────────────────────────────────
    _injectStyles() {
        if (this._styleInjected) return;
        this._styleInjected = true;

        const style = document.createElement('style');
        style.id = 'nm-styles';
        style.textContent = `
            /* 네트워크 모니터 토스트 */
            .nm-toast {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: var(--nm-bg, #7c3aed);
                color: #fff;
                padding: 12px 20px;
                border-radius: 12px;
                font-size: 0.875rem;
                font-weight: 600;
                font-family: 'Noto Sans KR', sans-serif;
                z-index: 99998;
                opacity: 0;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.18);
                max-width: calc(100vw - 32px);
                transition: opacity 0.3s ease, transform 0.3s ease;
                pointer-events: auto;
            }
            .nm-toast--visible {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            .nm-toast--hiding {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
            .nm-toast-icon {
                font-weight: 700;
                font-size: 1rem;
                flex-shrink: 0;
            }
            .nm-toast-msg {
                flex: 1;
            }
            .nm-toast-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: #fff;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 0.75rem;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: background 0.2s;
                padding: 0;
            }
            .nm-toast-close:hover {
                background: rgba(255,255,255,0.35);
            }

            /* 느린 연결: 애니메이션 비활성화 */
            .reduce-motion *,
            .reduce-motion *::before,
            .reduce-motion *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
    }
};

// DOMContentLoaded 시 자동 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NetworkMonitor.init());
} else {
    NetworkMonitor.init();
}
