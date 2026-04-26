// =============================================
// 초기화
// =============================================
function updateClock() {
    const el = document.getElementById('navClock');
    if (!el) return;
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const days = ['일','월','화','수','목','금','토'];
    el.textContent = `${now.getFullYear()}.${pad(now.getMonth()+1)}.${pad(now.getDate())} (${days[now.getDay()]}) ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// ── PWA ──
let _pwaPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _pwaPrompt = e;
    const btn = document.getElementById('pwaInstallBtn');
    if (btn) { btn.style.display = 'flex'; btn.closest('.pwa-card')?.style.setProperty('display', 'block'); }
});

window.addEventListener('appinstalled', () => {
    _pwaPrompt = null;
    document.getElementById('pwaInstallCard')?.remove();
});

async function pwaInstall() {
    if (!_pwaPrompt) return;
    _pwaPrompt.prompt();
    const { outcome } = await _pwaPrompt.userChoice;
    if (outcome === 'accepted') _pwaPrompt = null;
}

function isKakaoAndroidInApp() {
    const ua = navigator.userAgent || '';
    return /KAKAOTALK/i.test(ua) && /android/i.test(ua);
}

function tryOpenExternalBrowserFromKakao() {
    const ua = navigator.userAgent || '';
    if (!/KAKAOTALK/i.test(ua)) return false;

    const isAndroid = /android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    if (!isAndroid && !isIOS) return false;

    const attemptKey = 'kakao_external_browser_attempted';
    if (sessionStorage.getItem(attemptKey)) return false;
    sessionStorage.setItem(attemptKey, String(Date.now()));

    const targetUrl = location.href;
    const intentPath = targetUrl.replace(/^https?:\/\//i, '');

    if (isAndroid) {
        const chromeIntent = `intent://${intentPath}#Intent;scheme=https;package=com.android.chrome;end`;
        const samsungIntent = `intent://${intentPath}#Intent;scheme=https;package=com.sec.android.app.sbrowser;end`;

        let handedOff = false;
        const markHandedOff = () => { handedOff = true; };
        const onVisibilityChange = () => { if (document.visibilityState === 'hidden') markHandedOff(); };
        const cleanup = () => {
            window.removeEventListener('pagehide', markHandedOff);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', markHandedOff);
        };

        window.addEventListener('pagehide', markHandedOff, { once: true });
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', markHandedOff, { once: true });

        setTimeout(() => {
            location.href = chromeIntent;

            setTimeout(() => {
                if (handedOff) { cleanup(); return; }
                location.href = samsungIntent;

                setTimeout(() => {
                    cleanup();
                    if (!handedOff) location.href = 'x-safari-' + targetUrl; // 둘 다 실패 → Safari
                }, 1500);
            }, 1200);
        }, 250);

    } else if (isIOS) {
        // iOS: Chrome → Safari 순서로 시도
        const chromeURL = 'googlechromes://' + intentPath;

        let handedOff = false;
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') handedOff = true;
        }, { once: true });

        setTimeout(() => {
            location.href = chromeURL;  // Chrome 시도

            setTimeout(() => {
                if (!handedOff) location.href = 'x-safari-' + targetUrl;  // Safari 시도
            }, 1500);
        }, 250);
    }

    return true;
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}

// ── Pull-to-Refresh ──
(function initPullToRefresh() {
    const THRESHOLD = 72;
    let startY = 0, pulling = false;

    const ind = document.createElement('div');
    ind.id = 'ptr-indicator';
    ind.innerHTML = '<span class="ptr-spinner"></span><span class="ptr-arrow">↓</span><span class="ptr-label">당겨서 새로고침</span>';
    document.body.appendChild(ind);

    const label = ind.querySelector('.ptr-label');

    document.addEventListener('touchstart', e => {
        if (window.scrollY === 0) { startY = e.touches[0].clientY; pulling = true; }
    }, { passive: true });

    document.addEventListener('touchmove', e => {
        if (!pulling) return;
        const dist = e.touches[0].clientY - startY;
        if (dist <= 0) { pulling = false; ind.className = ''; return; }
        const ready = dist >= THRESHOLD;
        ind.className = ready ? 'ptr-ready' : 'ptr-pulling';
        label.textContent = ready ? '놓으면 새로고침' : '당겨서 새로고침';
        ind.style.transform = `translateX(-50%) translateY(${Math.min(dist * 0.35, 20)}px)`;
    }, { passive: true });

    document.addEventListener('touchend', async () => {
        if (!pulling) return;
        pulling = false;
        if (!ind.className.includes('ptr-ready')) { ind.className = ''; ind.style.transform = ''; return; }
        ind.className = 'ptr-loading';
        ind.style.transform = '';
        label.textContent = '새로고침 중...';
        try {
            if (currentPage === 'lunch')         await loadLunchPage(_lunchWeekOffset);
            else if (currentPage === 'timetable') await loadTimetableForWeek(_timetableWeekOffset);
            else                                  render();
        } finally {
            await new Promise(r => setTimeout(r, 350));
            ind.className = '';
            ind.style.transform = '';
            label.textContent = '당겨서 새로고침';
        }
    }, { passive: true });
})();

document.addEventListener('DOMContentLoaded', async () => {
    applyTheme(getTheme());
    updateClock();
    setInterval(updateClock, 1000);

    // 메뉴 초기 상태 보장
    const navMenu = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    if (navMenu) navMenu.classList.remove('active');
    if (hamburger) {
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    }

    // IP 차단 체크 후 렌더 (URL 해시로 초기 페이지 결정)
    await checkIPBlock();
    const _initHash = location.hash.replace('#', '');
    history.replaceState({ page: 'home', params: {} }, '', location.pathname + '#home');
    if (_initHash && _initHash !== 'home') {
        currentPage = GUEST_ALLOWED.includes(_initHash) ? _initHash : 'not-found';
        history.pushState({ page: currentPage, params: {} }, '', location.pathname + '#' + currentPage);
    } else {
        currentPage = 'home';
    }
    render();
    tryOpenExternalBrowserFromKakao();

    // Firebase 백그라운드 동기화 (업데이트가 오면 자동 re-render)
    startFirebaseSync();

    // 시간표 로드 (NEIS 전용)
    (async () => {
        await loadTimetableFromNEIS();
    })();

    // 채팅 내역 자정 초기화 (렌더 후 지연 실행)
    setTimeout(() => cleanChatMessages(), 0);

    // 방문자 카운터 (Firebase 연결 후 실행)
    setTimeout(() => trackVisit(), 1500);

    // Self-XSS 경고
    console.warn('%c⚠ 경고!', 'color:red;font-size:2rem;font-weight:bold');
    console.warn('이 콘솔에 코드를 붙여넣지 마세요. 당신의 정보가 탈취될 수 있습니다.');
});
