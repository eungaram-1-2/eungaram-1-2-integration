// =============================================
// 통합 에러 핸들링
// =============================================
const ErrorHandler = {
    _errors: [],
    MAX_ERRORS: 50,

    init() {
        // 글로벌 JS 에러
        window.addEventListener('error', (e) => {
            this.capture({
                type: 'uncaught',
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                stack: e.error?.stack,
            });
        });

        // Promise 거부
        window.addEventListener('unhandledrejection', (e) => {
            this.capture({
                type: 'unhandledrejection',
                message: String(e.reason),
                stack: e.reason?.stack,
            });
        });

        // Resource 로딩 에러
        window.addEventListener(
            'error',
            (e) => {
                if (e.target && e.target !== window) {
                    this.capture({
                        type: 'resource',
                        message: `Failed to load: ${e.target.src || e.target.href}`,
                        element: e.target.tagName,
                    });
                }
            },
            true
        );

        AppLogger.info('ErrorHandler initialized');
    },

    capture(errorInfo) {
        const entry = {
            ...errorInfo,
            time: new Date().toISOString(),
            url: location.href,
            ua: navigator.userAgent.slice(0, 100),
        };
        this._errors.push(entry);
        if (this._errors.length > this.MAX_ERRORS) this._errors.shift();
        AppLogger.error('Captured error:', errorInfo.message);

        // Sentry가 로드된 경우 전송
        if (typeof Sentry !== 'undefined') {
            try {
                Sentry.captureException(new Error(errorInfo.message));
            } catch (e) {}
        }
    },

    getErrors() {
        return [...this._errors];
    },

    // 사용자에게 보여주는 에러 (치명적이지 않은 경우)
    showUserError(msg, duration = 4000) {
        if (typeof showToast === 'function') {
            showToast(msg, 'error');
        } else {
            console.error(msg);
        }
    },
};
