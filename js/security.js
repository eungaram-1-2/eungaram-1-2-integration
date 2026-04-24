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

    // 욕설/부적절한 단어 필터 (중학교 사이트)
    _badWords: ['씨발','시발','씨팔','시팔','ㅅㅂ','개새끼','개새','새끼','놈','년','미친놈','미친년','병신','ㅂㅅ','지랄','존나','ㅈㄴ','fuck','shit','bitch','asshole','bastard'],
    containsBadWord(text) {
        if (!text) return false;
        const t = text.toLowerCase().replace(/\s/g, '');
        return this._badWords.some(w => t.includes(w.toLowerCase()));
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

// =============================================
// CSRF 토큰 유틸리티
// =============================================
const CSRFProtection = {
    _token: null,
    getToken() {
        if (!this._token) {
            const arr = new Uint8Array(16);
            crypto.getRandomValues(arr);
            this._token = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
            sessionStorage.setItem('csrf_token', this._token);
        }
        return this._token;
    },
    validate(token) { return token === this._token; }
};

// =============================================
// 데이터 암호화 유틸리티 (AES-GCM via Web Crypto API)
// =============================================
const CryptoUtils = {
    async generateKey() {
        return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    },
    async encrypt(data, key) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(data));
        const combined = new Uint8Array(iv.length + cipher.byteLength);
        combined.set(iv); combined.set(new Uint8Array(cipher), iv.length);
        return btoa(String.fromCharCode(...combined));
    },
    async decrypt(data, key) {
        const combined = Uint8Array.from(atob(data), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12); const cipher = combined.slice(12);
        const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
        return new TextDecoder().decode(dec);
    }
};

// =============================================
// XSS 방지 강화 (자체 구현)
// =============================================
const XSSProtection = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    sanitizeHTML(dirty) {
        const div = document.createElement('div');
        div.textContent = dirty;
        return div.innerHTML;
    },
    sanitizeURL(url) { return Security.sanitizeUrl(url); },
    escapeAttr(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
};

// =============================================
// IP 차단 체크
// =============================================
async function checkIPBlock() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const { ip } = await res.json();
        if (!ip) return;

        const blockData = DB.get('ip_blocklist', { blocklist: [] });
        const blocklist = blockData.blocklist || [];

        if (blocklist.includes(ip)) {
            document.body.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;color:#f1f5f9;font-family:sans-serif">
                    <div style="text-align:center;padding:40px">
                        <div style="font-size:4rem;margin-bottom:20px">🚫</div>
                        <h2 style="margin:0 0 12px;font-size:1.5rem">접근이 차단되었습니다</h2>
                        <p style="color:#94a3b8;font-size:0.9rem">이 IP 주소(${ip})는 차단되었습니다.</p>
                    </div>
                </div>`;
            throw new Error('IP blocked');
        }
    } catch (e) {
        if (e.message === 'IP blocked') throw e;
        // API 실패 시 차단하지 않음 (네트워크 오류 등)
    }
}
