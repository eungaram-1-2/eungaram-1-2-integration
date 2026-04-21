// =============================================
// 라우터
// =============================================
let currentPage = 'home';
let pageParams  = {};

function navigate(page, params = {}) {
    if (!RateLimit.check('navigate')) return;
    currentPage = page;
    pageParams  = params;
    if (isAdmin() && typeof logAccess === 'function') logAccess();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 모바일 메뉴 자동 닫기
    const menu     = document.getElementById('navMenu');
    const btn      = document.getElementById('hamburger');
    const backdrop = document.getElementById('menuBackdrop');
    if (menu)     menu.classList.remove('active');
    if (btn)      btn.classList.remove('active');
    if (btn)      btn.setAttribute('aria-expanded', 'false');
    if (btn)      btn.setAttribute('aria-label', '메뉴 열기');
    if (backdrop) backdrop.classList.remove('active');
}

const BANNED_RESTRICTED   = ['dday'];
const TIMEOUT_RESTRICTED  = ['dday','votes','vote-detail','vote-create'];
const GUEST_ALLOWED       = ['home','timetable','lunch','academic','weather','cleaning','votes','vote-detail','vote-create','dday','chat','links','suggestion','games','admin'];

// 로그인 기능 삭제로 인해 더 이상 사용되지 않음
// function renderLoginRequiredPage() { ... }

function renderBannedPage() {
    return `
    <div class="page">
        <div class="empty-state">
            <div class="empty-icon">🚫</div>
            <p style="color:var(--danger);font-weight:700;font-size:1rem">계정이 정지되었습니다.</p>
            <p style="font-size:0.85rem;margin-top:8px;color:var(--text-muted)">공지사항 보기, 투표 보기, 바로가기만 이용할 수 있습니다.<br>문의는 담임선생님께 연락하세요.</p>
        </div>
    </div>`;
}

function renderTimedOutPage() {
    const info   = getTimeoutInfo();
    const until  = info ? info.until : Date.now();
    const pad    = n => String(n).padStart(2, '0');

    function fmtUntil(ts) {
        const d = new Date(ts);
        const days  = ['일','월','화','수','목','금','토'];
        return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} (${days[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    function fmtRemaining(ms) {
        if (ms <= 0) return '00:00:00';
        const s  = Math.floor(ms / 1000);
        const dd = Math.floor(s / 86400);
        const hh = Math.floor((s % 86400) / 3600);
        const mm = Math.floor((s % 3600) / 60);
        const ss = s % 60;
        if (dd > 0) return `${dd}일 ${pad(hh)}:${pad(mm)}:${pad(ss)}`;
        return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
    }

    // 카운트다운 시작 (DOM 삽입 후)
    setTimeout(() => {
        const el = document.getElementById('timeoutCountdown');
        if (!el) return;
        const tick = () => {
            const rem = until - Date.now();
            if (rem <= 0) { render(); return; }   // 만료 → 자동 해제
            el.textContent = fmtRemaining(rem);
        };
        tick();
        const t = setInterval(() => {
            if (!document.getElementById('timeoutCountdown')) { clearInterval(t); return; }
            tick();
        }, 1000);
    }, 0);

    return `
    <div class="page">
        <div class="empty-state timeout-state">
            <div class="timeout-icon">⏳</div>
            <p class="timeout-title">일시적으로 제한되었습니다</p>
            <p class="timeout-sub">아래 시간이 지나면 자동으로 해제됩니다.</p>
            <div class="timeout-countdown-wrap">
                <span id="timeoutCountdown" class="timeout-countdown">${fmtRemaining(until - Date.now())}</span>
            </div>
            <p class="timeout-until">해제 시각: <strong>${fmtUntil(until)}</strong></p>
            <p class="timeout-hint">홈, 시간표, 바로가기는 이용할 수 있습니다.</p>
        </div>
    </div>`;
}

function render() {
    const app = document.getElementById('app');
    updateNav();
    applyTheme(getTheme());

    const MAINTENANCE_BLOCKED = ['timetable','lunch','academic','links'];
    try {
        const _mmRaw = localStorage.getItem('maintenance_mode');
        if (_mmRaw) {
            const _mm = JSON.parse(_mmRaw);
            if (_mm && _mm.active === true && !isAdmin() && MAINTENANCE_BLOCKED.includes(currentPage)) {
                app.innerHTML = renderMaintenancePage(_mm.message);
                return;
            }
        }
    } catch(e) { console.warn('[점검모드] 파싱 오류:', e); }

    if (isLoggedIn() && isBanned() && BANNED_RESTRICTED.includes(currentPage)) {
        app.innerHTML = renderBannedPage();
        return;
    }

    if (isLoggedIn() && isTimedOut() && TIMEOUT_RESTRICTED.includes(currentPage)) {
        app.innerHTML = renderTimedOutPage();
        return;
    }

    switch (currentPage) {
        case 'home':         app.innerHTML = renderHome();              break;
        case 'timetable':    app.innerHTML = renderTimetable(); _timetableWeekOffset = 0; setTimeout(() => loadTimetableForWeek(0), 0); break;
        case 'academic':     renderAcademicCalendar();                  break;
        case 'votes':        app.innerHTML = renderVotes();             break;
        case 'vote-detail':  app.innerHTML = renderVoteDetail();        break;
        case 'vote-create':  app.innerHTML = renderVoteCreate();        break;
        case 'dday':         app.innerHTML = renderDday();              break;
        case 'chat':         app.innerHTML = renderChat();              break;
        case 'links':        app.innerHTML = renderLinks();             break;
        case 'suggestion':   app.innerHTML = renderSuggestion();       break;
        case 'admin':        app.innerHTML = isAdmin() ? renderAdmin() : renderHome(); break;
        case 'games':        app.innerHTML = renderGames(); break;
        // case 'seat-draw':    app.innerHTML = renderSeatDraw();          break;
        case 'lunch':        app.innerHTML = renderLunch(); setTimeout(() => loadLunchPageWithAutoScroll(), 0); break;
        case 'cleaning':     app.innerHTML = renderCleaning(); break;
        // case 'map':          app.innerHTML = renderMap(); setTimeout(() => initMapPage(), 0); break;
        default:             app.innerHTML = renderHome();
    }

    document.getElementById('emergencyBanner')?.remove();
    try {
        const enRaw = localStorage.getItem('emergency_notice');
        if (enRaw) {
            const en = JSON.parse(enRaw);
            if (en && en.active === true) {
                const banner = document.createElement('div');
                banner.id = 'emergencyBanner';
                banner.style.cssText = `background:${en.color};color:white;position:fixed;top:64px;left:0;right:0;z-index:1000;box-shadow:0 3px 12px rgba(0,0,0,0.3)`;
                banner.innerHTML = `
                <div style="display:flex;justify-content:center;align-items:center;padding:8px 48px;gap:12px;position:relative;text-align:center">
                    <div>
                        <div style="font-weight:bold;font-size:0.9rem;margin-bottom:2px;color:#000!important;-webkit-text-fill-color:#000!important">${escapeHtml(en.title)}</div>
                        <div style="font-size:0.8rem;opacity:0.9;color:#000!important;-webkit-text-fill-color:#000!important">${escapeHtml(en.message)}</div>
                    </div>
                    <button onclick="document.getElementById('emergencyBanner').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:0.9rem;line-height:1;position:absolute;right:12px;top:50%;transform:translateY(-50%)">&times;</button>
                </div>`;
                document.body.appendChild(banner);
            }
        }
    } catch(e) {}
}

function updateNav() {
    const authDiv = document.getElementById('navAuth');
    authDiv.innerHTML = '';
    const mobileSection = document.getElementById('navMenuUserSection');
    if (mobileSection) mobileSection.style.display = 'none';

    const loggedIn = isLoggedIn();
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('guest-mode', !loggedIn);

    document.querySelectorAll('.nav-menu li').forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;
        const p = a.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
        const guestHidden = [];
        li.style.display = (!loggedIn && guestHidden.includes(p)) ? 'none' : '';
        a.classList.remove('active');
        if (p === currentPage ||
            (p === 'board'     && currentPage.startsWith('board'))  ||
            (p === 'votes'     && currentPage.startsWith('vote'))   ||
            (p === 'links'     && currentPage === 'links')          ||
            (p === 'dday'      && currentPage === 'dday')  ||
            (p === 'lunch'     && currentPage === 'lunch')  ||
            (p === 'academic'  && currentPage === 'academic')  ||
            (p === 'weather'   && currentPage === 'weather') ||
            (p === 'cleaning'  && currentPage === 'cleaning')) {
            a.classList.add('active');
        }
    });
}

function toggleMenu() {
    const menu = document.getElementById('navMenu');
    const btn  = document.getElementById('hamburger');
    let backdrop = document.getElementById('menuBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'menuBackdrop';
        backdrop.className = 'menu-backdrop';
        backdrop.onclick = () => {
            menu.classList.remove('active');
            btn && btn.classList.remove('active');
            btn && btn.setAttribute('aria-expanded', 'false');
            btn && btn.setAttribute('aria-label', '메뉴 열기');
            backdrop.classList.remove('active');
        };
        document.body.appendChild(backdrop);
    }
    menu.classList.toggle('active');
    btn && btn.classList.toggle('active');
    backdrop.classList.toggle('active');
    const isOpen = menu.classList.contains('active');
    btn && btn.setAttribute('aria-expanded', isOpen);
    btn && btn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
}

// 스크롤 감지
window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });
