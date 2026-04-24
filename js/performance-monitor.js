// =============================================
// 성능 모니터링
// =============================================
const PerformanceMonitor = {
    _metrics: {},

    init() {
        this._measureLoadTime();
        this._monitorLongTasks();
        this._monitorMemory();
        AppLogger.info('PerformanceMonitor initialized');
    },

    mark(name) { performance.mark(name); },

    measure(name, startMark, endMark) {
        try {
            performance.measure(name, startMark, endMark);
            const entries = performance.getEntriesByName(name, 'measure');
            const duration = entries[entries.length - 1]?.duration;
            this._metrics[name] = duration;
            AppLogger.debug(`Perf: ${name} = ${Math.round(duration)}ms`);
            return duration;
        } catch(e) { return null; }
    },

    _measureLoadTime() {
        window.addEventListener('load', () => {
            const nav = performance.getEntriesByType('navigation')[0];
            if (!nav) return;
            this._metrics = {
                ...this._metrics,
                dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
                tcp: Math.round(nav.connectEnd - nav.connectStart),
                ttfb: Math.round(nav.responseStart - nav.requestStart),
                download: Math.round(nav.responseEnd - nav.responseStart),
                domParsing: Math.round(nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart),
                loadComplete: Math.round(nav.loadEventEnd - nav.navigationStart)
            };
            AppLogger.info('Page load metrics:', this._metrics);
        });
    },

    _monitorLongTasks() {
        if (!PerformanceObserver.supportedEntryTypes?.includes('longtask')) return;
        new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.duration > 50) {
                    AppLogger.warn(`Long task detected: ${Math.round(entry.duration)}ms`);
                }
            });
        }).observe({ entryTypes: ['longtask'] });
    },

    _monitorMemory() {
        if (!performance.memory) return;
        setInterval(() => {
            const mb = performance.memory.usedJSHeapSize / 1048576;
            if (mb > 100) {
                AppLogger.warn(`High memory usage: ${Math.round(mb)}MB`);
            }
        }, 30000);
    },

    getMetrics() { return { ...this._metrics }; },

    // 개발자 도구용 리포트
    report() {
        console.table(this._metrics);
        return this._metrics;
    }
};
