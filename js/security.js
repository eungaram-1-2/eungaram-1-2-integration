// =============================================
// Rate Limiter (DDoS / 브루트포스 방지)
// =============================================
const RateLimit = {
    _store: {},
    limits: {
        login:    { max: 5,  window: 60000  },
        comment:  { max: 10, window: 60000  },
        post:     { max: 5,  window: 120000 },
        vote:     { max: 3,  window: 60000  },
        navigate: { max: 60, window: 10000  },
        chat:     { max: 5,  window: 10000  },  // 10초에 5개
    },
    check(action) {
        const now = Date.now();
        const cfg = this.limits[action];
        if (!cfg) return true;
        if (!this._store[action]) this._store[action] = [];
        this._store[action] = this._store[action].filter(t => now - t < cfg.window);
        if (this._store[action].length >= cfg.max) return false;
        this._store[action].push(now);
        return true;
    },
    remaining(action) {
        const now = Date.now();
        const cfg = this.limits[action];
        if (!cfg) return Infinity;
        if (!this._store[action]) return cfg.max;
        const valid = this._store[action].filter(t => now - t < cfg.window);
        return Math.max(0, cfg.max - valid.length);
    },
    waitTime(action) {
        const cfg = this.limits[action];
        if (!cfg || !this._store[action] || this._store[action].length === 0) return 0;
        return Math.max(0, cfg.window - (Date.now() - this._store[action][0]));
    }
};

// =============================================
// 입력 검증
// =============================================
const Security = {
    MAX_TITLE:    100,
    MAX_CONTENT:  5000,
    MAX_COMMENT:  500,
    MAX_INPUT:    50,
    MAX_FILE_SIZE: 100 * 1024 * 1024,

    // HTML 태그 제거 (저장 전 방어층)
    stripHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/<[^>]*>/g, '');
    },

    sanitize(str) {
        if (typeof str !== 'string') return '';
        return this.stripHtml(str).trim().slice(0, this.MAX_CONTENT);
    },

    // javascript:, data: 등 위험 URL 차단
    sanitizeUrl(url) {
        if (!url || typeof url !== 'string') return '#';
        const t = url.trim().toLowerCase().replace(/\s/g, '');
        const blocked = ['javascript:', 'vbscript:', 'data:text/html', 'data:application'];
        if (blocked.some(p => t.startsWith(p))) return '#';
        return url;
    },

    // 중복 메시지 감지 (windowMs 내 같은 내용 차단)
    _lastMsg: {},
    isDuplicate(text, action = 'default', windowMs = 3000) {
        const now = Date.now();
        const last = this._lastMsg[action];
        if (last && last.text === text && (now - last.time) < windowMs) return true;
        this._lastMsg[action] = { text, time: now };
        return false;
    },

    validateTitle(str) {
        const s = this.sanitize(str);
        if (!s) return { ok: false, msg: '제목을 입력해주세요.' };
        if (s.length > this.MAX_TITLE) return { ok: false, msg: `제목은 ${this.MAX_TITLE}자 이내로 입력해주세요.` };
        return { ok: true, value: s };
    },
    validateContent(str) {
        const s = this.sanitize(str);
        if (!s) return { ok: false, msg: '내용을 입력해주세요.' };
        if (s.length > this.MAX_CONTENT) return { ok: false, msg: `내용은 ${this.MAX_CONTENT}자 이내로 입력해주세요.` };
        return { ok: true, value: s };
    },
    validateComment(str) {
        const s = this.sanitize(str);
        if (!s) return { ok: false, msg: '' };
        if (s.length > this.MAX_COMMENT) return { ok: false, msg: `댓글은 ${this.MAX_COMMENT}자 이내로 입력해주세요.` };
        return { ok: true, value: s };
    },
    validateFile(file) {
        if (!file) return { ok: true, value: null };
        if (file.size > this.MAX_FILE_SIZE) return { ok: false, msg: '파일 크기는 100MB 이내만 가능합니다.' };
        const dangerous = ['.exe','.bat','.cmd','.scr','.js','.vbs','.ps1','.sh'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (dangerous.includes(ext)) return { ok: false, msg: '해당 파일 형식은 업로드할 수 없습니다.' };
        return { ok: true, value: file };
    }
};
