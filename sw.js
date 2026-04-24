// =============================================
// 은가람중 1-2반 Service Worker
// 버전: eg-1-2-v6
// =============================================

const CACHE_VERSION = 'eg-1-2-v6';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// 사전 캐싱할 정적 자산
const PRECACHE_URLS = [
    './',
    './style.min.css?v=35',
    './js/main.js?v=35',
    './js/router.js?v=35',
    './js/lunch.js?v=35',
    './js/timetable.js?v=35',
    './assets/logo.svg',
    './assets/icon-pwa.svg'
];

// 네트워크 우선으로 처리할 URL 패턴 (API 요청)
const NETWORK_FIRST_PATTERNS = [
    /open\.neis\.go\.kr/,
    /firebaseio\.com/,
    /firestore\.googleapis\.com/,
    /googleapis\.com/,
    /firebase\.google\.com/,
    /identitytoolkit\.googleapis\.com/
];

// 캐싱을 완전히 건너뛸 URL 패턴 (Chrome 익스텐션 등)
const SKIP_CACHE_PATTERNS = [
    /chrome-extension:\/\//,
    /^chrome:/
];

// ──────────────────────────────────────────────
// install 이벤트: 정적 자산 사전 캐싱
// ──────────────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => {
                // 새 SW를 즉시 활성화 (대기 건너뜀)
                return self.skipWaiting();
            })
            .catch(err => console.error('[SW] 사전 캐싱 실패:', err))
    );
});

// ──────────────────────────────────────────────
// activate 이벤트: 이전 캐시 삭제 + 클라이언트 알림
// ──────────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                // 현재 버전이 아닌 캐시는 모두 삭제
                const deleteOld = keys
                    .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
                    .map(k => {
                        console.log('[SW] 이전 캐시 삭제:', k);
                        return caches.delete(k);
                    });
                return Promise.all(deleteOld);
            })
            .then(() => self.clients.claim())
            .then(() => {
                // 모든 열린 클라이언트에 업데이트 알림 전송
                return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            })
            .then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'SW_UPDATE_AVAILABLE', version: CACHE_VERSION });
                });
            })
    );
});

// ──────────────────────────────────────────────
// fetch 이벤트: 요청 유형별 캐시 전략 적용
// ──────────────────────────────────────────────
self.addEventListener('fetch', event => {
    // GET 요청만 처리
    if (event.request.method !== 'GET') return;

    const url = event.request.url;

    // 특정 패턴은 캐싱 건너뜀
    if (SKIP_CACHE_PATTERNS.some(p => p.test(url))) return;

    // API 요청: 네트워크 우선 전략
    if (NETWORK_FIRST_PATTERNS.some(p => p.test(url))) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    // 그 외: Stale-While-Revalidate 전략
    event.respondWith(staleWhileRevalidate(event.request));
});

// ──────────────────────────────────────────────
// 전략 1: Stale-While-Revalidate
// 캐시에서 즉시 응답하고 백그라운드에서 업데이트
// ──────────────────────────────────────────────
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await caches.match(request);

    // 백그라운드에서 최신 버전으로 캐시 갱신
    const fetchPromise = fetch(request)
        .then(response => {
            if (response && response.status === 200 && response.type === 'basic') {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(err => {
            console.warn('[SW] 네트워크 요청 실패 (SWR):', err);
            return null;
        });

    // 캐시가 있으면 즉시 반환하고 백그라운드에서 갱신
    if (cached) {
        // 백그라운드 갱신은 기다리지 않음
        fetchPromise;
        return cached;
    }

    // 캐시 없으면 네트워크 응답 대기
    const networkResponse = await fetchPromise;
    if (networkResponse) return networkResponse;

    // 네트워크도 실패 시 index.html 폴백
    return caches.match('./') || new Response('오프라인 상태입니다.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
}

// ──────────────────────────────────────────────
// 전략 2: 네트워크 우선 (API 요청용)
// 네트워크 실패 시 캐시 반환
// ──────────────────────────────────────────────
async function networkFirst(request) {
    try {
        const response = await fetch(request);

        // 성공 응답은 동적 캐시에 저장
        if (response && response.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        console.warn('[SW] 네트워크 요청 실패 (Network First), 캐시 사용:', request.url);

        // 캐시된 응답 반환 시도
        const cached = await caches.match(request);
        if (cached) return cached;

        // 완전 실패 시 오프라인 응답
        return new Response(JSON.stringify({ error: '오프라인 상태입니다.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
    }
}

// ──────────────────────────────────────────────
// push 이벤트: 푸시 알림 수신
// ──────────────────────────────────────────────
self.addEventListener('push', event => {
    let data = { title: '은가람 1-2반', body: '새 알림이 있습니다.', icon: './assets/icon-pwa.svg' };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || './assets/icon-pwa.svg',
        badge: './assets/icon-pwa.svg',
        vibrate: [200, 100, 200],
        data: { url: data.url || './' },
        actions: [
            { action: 'open', title: '확인하기' },
            { action: 'close', title: '닫기' }
        ],
        requireInteraction: false,
        tag: data.tag || 'eg12-notification'
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ──────────────────────────────────────────────
// notificationclick 이벤트: 알림 클릭 처리
// ──────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
    const notification = event.notification;
    const action = event.action;
    const targetUrl = (notification.data && notification.data.url) ? notification.data.url : './';

    notification.close();

    if (action === 'close') return;

    // 'open' 액션이거나 알림 본문 클릭 시 페이지 열기
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clients => {
                // 이미 열린 탭이 있으면 포커스
                for (const client of clients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        client.navigate(targetUrl);
                        return;
                    }
                }
                // 열린 탭이 없으면 새 탭 열기
                if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl);
                }
            })
    );
});

// ──────────────────────────────────────────────
// message 이벤트: 클라이언트로부터 메시지 수신
// ──────────────────────────────────────────────
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
