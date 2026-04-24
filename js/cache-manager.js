// =============================================
// 캐시 매니저 모듈 (IndexedDB 기반)
// API 응답 캐싱, TTL 지원, cachedFetch 유틸리티
// =============================================

const CacheManager = {
    DB_NAME:    'eg12-cache',
    DB_VERSION: 1,
    STORE:      'api-cache',
    _db:        null,           // IndexedDB 인스턴스
    _initPromise: null,         // 중복 초기화 방지

    // ──────────────────────────────────────────
    // IndexedDB 초기화
    // ──────────────────────────────────────────
    async init() {
        // 이미 초기화 중이거나 완료된 경우 같은 Promise 반환
        if (this._initPromise) return this._initPromise;

        this._initPromise = new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                console.warn('[CacheManager] IndexedDB를 지원하지 않는 환경입니다.');
                resolve(null);
                return;
            }

            const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            req.onupgradeneeded = event => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE)) {
                    const store = db.createObjectStore(this.STORE, { keyPath: 'key' });
                    store.createIndex('expiresAt', 'expiresAt', { unique: false });
                    console.log('[CacheManager] IndexedDB 스토어 생성 완료');
                }
            };

            req.onsuccess = event => {
                this._db = event.target.result;
                console.log('[CacheManager] IndexedDB 초기화 성공');

                // 만료된 캐시 주기적 정리 (1시간마다)
                this._scheduleCleanup();
                resolve(this._db);
            };

            req.onerror = event => {
                console.error('[CacheManager] IndexedDB 열기 실패:', event.target.error);
                reject(event.target.error);
            };

            req.onblocked = () => {
                console.warn('[CacheManager] IndexedDB 열기 차단됨 (다른 탭에서 사용 중)');
            };
        });

        return this._initPromise;
    },

    // ──────────────────────────────────────────
    // DB가 준비될 때까지 대기
    // ──────────────────────────────────────────
    async _getDB() {
        if (this._db) return this._db;
        return this.init();
    },

    // ──────────────────────────────────────────
    // 캐시 항목 읽기
    // 만료된 항목이면 null 반환
    // ──────────────────────────────────────────
    async get(key) {
        const db = await this._getDB();
        if (!db) return null;

        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE, 'readonly');
            const store = tx.objectStore(this.STORE);
            const req = store.get(key);

            req.onsuccess = () => {
                const record = req.result;
                if (!record) {
                    resolve(null);
                    return;
                }
                // TTL 만료 확인
                if (record.expiresAt && Date.now() > record.expiresAt) {
                    // 만료된 항목 삭제 (비동기)
                    this.delete(key).catch(() => {});
                    resolve(null);
                    return;
                }
                resolve(record.value);
            };

            req.onerror = () => {
                console.error('[CacheManager] get 실패:', req.error);
                reject(req.error);
            };
        });
    },

    // ──────────────────────────────────────────
    // 캐시 항목 저장 (TTL: 밀리초, 기본 1시간)
    // ──────────────────────────────────────────
    async set(key, value, ttlMs = 3600000) {
        const db = await this._getDB();
        if (!db) return false;

        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE, 'readwrite');
            const store = tx.objectStore(this.STORE);

            const record = {
                key,
                value,
                cachedAt:  Date.now(),
                expiresAt: ttlMs > 0 ? Date.now() + ttlMs : null  // ttlMs=0이면 만료 없음
            };

            const req = store.put(record);

            req.onsuccess = () => resolve(true);
            req.onerror = () => {
                console.error('[CacheManager] set 실패:', req.error);
                reject(req.error);
            };
        });
    },

    // ──────────────────────────────────────────
    // 캐시 항목 삭제
    // ──────────────────────────────────────────
    async delete(key) {
        const db = await this._getDB();
        if (!db) return false;

        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE, 'readwrite');
            const store = tx.objectStore(this.STORE);
            const req = store.delete(key);

            req.onsuccess = () => resolve(true);
            req.onerror = () => {
                console.error('[CacheManager] delete 실패:', req.error);
                reject(req.error);
            };
        });
    },

    // ──────────────────────────────────────────
    // 전체 캐시 초기화
    // ──────────────────────────────────────────
    async clear() {
        const db = await this._getDB();
        if (!db) return false;

        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE, 'readwrite');
            const store = tx.objectStore(this.STORE);
            const req = store.clear();

            req.onsuccess = () => {
                console.log('[CacheManager] 캐시 전체 삭제 완료');
                resolve(true);
            };
            req.onerror = () => reject(req.error);
        });
    },

    // ──────────────────────────────────────────
    // 만료된 캐시 항목 정리
    // ──────────────────────────────────────────
    async _cleanExpired() {
        const db = await this._getDB();
        if (!db) return;

        return new Promise((resolve) => {
            const tx = db.transaction(this.STORE, 'readwrite');
            const store = tx.objectStore(this.STORE);
            const index = store.index('expiresAt');
            const now = Date.now();

            // expiresAt이 현재 시각보다 이전인 항목 조회
            const range = IDBKeyRange.upperBound(now);
            const req = index.openCursor(range);
            let deleted = 0;

            req.onsuccess = event => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    deleted++;
                    cursor.continue();
                } else {
                    if (deleted > 0) {
                        console.log(`[CacheManager] 만료된 캐시 ${deleted}개 정리 완료`);
                    }
                    resolve(deleted);
                }
            };

            req.onerror = () => resolve(0);
        });
    },

    // 1시간마다 만료 캐시 정리 예약
    _scheduleCleanup() {
        // 초기 정리 (1분 후)
        setTimeout(() => this._cleanExpired(), 60000);
        // 이후 1시간마다 반복
        setInterval(() => this._cleanExpired(), 3600000);
    },

    // ──────────────────────────────────────────
    // cachedFetch: 캐시 확인 → 신선하면 반환, 아니면 fetch 후 캐싱
    // url:     요청 URL
    // options: fetch 옵션 (headers, method 등)
    // ttlMs:   캐시 유효 기간 (밀리초, 기본 1시간)
    // ──────────────────────────────────────────
    async cachedFetch(url, options = {}, ttlMs = 3600000) {
        // DB 초기화 보장
        await this.init();

        const cacheKey = this._makeCacheKey(url, options);

        // 1. 캐시 확인
        try {
            const cached = await this.get(cacheKey);
            if (cached !== null) {
                console.log('[CacheManager] 캐시 히트:', url);
                return { data: cached, fromCache: true };
            }
        } catch (err) {
            console.warn('[CacheManager] 캐시 읽기 오류:', err);
        }

        // 2. 네트워크 요청
        console.log('[CacheManager] 네트워크 요청:', url);
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`[CacheManager] 요청 실패: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        let data;

        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        // 3. 캐시에 저장
        try {
            await this.set(cacheKey, data, ttlMs);
        } catch (err) {
            console.warn('[CacheManager] 캐시 저장 오류:', err);
        }

        return { data, fromCache: false };
    },

    // ──────────────────────────────────────────
    // URL + 옵션 기반 캐시 키 생성
    // ──────────────────────────────────────────
    _makeCacheKey(url, options = {}) {
        const method = (options.method || 'GET').toUpperCase();
        // 쿼리 파라미터 정렬하여 일관된 키 생성
        try {
            const urlObj = new URL(url, window.location.href);
            const params = [...urlObj.searchParams.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([k, v]) => `${k}=${v}`)
                .join('&');
            const normalizedUrl = `${urlObj.origin}${urlObj.pathname}${params ? '?' + params : ''}`;
            return `${method}:${normalizedUrl}`;
        } catch {
            return `${method}:${url}`;
        }
    },

    // ──────────────────────────────────────────
    // 급식 데이터 전용 캐싱 (24시간 TTL)
    // ──────────────────────────────────────────
    async getLunchData(url) {
        const TTL_LUNCH = 24 * 60 * 60 * 1000; // 24시간
        return this.cachedFetch(url, {}, TTL_LUNCH);
    },

    // ──────────────────────────────────────────
    // 학사일정 데이터 전용 캐싱 (6시간 TTL)
    // ──────────────────────────────────────────
    async getScheduleData(url) {
        const TTL_SCHEDULE = 6 * 60 * 60 * 1000; // 6시간
        return this.cachedFetch(url, {}, TTL_SCHEDULE);
    }
};

// 모듈 로드 시 자동 초기화
CacheManager.init().catch(err => {
    console.warn('[CacheManager] 초기화 실패 (캐싱 비활성화):', err);
});
