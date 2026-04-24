// =============================================
// Analytics - GA4 + Web Vitals
// =============================================
const Analytics = {
    GA_ID: 'G-XXXXXXXXXX', // 실제 배포 시 교체
    _initialized: false,
    _queue: [],

    init(measurementId) {
        if (measurementId) this.GA_ID = measurementId;

        // GA4 로드
        this._loadGA4();

        // Web Vitals 측정
        this._measureWebVitals();

        // 페이지 이동 추적
        this._trackNavigation();

        this._initialized = true;
        AppLogger.info('Analytics initialized');
    },

    _loadGA4() {
        // gtag 스크립트 동적 로드
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA_ID}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', this.GA_ID, {
            page_title: document.title,
            page_location: location.href,
            send_page_view: true,
            // 개인정보 보호
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });
    },

    track(eventName, params = {}) {
        if (!this._initialized) { this._queue.push({ eventName, params }); return; }
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, params);
        }
        AppLogger.debug(`Analytics track: ${eventName}`, params);
    },

    trackPageView(page) {
        this.track('page_view', { page_path: `/?route=${page}`, page_title: document.title });
    },

    trackFeatureUse(feature) {
        this.track('feature_use', { feature_name: feature });
    },

    _measureWebVitals() {
        // LCP (Largest Contentful Paint)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1];
            this.track('web_vital', { name: 'LCP', value: Math.round(last.startTime), rating: last.startTime < 2500 ? 'good' : last.startTime < 4000 ? 'needs-improvement' : 'poor' });
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // FID (First Input Delay)
        new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                const fid = entry.processingStart - entry.startTime;
                this.track('web_vital', { name: 'FID', value: Math.round(fid), rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor' });
            });
        }).observe({ entryTypes: ['first-input'] });

        // CLS (Cumulative Layout Shift)
        let cls = 0;
        new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (!entry.hadRecentInput) cls += entry.value;
            });
        }).observe({ entryTypes: ['layout-shift'] });

        // 페이지 언로드 시 CLS 전송
        window.addEventListener('pagehide', () => {
            this.track('web_vital', { name: 'CLS', value: Math.round(cls * 1000), rating: cls < 0.1 ? 'good' : cls < 0.25 ? 'needs-improvement' : 'poor' });
        });

        // TTFB (Time to First Byte)
        window.addEventListener('load', () => {
            const nav = performance.getEntriesByType('navigation')[0];
            if (nav) {
                this.track('web_vital', { name: 'TTFB', value: Math.round(nav.responseStart), rating: nav.responseStart < 800 ? 'good' : nav.responseStart < 1800 ? 'needs-improvement' : 'poor' });
            }
        });
    },

    _trackNavigation() {
        // navigate() 함수 호출 추적 (라우터가 호출)
        const origNavigate = window.navigate;
        if (typeof origNavigate === 'function') {
            window.navigate = function(page, params) {
                Analytics.trackPageView(page);
                return origNavigate.call(this, page, params);
            };
        }
    }
};
