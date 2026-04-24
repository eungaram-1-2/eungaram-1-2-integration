// =============================================
// 통합 로거 시스템
// =============================================
const AppLogger = (function () {
    const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    const IS_DEV = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const MIN_LEVEL = IS_DEV ? LEVELS.DEBUG : LEVELS.WARN;

    const _logs = []; // 마지막 100개 로그 메모리 보관
    const MAX_LOGS = 100;

    function _log(level, levelName, ...args) {
        if (level < MIN_LEVEL) return;
        const entry = {
            time: new Date().toISOString(),
            level: levelName,
            msg: args
                .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
                .join(' '),
        };
        _logs.push(entry);
        if (_logs.length > MAX_LOGS) _logs.shift();

        const prefix = `[${levelName}][${new Date().toLocaleTimeString('ko-KR')}]`;
        const method =
            level >= LEVELS.ERROR ? 'error' : level >= LEVELS.WARN ? 'warn' : 'log';
        console[method](prefix, ...args);
    }

    return {
        debug: (...args) => _log(LEVELS.DEBUG, 'DEBUG', ...args),
        info: (...args) => _log(LEVELS.INFO, 'INFO', ...args),
        warn: (...args) => _log(LEVELS.WARN, 'WARN', ...args),
        error: (...args) => _log(LEVELS.ERROR, 'ERROR', ...args),
        getLogs: () => [..._logs],
        exportLogs() {
            const blob = new Blob([JSON.stringify(_logs, null, 2)], {
                type: 'application/json',
            });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `eg12-logs-${Date.now()}.json`;
            a.click();
        },
    };
})();
