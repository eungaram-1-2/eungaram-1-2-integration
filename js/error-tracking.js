// =============================================
// 에러 추적 (Sentry 통합)
// =============================================
const ErrorTracking = {
    SENTRY_DSN: '', // 환경변수에서 주입 or 직접 설정
    _loaded: false,

    async init(dsn) {
        if (!dsn) {
            AppLogger.info('ErrorTracking: Sentry DSN not provided, using local tracking only');
            return;
        }
        this.SENTRY_DSN = dsn;

        try {
            await this._loadSentry();
            this._configureSentry();
            this._loaded = true;
            AppLogger.info('ErrorTracking: Sentry loaded');
        } catch(e) {
            AppLogger.warn('ErrorTracking: Failed to load Sentry', e);
        }
    },

    _loadSentry() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://browser.sentry-cdn.com/7.x/bundle.min.js';
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    _configureSentry() {
        if (typeof Sentry === 'undefined') return;
        Sentry.init({
            dsn: this.SENTRY_DSN,
            release: '1.0.0',
            environment: location.hostname === 'localhost' ? 'development' : 'production',
            tracesSampleRate: 0.1, // 10% 성능 추적
            beforeSend(event) {
                // 민감 정보 제거
                if (event.user) delete event.user.email;
                return event;
            }
        });
    },

    captureException(error) {
        if (this._loaded && typeof Sentry !== 'undefined') {
            Sentry.captureException(error);
        }
        AppLogger.error('Exception captured:', error.message);
    },

    captureMessage(msg, level = 'info') {
        if (this._loaded && typeof Sentry !== 'undefined') {
            Sentry.captureMessage(msg, level);
        }
        AppLogger.warn('Message captured:', msg);
    }
};
