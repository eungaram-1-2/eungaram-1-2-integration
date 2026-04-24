// =============================================
// PWA 관리 모듈
// Service Worker 등록, 업데이트 배너, 설치 프롬프트
// =============================================

const PWAManager = {
    _deferredPrompt: null,      // beforeinstallprompt 이벤트 저장
    _updateBannerShown: false,  // 업데이트 배너 중복 표시 방지
    _swRegistration: null,      // SW 등록 객체

    // ──────────────────────────────────────────
    // 초기화: SW 등록 + 이벤트 리스너 설정
    // ──────────────────────────────────────────
    async init() {
        // Service Worker 등록
        await this.registerSW();

        // 설치 프롬프트 이벤트 저장
        window.addEventListener('beforeinstallprompt', e => {
            e.preventDefault();
            this._deferredPrompt = e;
        });

        // 앱 설치 완료 이벤트
        window.addEventListener('appinstalled', () => {
            this._deferredPrompt = null;
            console.log('[PWA] 앱이 성공적으로 설치되었습니다.');
        });

        // SW로부터 메시지 수신 (업데이트 알림 등)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
                    this._showUpdateBanner();
                }
            });
        }
    },

    // ──────────────────────────────────────────
    // Service Worker 등록
    // ──────────────────────────────────────────
    async registerSW() {
        if (!('serviceWorker' in navigator)) {
            console.warn('[PWA] Service Worker를 지원하지 않는 브라우저입니다.');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.register('./sw.js', {
                scope: './'
            });
            this._swRegistration = registration;
            console.log('[PWA] Service Worker 등록 성공:', registration.scope);

            // 업데이트 감지 리스너 등록
            this._listenForUpdates(registration);

            return registration;
        } catch (err) {
            console.error('[PWA] Service Worker 등록 실패:', err);
            return null;
        }
    },

    // ──────────────────────────────────────────
    // SW 업데이트 감지
    // ──────────────────────────────────────────
    _listenForUpdates(registration) {
        // 이미 대기 중인 새 SW가 있는 경우
        if (registration.waiting) {
            this._showUpdateBanner();
            return;
        }

        // 새 SW 설치 중인 경우 감지
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
                // 새 SW가 installed 상태가 되면 (이전 SW가 아직 제어 중)
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    this._showUpdateBanner();
                }
            });
        });

        // 컨트롤러가 바뀌면 페이지 자동 새로고침
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    },

    // ──────────────────────────────────────────
    // 업데이트 배너 표시
    // ──────────────────────────────────────────
    _showUpdateBanner() {
        // 이미 배너가 표시된 경우 중복 방지
        if (this._updateBannerShown) return;
        if (document.getElementById('pwa-update-banner')) return;
        this._updateBannerShown = true;

        const banner = document.createElement('div');
        banner.id = 'pwa-update-banner';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('aria-live', 'polite');

        Object.assign(banner.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            zIndex: '99999',
            background: '#1428A0',
            color: '#ffffff',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '0.875rem',
            fontWeight: '600',
            fontFamily: "'Noto Sans KR', sans-serif",
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            animation: 'slideDown 0.3s ease-out'
        });

        // 애니메이션 스타일 추가
        if (!document.getElementById('pwa-update-style')) {
            const style = document.createElement('style');
            style.id = 'pwa-update-style';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
                #pwa-update-banner button {
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.4);
                    color: #fff;
                    padding: 6px 14px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 700;
                    font-family: inherit;
                    white-space: nowrap;
                    transition: background 0.2s;
                }
                #pwa-update-banner button:hover {
                    background: rgba(255,255,255,0.35);
                }
                #pwa-update-banner .dismiss-btn {
                    background: transparent;
                    border: none;
                    font-size: 1.2rem;
                    padding: 4px 8px;
                    line-height: 1;
                }
            `;
            document.head.appendChild(style);
        }

        banner.innerHTML = `
            <span>새 버전이 있습니다. 새로고침하세요.</span>
            <div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">
                <button onclick="PWAManager._applyUpdate()" aria-label="지금 새로고침">새로고침</button>
                <button class="dismiss-btn" onclick="PWAManager._dismissUpdateBanner()" aria-label="배너 닫기">✕</button>
            </div>
        `;

        document.body.prepend(banner);
    },

    // 업데이트 적용: 대기 중인 SW에 skipWaiting 메시지 전송
    _applyUpdate() {
        const reg = this._swRegistration;
        if (reg && reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
            window.location.reload();
        }
    },

    // 배너 닫기
    _dismissUpdateBanner() {
        const banner = document.getElementById('pwa-update-banner');
        if (banner) {
            banner.style.animation = 'none';
            banner.style.transform = 'translateY(-100%)';
            banner.style.transition = 'transform 0.3s ease-in';
            setTimeout(() => banner.remove(), 300);
        }
        this._updateBannerShown = false;
    },

    // ──────────────────────────────────────────
    // 앱 설치 프롬프트 표시
    // ──────────────────────────────────────────
    async showInstallPrompt() {
        if (!this._deferredPrompt) {
            console.log('[PWA] 설치 프롬프트를 사용할 수 없습니다.');
            return false;
        }
        this._deferredPrompt.prompt();
        const { outcome } = await this._deferredPrompt.userChoice;
        console.log(`[PWA] 설치 선택 결과: ${outcome}`);
        if (outcome === 'accepted') {
            this._deferredPrompt = null;
        }
        return outcome === 'accepted';
    },

    // ──────────────────────────────────────────
    // PWA로 설치되어 실행 중인지 확인
    // ──────────────────────────────────────────
    isInstalledAsPWA() {
        return window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
    },

    // 설치 프롬프트 사용 가능 여부
    canInstall() {
        return this._deferredPrompt !== null;
    }
};

// DOMContentLoaded 시 자동 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PWAManager.init());
} else {
    PWAManager.init();
}
