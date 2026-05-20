// =============================================
// 홈 대시보드
// =============================================
function renderHome() {
    const realNow = new Date();
    const nowMid  = new Date(); nowMid.setHours(0, 0, 0, 0);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const todayDow = realNow.getDay();

    const y  = realNow.getFullYear();
    const mo = String(realNow.getMonth() + 1).padStart(2, '0');
    const d  = String(realNow.getDate()).padStart(2, '0');
    const dow = dayNames[todayDow];

    // D-Day
    const upcomingDdays = DB.get('ddays')
        .filter(dd => new Date(dd.date + 'T00:00:00') >= nowMid)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 4);

    const ddayHtml = upcomingDdays.length > 0
        ? upcomingDdays.map(dd => {
            const diff = calcDday(dd.date);
            const label = formatDdayLabel(diff);
            let badgeBg = 'rgba(79,70,229,0.1)'; let badgeColor = 'var(--primary)';
            if (diff === 0)       { badgeBg = 'rgba(239,68,68,0.12)';    badgeColor = '#ef4444'; }
            else if (diff <= 3)   { badgeBg = 'rgba(245,158,11,0.12)';   badgeColor = '#d97706'; }
            else if (diff <= 7)   { badgeBg = 'rgba(6,182,212,0.12)';    badgeColor = '#0891b2'; }
            return `<div class="side-dday-item">
                <span class="side-dday-label">${dd.emoji || '📌'} ${escapeHtml(dd.title)}</span>
                <span class="side-dday-badge" style="background:${badgeBg};color:${badgeColor}">${label}</span>
            </div>`;
        }).join('')
        : '';

    // 학사일정 미니 (초기 렌더 — NEIS 로드 전)
    const calHtml = _buildCalHtml(y, mo, d, dayNames);

    // 바로가기
    const linksHtml = QUICK_LINKS.map(link => {
        let onClickAttr = '';
        if (link.audio)      onClickAttr = `onclick="openSchoolSongModal('${link.audio}','${escapeHtml(link.title)}')"`;
        else if (link.page)  onClickAttr = `onclick="navigate('${link.page}')"`;
        else                 onClickAttr = `onclick="window.open('${link.url}','_blank','noopener')"`;
        return `<div class="home-link-row" ${onClickAttr}>
            <span class="home-link-icon-wrap" style="background:${link.color}1A;color:${link.color}">${link.icon}</span>
            <span class="home-link-title-txt">${escapeHtml(link.title)}</span>
            <span class="home-link-arr">›</span>
        </div>`;
    }).join('');

    // 시간표 탭 — 주중이면 오늘, 주말이면 월요일
    const days = ['월', '화', '수', '목', '금'];
    const todayTtIdx = (todayDow >= 1 && todayDow <= 5) ? todayDow - 1 : 0;
    const ttTabs = days.map((day, i) =>
        `<button class="home-tt-tab${i === todayTtIdx ? ' active' : ''}"
            onclick="homeSelectTtDay(${i})">${day}</button>`
    ).join('');

    setTimeout(() => {
        loadLunchWidget();
        _renderHomeTtDay(todayTtIdx);
        _refreshCalAfterNeis(y, mo, d, dayNames);
    }, 0);

    return `
    <div class="home-dashboard">
        <div class="home-dash-header">
            <img src="assets/logo.svg" alt="은가람중학교" class="home-dash-logo-img">
            <div class="home-dash-info">
                <div class="home-dash-school">
                    은가람중학교
                    <span class="home-dash-class">1학년 2반</span>
                </div>
                <div class="home-dash-date">오늘은 ${y}년 ${mo}월 ${d}일 ${dow}요일입니다</div>
            </div>
        </div>

        <div class="home-two-col" style="margin-top:12px">
            <div class="home-main-col">

                <!-- 이번 주 급식 -->
                <div class="home-card">
                    <div class="home-card-hd">
                        <span class="home-card-icon">🍱</span>
                        <span class="home-card-title">이번 주 급식</span>
                        <button class="home-card-more" onclick="navigate('lunch')">전체보기 →</button>
                    </div>
                    ${renderLunchWidget()}
                </div>

                <!-- 시간표 -->
                <div class="home-card" style="margin-top:20px">
                    <div class="home-card-hd">
                        <span class="home-card-icon">📅</span>
                        <span class="home-card-title">시간표</span>
                        <button class="home-card-more" onclick="navigate('timetable')">전체보기 →</button>
                    </div>
                    <div class="home-tt-tabs" role="tablist">${ttTabs}</div>
                    <div class="home-tt-chips" id="homeTtChips"></div>
                </div>

            </div>

            <div class="home-side-col">

                <!-- 학사일정 -->
                <div class="home-card">
                    <div class="home-card-hd">
                        <span class="home-card-icon">🗓️</span>
                        <span class="home-card-title">학사일정</span>
                        <button class="home-card-more" onclick="navigate('academic')">더보기 →</button>
                    </div>
                    <div class="home-cal-list" id="homeCalList">${calHtml}</div>
                </div>

                <!-- 바로가기 -->
                <div class="home-card">
                    <div class="home-card-hd">
                        <span class="home-card-icon">🔗</span>
                        <span class="home-card-title">바로가기</span>
                        <button class="home-card-more" onclick="navigate('links')">더보기 →</button>
                    </div>
                    <div class="home-links-list">${linksHtml}</div>
                </div>

                ${upcomingDdays.length > 0 ? `
                <!-- D-Day -->
                <div class="home-card">
                    <div class="home-card-hd">
                        <span class="home-card-icon">📌</span>
                        <span class="home-card-title">D-Day</span>
                        <button class="home-card-more" onclick="navigate('dday')">더보기 →</button>
                    </div>
                    ${ddayHtml}
                </div>` : ''}

            </div>
        </div>
    </div>`;
}

// =============================================
// 학사일정 HTML 빌드 헬퍼
// =============================================
function _buildCalHtml(y, mo, d, dayNames) {
    if (typeof academicCalendarData === 'undefined' || !academicCalendarData?.events?.length) {
        return `<p class="home-cal-empty">일정 정보를 불러오는 중...</p>`;
    }
    const todayStr = `${y}-${mo}-${d}`;
    const upcoming = academicCalendarData.events
        .filter(e => e.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 6);

    if (!upcoming.length) return `<p class="home-cal-empty">다가오는 일정이 없습니다</p>`;

    return upcoming.map(e => {
        const ed   = new Date(e.date + 'T00:00:00');
        const em   = ed.getMonth() + 1;
        const edd  = ed.getDate();
        const edow = dayNames[ed.getDay()];
        let bc = 'hcal-badge-event';
        if (e.category === 'exam')    bc = 'hcal-badge-exam';
        else if (e.category === 'holiday') bc = 'hcal-badge-holiday';
        return `<div class="home-cal-row">
            <div class="home-cal-date-col">
                <span class="home-cal-mday">${em}/${edd}</span>
                <span class="home-cal-mdow">${edow}</span>
            </div>
            <span class="home-cal-title-txt">${escapeHtml(e.title)}</span>
            <span class="home-cal-badge ${bc}">${e.category === 'exam' ? '시험' : e.category === 'holiday' ? '휴일' : '행사'}</span>
        </div>`;
    }).join('');
}

// NEIS 로드 완료 후 학사일정 갱신
async function _refreshCalAfterNeis(y, mo, d, dayNames) {
    if (typeof loadNeisSchedule !== 'function') return;
    try {
        await loadNeisSchedule();
        const el = document.getElementById('homeCalList');
        if (el) el.innerHTML = _buildCalHtml(y, mo, d, dayNames) ||
            `<p class="home-cal-empty">다가오는 일정이 없습니다</p>`;
    } catch (_) {}
}

// =============================================
// 홈 시간표 위젯
// =============================================
function homeSelectTtDay(idx) {
    document.querySelectorAll('.home-tt-tab').forEach((t, i) =>
        t.classList.toggle('active', i === idx)
    );
    _renderHomeTtDay(idx);
}

function _renderHomeTtDay(dayIdx) {
    const el = document.getElementById('homeTtChips');
    if (!el) return;

    const schedule = TIMETABLE?.schedule;
    const periods  = TIMETABLE?.periods || [];

    if (!schedule || !periods.length) {
        el.innerHTML = `<span style="color:var(--text-muted);font-size:0.85rem">시간표 정보가 없습니다</span>`;
        return;
    }

    const chips = periods.map((p, i) => {
        const cell = schedule[i]?.[dayIdx];
        const subj = cell?.s || '';
        if (!subj) return '';
        const color = (typeof SUBJ_COLORS !== 'undefined' && SUBJ_COLORS[subj]) || '#1428A0';
        const bgColor = color + '18';
        const borderColor = color + '30';
        return `<div class="home-tt-chip" style="background:${bgColor};border:1.5px solid ${borderColor}">
            <span class="home-tt-period">${i + 1}교시</span>
            <span class="home-tt-subj" style="color:${color}">${subj}</span>
        </div>`;
    }).filter(Boolean).join('');

    el.innerHTML = chips || `<span style="color:var(--text-muted);font-size:0.85rem">수업이 없는 날입니다</span>`;
}

// =============================================
// 레거시 히어로 함수 (다른 코드에서 호출 방지)
// =============================================
let _heroAnimId = null;
let _heroCleanup = null;

function _initHeroCanvas() {
    if (_heroAnimId) { cancelAnimationFrame(_heroAnimId); _heroAnimId = null; }
    if (_heroCleanup) { _heroCleanup(); _heroCleanup = null; }
    // dashboard mode — no canvas
}

function _initHeroClock() {
    const el = document.getElementById('heroClock');
    if (!el) return;
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const now = new Date();
    el.textContent = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} (${dayNames[now.getDay()]})`;
}
