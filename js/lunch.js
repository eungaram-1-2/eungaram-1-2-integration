// =============================================
// 급식 메뉴 (NEIS API + Firebase + JSON 폴백)
// =============================================
const LUNCH_DATA_URL = 'data/lunch.json';

const NEIS_LUNCH_CONFIG = {
    API_KEY: 'ed50e755df5d42d4b94db728feab7952',
    ATPT_CODE: 'J10',
    SCHOOL_CODE: '7692130',
    BASE_URL: 'https://open.neis.go.kr/hub/mealServiceDietInfo'
};

function _getLunchWeekRange(weekOffset = 0) {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const fmt = d => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    return { from: fmt(monday), to: fmt(friday), monday };
}

async function _fetchLunchDataFromNEIS(weekOffset = 0) {
    try {
        const { from, to } = _getLunchWeekRange(weekOffset);
        const url = `${NEIS_LUNCH_CONFIG.BASE_URL}?KEY=${NEIS_LUNCH_CONFIG.API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${NEIS_LUNCH_CONFIG.ATPT_CODE}&SD_SCHUL_CODE=${NEIS_LUNCH_CONFIG.SCHOOL_CODE}&MLSV_FROM_YMD=${from}&MLSV_TO_YMD=${to}`;

        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (!data.mealServiceDietInfo || data.mealServiceDietInfo.length < 2) return null;

        const rows = data.mealServiceDietInfo[1].row || [];
        if (!rows.length) return null;

        const menus = {};
        rows.forEach(row => {
            const ymd = row.MLSV_YMD;
            const dateStr = `${ymd.slice(0,4)}-${ymd.slice(4,6)}-${ymd.slice(6,8)}`;
            const rawItems = (row.DDISH_NM || '').split('<br/>').map(s => s.trim()).filter(s => s);
            const kcalMatch = (row.CAL_INFO || '').match(/([\d.]+)\s*Kcal/i);
            menus[dateStr] = {
                items: rawItems,
                kcal: kcalMatch ? kcalMatch[1] : null
            };
        });

        console.info('[NEIS] 급식 데이터 로드 성공:', Object.keys(menus).length, '일');
        return { updated: new Date().toISOString(), menus };
    } catch (e) {
        console.warn('[NEIS] 급식 로드 실패:', e.message);
        return null;
    }
}

// 음식명에서 알레르기 정보 파싱 및 포맷팅
function cleanMenuItem(text) {
    if (!text) return '';
    // 알레르기 번호 파싱: (1.5.6.10) 형태
    const allergenMatch = text.match(/\(([\d.]+)\)/);
    const allergenNums = allergenMatch
        ? allergenMatch[1].split('.').map(Number).filter(n => ALLERGEN_MAP[n]).sort((a, b) => a - b)
        : [];
    // 알레르기 번호 및 크기 표시 제거
    const name = text.replace(/\([\d.]+\)/g, '').replace(/\([가-힣]+\)/g, '').trim();
    if (!name) return '';
    const allergenHtml = allergenNums.length
        ? `<br><span class="allergen-list" title="${allergenNums.map(n => `${n}.${ALLERGEN_MAP[n]}`).join(', ')}">${allergenNums.join('·')}</span>`
        : '';
    return `${name}${allergenHtml}`;
}

function _lunchTodayStr() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}

// =============================================
// 급식 데이터 로드 (Firebase 우선, JSON 폴백)
// =============================================
const _lunchDataCache = {}; // weekOffset -> promise

async function _fetchLunchDataFromFirebase() {
    if (!fbReady()) return null;

    try {
        const today = _lunchTodayStr();
        const snapshot = await _fbDB.ref(`lunch/${today}`).once('value');
        const data = snapshot.val();

        if (data && data.items && Array.isArray(data.items)) {
            console.info('[Firebase] 오늘 급식 데이터 로드 성공');
            return {
                updated: data.updated || new Date().toISOString(),
                menus: { [today]: data }
            };
        }
        return null;
    } catch (e) {
        console.warn('[Firebase] 급식 로드 실패:', e.message);
        return null;
    }
}

async function _fetchLunchDataFromJSON() {
    if (window.location.protocol === 'file:') return { updated: '', menus: {} };
    try {
        const res = await fetch(LUNCH_DATA_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.warn('[JSON] 급식 데이터 로드 실패:', e.message);
        return { updated: '', menus: {} };
    }
}

// =============================================
// 프록시를 통한 학교 홈페이지 직접 스크래핑 (폴백)
// =============================================
const _SCRAPE_URL = 'https://eungaram-m.goegh.kr/eungaram-m/ad/fm/foodmenu/selectFoodMenuView.do?mi=8056';

function _cleanScrapedItem(text) {
    return text.replace(/\([\d.]+\)/g, '').replace(/\([가-힣]+\)/g, '').trim();
}

async function _fetchWithProxy(targetUrl, cacheKey) {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;

    const proxyUrls = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
        `https://thingproxy.freeboard.io/fetch/${targetUrl}`,
    ];

    const tryProxy = async (url) => {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 8000);
        try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(tid);
            if (!res.ok) throw new Error('not ok');
            const text = await res.text();
            if (!text || text.length < 100) throw new Error('empty');
            return text;
        } finally {
            clearTimeout(tid);
        }
    };

    const text = await Promise.any(proxyUrls.map(tryProxy));
    sessionStorage.setItem(cacheKey, text);
    return text;
}

function _parseScrapedHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const menus = {};

    const headerRow = doc.querySelector('thead tr');
    if (!headerRow) return menus;
    const ths = headerRow.querySelectorAll('th');

    const lunchRow = Array.from(doc.querySelectorAll('tbody tr')).find(tr => {
        const th = tr.querySelector('th');
        return th && th.textContent.trim() === '중식';
    });
    if (!lunchRow) return menus;

    const tds = lunchRow.querySelectorAll('td');

    for (let i = 1; i < ths.length; i++) {
        const label = ths[i].textContent.trim();
        const dateMatch = label.match(/\d{4}-\d{2}-\d{2}/);
        if (!dateMatch) continue;
        const dateStr = dateMatch[0];

        const td = tds[i - 1];
        if (!td) continue;

        const kcalP = td.querySelector('p.fm_tit_p');
        const kcal = kcalP ? ((kcalP.textContent.match(/([\d.]+)\s*Kcal/i) || [])[1] || null) : null;

        const menuP = td.querySelector('p[class=""]') ||
            Array.from(td.querySelectorAll('p')).find(p =>
                !p.classList.contains('fm_tit_p') && !p.classList.contains('btn_style1')
            );

        const items = menuP
            ? menuP.innerHTML
                .split(/<br\s*\/?>/i)
                .map(s => s.replace(/<[^>]+>/g, '').trim())
                .filter(s => s.length > 0)
            : [];

        if (items.length > 0) {
            menus[dateStr] = { items, kcal };
        }
    }
    return menus;
}

async function _fetchLunchDataFromScrape() {
    try {
        const today = _lunchTodayStr();
        const cacheKey = `scrape_lunch_${today}`;
        const html = await _fetchWithProxy(_SCRAPE_URL, cacheKey);
        const menus = _parseScrapedHtml(html);
        if (Object.keys(menus).length > 0) {
            console.info('[Scrape] 학교 홈페이지에서 급식 데이터 로드 성공');
            return { updated: new Date().toISOString(), menus };
        }
        return null;
    } catch (e) {
        console.warn('[Scrape] 스크래핑 실패:', e.message);
        return null;
    }
}

async function _fetchLunchData(weekOffset = 0) {
    if (_lunchDataCache[weekOffset]) return _lunchDataCache[weekOffset];

    _lunchDataCache[weekOffset] = (async () => {
        const today = _lunchTodayStr();

        if (weekOffset === 0) {
            // 이번 주: Firebase → NEIS → JSON → 스크래핑
            const fbData = await _fetchLunchDataFromFirebase();
            if (fbData && fbData.menus && fbData.menus[today]) return fbData;

            const neisData = await _fetchLunchDataFromNEIS(0);
            if (neisData && Object.keys(neisData.menus).length > 0) return neisData;

            const jsonData = await _fetchLunchDataFromJSON();
            if (jsonData.menus && jsonData.menus[today]) return jsonData;

            console.info('[Lunch] JSON에 오늘 데이터 없음, 스크래핑 시도');
            const scrapeData = await _fetchLunchDataFromScrape();
            if (scrapeData && Object.keys(scrapeData.menus).length > 0) {
                return { updated: scrapeData.updated, menus: { ...(jsonData.menus || {}), ...scrapeData.menus } };
            }
            return jsonData;
        } else {
            // 다른 주: NEIS API만 사용
            const neisData = await _fetchLunchDataFromNEIS(weekOffset);
            if (neisData && Object.keys(neisData.menus).length > 0) return neisData;
            return { updated: '', menus: {} };
        }
    })();

    return _lunchDataCache[weekOffset];
}

// =============================================
// 오늘의 급식 (홈 위젯용)
// =============================================
let _todayMenuPromise = null;

async function fetchLunchMenu() {
    if (_todayMenuPromise) return _todayMenuPromise;

    const todayStr = _lunchTodayStr();
    const cacheKey = `lunch_${todayStr}`;
    const cached   = localStorage.getItem(cacheKey);
    if (cached) {
        _todayMenuPromise = Promise.resolve(JSON.parse(cached));
        return _todayMenuPromise;
    }

    _todayMenuPromise = _fetchLunchData(0).then(data => {
        const menu = data.menus[todayStr];
        if (!menu || !menu.items.length) return null;

        const result = { items: menu.items, kcal: menu.kcal, date: todayStr };
        localStorage.setItem(cacheKey, JSON.stringify(result));

        // 어제 캐시 정리
        const yesterday = new Date(Date.now() - 86400000);
        const yp = n => String(n).padStart(2, '0');
        localStorage.removeItem(`lunch_${yesterday.getFullYear()}-${yp(yesterday.getMonth()+1)}-${yp(yesterday.getDate())}`);

        return result;
    });

    return _todayMenuPromise;
}

// =============================================
// 주간 급식 (전체보기용)
// =============================================
async function fetchWeeklyLunch(weekOffset = 0) {
    const dayNames = ['일','월','화','수','목','금','토'];
    const { monday } = _getLunchWeekRange(weekOffset);

    const p = n => String(n).padStart(2, '0');
    const weekDays = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return {
            date:        `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`,
            displayDate: `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())}`,
            day:         dayNames[d.getDay()],
            items:       [],
            kcal:        null
        };
    });

    const data = await _fetchLunchData(weekOffset);

    const lunchOverride = DB.get('lunch_override', {});

    for (const dayData of weekDays) {
        if (lunchOverride[dayData.date]) {
            dayData.items = lunchOverride[dayData.date];
            dayData.kcal  = null;
        } else {
            const menu = data.menus[dayData.date];
            if (menu) {
                dayData.items = menu.items;
                dayData.kcal  = menu.kcal || null;
            }
        }
    }

    return weekDays;
}

// 스크립트 로드 시 프리페치
_fetchLunchData();
fetchLunchMenu();

// =============================================
// 홈 화면용 급식 위젯
// =============================================
function renderLunchWidget() {
    return `
    <div class="lunch-widget" id="lunchWidget">
        <div class="lunch-widget-header">
            <span class="lunch-icon">🍱</span>
            <div>
                <h3>오늘의 급식</h3>
                <p class="lunch-date" id="lunchDate"></p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="navigate('lunch')" style="margin-left:auto">전체보기</button>
        </div>
        <div class="lunch-widget-body" id="lunchWidgetBody">
            <div class="lunch-loading">
                <span class="lunch-spinner"></span>
                <span>급식 정보 불러오는 중...</span>
            </div>
        </div>
    </div>`;
}

async function loadLunchWidget() {
    const body   = document.getElementById('lunchWidgetBody');
    const dateEl = document.getElementById('lunchDate');
    if (!body) return;

    const menu  = await fetchLunchMenu();
    const today = new Date();
    const days  = ['일','월','화','수','목','금','토'];
    const p     = n => String(n).padStart(2, '0');

    if (dateEl) {
        dateEl.textContent = `${today.getFullYear()}.${p(today.getMonth()+1)}.${p(today.getDate())} (${days[today.getDay()]})`;
    }

    if (!menu) {
        body.innerHTML = `<div class="lunch-empty">🚫 오늘은 급식이 없거나 정보를 불러올 수 없습니다.</div>`;
        return;
    }

    const kcalBadge = menu.kcal ? `<span class="lunch-kcal">${menu.kcal} kcal</span>` : '';
    const itemsHtml = menu.items.map(item =>
        `<li class="lunch-item">${cleanMenuItem(item)}</li>`
    ).join('');

    body.innerHTML = `
        ${kcalBadge}
        <ul class="lunch-list">${itemsHtml}</ul>`;
}

// =============================================
// 전용 급식 페이지 (주간 테이블)
// =============================================
let _lunchWeekOffset = 0;

function renderLunch() {
    return `
    <div class="page">
        <div class="page-header header-white">
            <h2>🍱 급식</h2>
            <button class="btn btn-primary" onclick="downloadLunch()" style="margin-top:12px">📥 급식 저장</button>
        </div>
        <div class="container" style="max-width:900px;margin:0 auto;padding:0 20px 60px">
            <div class="week-nav">
                <button class="week-nav-btn" onclick="changeLunchWeek(-1)">◀ 이전 주</button>
                <span class="week-nav-label" id="lunchWeekLabel">이번 주</span>
                <button class="week-nav-btn" onclick="changeLunchWeek(1)">다음 주 ▶</button>
            </div>
            <div class="allergen-panel" id="allergenPanel">
                <div class="allergen-panel-toggle" onclick="document.getElementById('allergenPanel').classList.toggle('open')">
                    <span>🚨 알레르기 정보</span>
                    <span class="allergen-panel-arrow">▼</span>
                </div>
                <div class="allergen-panel-items">
                    <span class="allergen-panel-item"><strong>1</strong>난류</span>
                    <span class="allergen-panel-item"><strong>2</strong>우유</span>
                    <span class="allergen-panel-item"><strong>3</strong>메밀</span>
                    <span class="allergen-panel-item"><strong>4</strong>땅콩</span>
                    <span class="allergen-panel-item"><strong>5</strong>대두</span>
                    <span class="allergen-panel-item"><strong>6</strong>밀</span>
                    <span class="allergen-panel-item"><strong>7</strong>고등어</span>
                    <span class="allergen-panel-item"><strong>8</strong>게</span>
                    <span class="allergen-panel-item"><strong>9</strong>새우</span>
                    <span class="allergen-panel-item"><strong>10</strong>돼지고기</span>
                    <span class="allergen-panel-item"><strong>11</strong>복숭아</span>
                    <span class="allergen-panel-item"><strong>12</strong>토마토</span>
                    <span class="allergen-panel-item"><strong>13</strong>아황산류</span>
                    <span class="allergen-panel-item"><strong>14</strong>호두</span>
                    <span class="allergen-panel-item"><strong>15</strong>닭고기</span>
                    <span class="allergen-panel-item"><strong>16</strong>쇠고기</span>
                    <span class="allergen-panel-item"><strong>17</strong>오징어</span>
                    <span class="allergen-panel-item"><strong>18</strong>조개류</span>
                    <span class="allergen-panel-item"><strong>19</strong>잣</span>
                </div>
            </div>
            <div class="lunch-page-card" id="lunchPageCard">
                <div class="lunch-loading">
                    <span class="lunch-spinner"></span>
                    <span>급식 정보 불러오는 중...</span>
                </div>
            </div>
            <p class="page-source" style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:20px">
                출처: <a href="https://open.neis.go.kr" target="_blank" rel="noopener noreferrer" style="color:var(--primary)">NEIS 교육정보 개방 포털</a>
            </p>
        </div>
    </div>`;
}

function _getLunchWeekLabel(offset) {
    if (offset === 0) return '이번 주';
    if (offset === 1) return '다음 주';
    if (offset === -1) return '지난 주';
    if (offset > 0) return `${offset}주 후`;
    return `${Math.abs(offset)}주 전`;
}

function changeLunchWeek(delta) {
    _lunchWeekOffset += delta;
    const label = document.getElementById('lunchWeekLabel');
    if (label) label.textContent = _getLunchWeekLabel(_lunchWeekOffset);
    loadLunchPage(_lunchWeekOffset);
}

async function loadLunchPage(weekOffset = 0) {
    const card = document.getElementById('lunchPageCard');
    if (!card) return;

    card.innerHTML = `<div class="lunch-loading"><span class="lunch-spinner"></span><span>급식 정보 불러오는 중...</span></div>`;

    const weeklyData = await fetchWeeklyLunch(weekOffset);
    const hasAny = weeklyData.some(d => d.items.length > 0);

    if (!hasAny) {
        card.innerHTML = `
            <div class="lunch-empty" style="padding:48px 24px;text-align:center">
                <div style="font-size:3rem;margin-bottom:16px">🚫</div>
                <p style="font-weight:600;font-size:1rem">급식 정보를 불러올 수 없습니다.</p>
                <p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px">방학, 공휴일, 또는 데이터 준비 중일 수 있습니다.</p>
            </div>`;
        return;
    }

    const maxItems = Math.max(...weeklyData.map(d => d.items.length), 1);

    const headerHtml = `
        <tr>
            <th style="width:44px"></th>
            ${weeklyData.map(day => `
                <th class="lunch-table-header-cell">
                    <strong>${day.day}</strong><br>
                    <span style="font-size:0.72rem;color:var(--text-muted)">${day.displayDate}</span>
                </th>`).join('')}
        </tr>`;

    const menuRows = Array.from({ length: maxItems }).map((_, idx) => {
        const cells = weeklyData.map(day => {
            const item = day.items[idx] || '';
            return `<td class="lunch-table-item-cell">${item ? cleanMenuItem(item) : '<span style="color:var(--text-muted)">-</span>'}</td>`;
        }).join('');
        return `<tr><td class="lunch-table-num">${idx + 1}</td>${cells}</tr>`;
    }).join('');

    const kcalRow = `
        <tr class="lunch-table-kcal-row">
            <td class="lunch-table-num">🔥</td>
            ${weeklyData.map(day => `
                <td class="lunch-table-item-cell">
                    ${day.kcal ? `<strong>${day.kcal} kcal</strong>` : '<span style="color:var(--text-muted)">-</span>'}
                </td>`).join('')}
        </tr>`;

    const todayStr = _lunchTodayStr();
    const todayIdx = weekOffset === 0 ? weeklyData.findIndex(d => d.date === todayStr) : -1;

    const mobileCards = weeklyData.map((day, dayIdx) => {
        const isToday = dayIdx === todayIdx;
        const todayAttr = isToday ? ' data-today="true"' : '';
        const todayStyle = isToday ? ' style="border-top:3px solid var(--primary);"' : '';
        const todayBadge = isToday
            ? `<span style="font-size:0.65rem;font-weight:700;color:#fff!important;-webkit-text-fill-color:#fff!important;background:var(--primary);padding:2px 8px;border-radius:999px;margin-left:8px;vertical-align:middle">오늘</span>`
            : '';
        const menuHtml = day.items.length > 0
            ? day.items.map(item => `<div class="lunch-mobile-item">${cleanMenuItem(item)}</div>`).join('')
            : `<span style="font-size:0.85rem;color:var(--text-muted)">급식 정보 없음</span>`;
        const kcalHtml = day.kcal
            ? `<div style="margin-top:12px;font-size:0.82rem;font-weight:700;color:var(--text-muted)">🔥 ${day.kcal} kcal</div>`
            : '';
        return `<div class="lunch-mobile-day"${todayStyle}${todayAttr}>
            <h3 style="margin:0 0 14px;font-size:1rem;font-weight:700">${day.day}요일${todayBadge} <span style="font-size:0.82rem;font-weight:400;color:var(--text-muted)">${day.displayDate}</span></h3>
            <div>${menuHtml}</div>
            ${kcalHtml}
        </div>`;
    }).join('');

    const dayDots = weeklyData.map((day, i) =>
        `<span class="lunch-day-dot${i === todayIdx ? ' lunch-day-dot-active' : ''}">${day.day}</span>`
    ).join('');

    card.innerHTML = `
        <div class="lunch-table-wrapper" id="lunchTableWrapper">
            <table class="lunch-table-horizontal">
                <thead>${headerHtml}</thead>
                <tbody>${menuRows}${kcalRow}</tbody>
            </table>
        </div>
        <div class="lunch-mobile-hint">← 좌우로 밀어서 요일 이동</div>
        <div class="lunch-mobile-scroll" id="lunchMobileScroll">${mobileCards}</div>
        <div class="lunch-day-dots" id="lunchDayDots">${dayDots}</div>`;

    const wrapper = document.getElementById('lunchTableWrapper');
    if (wrapper) {
        const updateFade = () => {
            const atEnd = wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 4;
            wrapper.classList.toggle('scrolled-end', atEnd);
        };
        wrapper.addEventListener('scroll', updateFade, { passive: true });
        updateFade();
    }

    if (window.innerWidth <= 768) {
        requestAnimationFrame(() => {
            const mobileScroll = card.querySelector('#lunchMobileScroll');
            const todayCard = mobileScroll && mobileScroll.querySelector('.lunch-mobile-day[data-today="true"]');
            if (mobileScroll && todayCard) {
                mobileScroll.scrollTo({ left: todayCard.offsetLeft - 16, behavior: 'instant' });
            }
            if (mobileScroll) {
                mobileScroll.addEventListener('scroll', () => {
                    const cards = Array.from(mobileScroll.querySelectorAll('.lunch-mobile-day'));
                    const dots = Array.from(document.querySelectorAll('.lunch-day-dot'));
                    const scrollMid = mobileScroll.scrollLeft + mobileScroll.clientWidth / 2;
                    let activeIdx = 0;
                    cards.forEach((c, i) => { if (c.offsetLeft <= scrollMid) activeIdx = i; });
                    dots.forEach((dot, i) => dot.classList.toggle('lunch-day-dot-active', i === activeIdx));
                }, { passive: true });
            }
        });
    }
}

// 급식 저장
async function downloadLunch() {
    const table = document.querySelector('.lunch-table-horizontal');
    if (!table) {
        showToast('급식 표를 찾을 수 없습니다.', 'error');
        return;
    }

    try {
        // 원본 요소의 computed style 미리 수집 (CSS 변수 해석용)
        const originalEls = [table, ...table.querySelectorAll('*')];
        const computedStyles = originalEls.map(el => {
            const cs = window.getComputedStyle(el);
            return {
                color:           cs.color,
                backgroundColor: cs.backgroundColor,
                borderColor:     cs.borderColor,
                fontSize:        cs.fontSize,
                fontWeight:      cs.fontWeight,
                borderTopColor:  cs.borderTopColor,
                borderBottomColor: cs.borderBottomColor,
                borderLeftColor: cs.borderLeftColor,
                borderRightColor: cs.borderRightColor,
            };
        });

        const canvas = await html2canvas(table, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: (_doc, clonedTable) => {
                // CSS 변수가 해석된 실제 색상을 인라인으로 주입
                const clonedEls = [clonedTable, ...clonedTable.querySelectorAll('*')];
                clonedEls.forEach((el, i) => {
                    const s = computedStyles[i];
                    if (!s) return;
                    el.style.color           = s.color;
                    el.style.fontSize        = s.fontSize;
                    el.style.fontWeight      = s.fontWeight;
                    // 배경이 투명이면 흰색 유지, 아니면 원본 색 적용
                    if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        el.style.backgroundColor = s.backgroundColor;
                    } else {
                        el.style.backgroundColor = 'transparent';
                    }
                    el.style.borderTopColor    = s.borderTopColor;
                    el.style.borderBottomColor = s.borderBottomColor;
                    el.style.borderLeftColor   = s.borderLeftColor;
                    el.style.borderRightColor  = s.borderRightColor;
                });
            }
        });

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        const today = new Date().toISOString().split('T')[0];
        link.download = `급식_${today}.png`;
        link.click();
    } catch (err) {
        console.error('급식 저장 실패:', err);
        showToast('급식 저장에 실패했습니다.', 'error');
    }
}

// =============================================
// 빠른 자동 스크롤 (선택적)
// =============================================
function enableAutoScrollLunchTable() {
    const wrapper = document.querySelector('.lunch-table-wrapper');
    if (!wrapper) return;

    // 터치 기기(모바일)에서는 자동 스크롤 비활성화 — 터치 모멘텀을 방해함
    const isTouchDevice = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) return;

    let scrollSpeed = 1.5;
    let scrollTimer = null;
    let isPaused = false;
    let resumeTimer = null;

    const autoScroll = () => {
        if (isPaused) return;
        if (wrapper.scrollLeft < wrapper.scrollWidth - wrapper.clientWidth) {
            wrapper.scrollLeft += scrollSpeed;
            scrollTimer = requestAnimationFrame(autoScroll);
        } else {
            setTimeout(() => {
                if (!isPaused) { wrapper.scrollLeft = 0; scrollTimer = requestAnimationFrame(autoScroll); }
            }, 3000);
        }
    };

    const pause = () => {
        isPaused = true;
        if (scrollTimer) cancelAnimationFrame(scrollTimer);
        scrollTimer = null;
        clearTimeout(resumeTimer);
    };

    const resume = () => {
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => {
            isPaused = false;
            scrollTimer = requestAnimationFrame(autoScroll);
        }, 3000);
    };

    wrapper.addEventListener('mouseenter', pause);
    wrapper.addEventListener('mouseleave', resume);
    wrapper.addEventListener('wheel', pause, { passive: true });

    setTimeout(() => { scrollTimer = requestAnimationFrame(autoScroll); }, 1500);
}

// loadLunchPage() 이후 호출
async function loadLunchPageWithAutoScroll() {
    _lunchWeekOffset = 0;
    await loadLunchPage(0);
    // 테이블 렌더링 후 자동 스크롤 활성화
    setTimeout(() => enableAutoScrollLunchTable(), 100);
}

// =============================================
// 초기 프리페치 (빠른 로딩)
// =============================================
