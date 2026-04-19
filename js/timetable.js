// =============================================
// 시간표
// =============================================
let _timetableWeekOffset = 0;
const _timetableCache = {}; // weekOffset -> timetable data

function _getWeekLabel(offset) {
    if (offset === 0) return '이번 주';
    if (offset === 1) return '다음 주';
    if (offset === -1) return '지난 주';
    return offset > 0 ? `${offset}주 후` : `${Math.abs(offset)}주 전`;
}

function _getWeekDates(weekOffset) {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    const dow = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - dow + (dow === 0 ? -6 : 1));
    const p = n => String(n).padStart(2, '0');
    return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return `${d.getMonth() + 1}/${p(d.getDate())}`;
    });
}

function _buildTimetableHtml(data, weekOffset) {
    const isThisWeek = weekOffset === 0;
    const dow = new Date().getDay();
    const todayIdx = isThisWeek ? (dow - 1) : -1;
    const weekDates = _getWeekDates(weekOffset);

    // ── 오늘 수업 가로 카드 바 (이번 주만) ──
    let todayBarHtml = '';
    if (isThisWeek) {
        if (todayIdx >= 0 && todayIdx <= 4) {
            const todayChips = data.periods.map((p, pi) => {
                const c = data.schedule[pi][todayIdx];
                if (!c || !c.s) return '';
                const color = SUBJ_COLORS[c.s] || '#64748b';
                return `<div class="tt-today-chip" style="background:${color}">
                    <span class="period-num">${p.num}교시 ${p.time}</span>
                    <span style="font-size:1rem;font-weight:800;color:#fff">${c.s}</span>
                    <span style="font-size:0.7rem;color:rgba(255,255,255,0.75)">${c.t}</span>
                </div>`;
            }).filter(Boolean).join('');
            const dayLabel = data.days[todayIdx] + '요일';
            todayBarHtml = `
            <div style="background:linear-gradient(135deg,var(--primary) 0%,var(--cyan) 100%);border-radius:var(--radius);padding:20px 24px;margin-bottom:20px;box-shadow:var(--shadow)">
                <div style="font-size:0.78rem;font-weight:700;color:rgba(255,255,255,0.8);letter-spacing:0.06em;text-transform:uppercase;margin-bottom:12px">📅 오늘 (${dayLabel}) 수업</div>
                <div class="tt-today-bar">
                    ${todayChips || '<span style="color:rgba(255,255,255,0.7);font-size:0.88rem">오늘은 수업이 없거나 주말입니다.</span>'}
                </div>
            </div>`;
        } else {
            todayBarHtml = `
            <div style="background:linear-gradient(135deg,var(--primary) 0%,var(--cyan) 100%);border-radius:var(--radius);padding:20px 24px;margin-bottom:20px;box-shadow:var(--shadow)">
                <div style="font-size:0.88rem;font-weight:600;color:rgba(255,255,255,0.85)">📅 오늘은 주말이에요! 편히 쉬세요 🎉</div>
            </div>`;
        }
    }

    const rows = data.periods.map((p, pi) => {
        const cells = data.days.map((d, di) => {
            const c = data.schedule[pi][di];
            const isToday = di === todayIdx;
            const cls = isToday ? ' class="today-col"' : '';
            if (!c || !c.s) return `<td${cls}><span style="color:var(--text-muted);font-size:1.1rem;line-height:2.5rem">—</span></td>`;
            const color = SUBJ_COLORS[c.s] || '#64748b';
            return `<td${cls}><span class="subject-chip" style="background:${color}">${c.s}</span><span class="teacher">${c.t}</span></td>`;
        }).join('');
        return `<tr><td class="period-cell">${p.num}교시<br><small>${p.time}</small></td>${cells}</tr>`;
    }).join('');

    const headers = data.days.map((d, i) =>
        `<th${i === todayIdx ? ' class="today-col"' : ''}>${d}요일<br><small style="font-size:0.72rem;font-weight:500;opacity:0.7">${weekDates[i]}</small></th>`
    ).join('');

    const mobileCards = data.days.map((day, dayIdx) => {
        const isToday = dayIdx === todayIdx;
        const todayAttr = isToday ? ' data-today="true"' : '';
        const todayStyle = isToday
            ? ' style="border-top: 3px solid var(--primary);"'
            : '';
        const todayBadge = isToday
            ? `<span style="font-size:0.65rem;font-weight:700;color:white;background:var(--primary);padding:2px 8px;border-radius:999px;margin-left:8px;vertical-align:middle">오늘</span>`
            : '';
        const cards = data.periods.map((p, pi) => {
            const c = data.schedule[pi][dayIdx];
            if (!c || !c.s) return '';
            const color = SUBJ_COLORS[c.s] || '#64748b';
            return `<div class="tt-mobile-card" style="border-left: 3px solid ${color}">
                <div style="font-size:0.72rem;color:var(--text-muted);font-weight:600;margin-bottom:4px">${p.num}교시 · ${p.time}</div>
                <div style="font-size:1rem;font-weight:700;color:${color}">${c.s}</div>
                ${c.t ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">${c.t}</div>` : ''}
            </div>`;
        }).filter(Boolean).join('');
        return `<div class="tt-mobile-day"${todayStyle}${todayAttr}>
            <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700">${day}요일${todayBadge} <span style="font-size:0.82rem;font-weight:400;color:var(--text-muted)">${weekDates[dayIdx]}</span></h3>
            <div style="display:flex;flex-direction:column;gap:8px">${cards || '<span style="font-size:0.85rem;color:var(--text-muted)">수업 없음</span>'}</div>
        </div>`;
    }).join('');

    const dayDots = data.days.map((d, i) =>
        `<span class="tt-day-dot${i === todayIdx ? ' tt-day-dot-active' : ''}">${d}</span>`
    ).join('');

    return `
    ${todayBarHtml}
    <div class="card card-body">
        <div class="timetable-container">
            <table class="timetable">
                <thead><tr><th>교시</th>${headers}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        <div class="tt-mobile-hint">← 좌우로 밀어서 요일 이동</div>
        <div class="timetable-mobile" id="ttMobileScroll">${mobileCards}</div>
        <div class="tt-day-dots" id="ttDayDots">${dayDots}</div>
    </div>`;
}

function renderTimetable() {
    return `
    <div class="page">
        <div class="page-header">
            <h2>📅 1학년 2반 시간표</h2>
            <button class="btn btn-primary" onclick="downloadTimetable()" style="margin-top:12px">📥 시간표 저장</button>
        </div>
        <div class="week-nav">
            <button class="week-nav-btn" onclick="changeTimetableWeek(-1)">◀ 이전 주</button>
            <span class="week-nav-label" id="timetableWeekLabel">이번 주</span>
            <button class="week-nav-btn" onclick="changeTimetableWeek(1)">다음 주 ▶</button>
        </div>
        <div id="timetableContent">
            <div class="lunch-loading" style="padding:40px 0">
                <span class="lunch-spinner"></span>
                <span>시간표 불러오는 중...</span>
            </div>
        </div>
    </div>`;
}

async function loadTimetableForWeek(weekOffset = 0) {
    const content = document.getElementById('timetableContent');
    if (!content) return;

    content.innerHTML = `<div class="lunch-loading" style="padding:40px 0"><span class="lunch-spinner"></span><span>시간표 불러오는 중...</span></div>`;

    let data;
    if (_timetableCache[weekOffset]) {
        data = _timetableCache[weekOffset];
    } else if (weekOffset === 0) {
        data = TIMETABLE;
        _timetableCache[0] = data;
    } else {
        try {
            const neisRaw = await fetchNeisTimeTableData(weekOffset);
            if (Object.keys(neisRaw).length > 0) {
                data = parseNeisDataToTimetable(neisRaw) || TIMETABLE;
            } else {
                data = null;
            }
            if (data) _timetableCache[weekOffset] = data;
        } catch (e) {
            data = null;
        }
    }

    if (!data) {
        content.innerHTML = `
            <div class="lunch-empty" style="padding:48px 24px;text-align:center">
                <div style="font-size:3rem;margin-bottom:16px">📭</div>
                <p style="font-weight:600;font-size:1rem">시간표 정보를 불러올 수 없습니다.</p>
                <p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px">방학 중이거나 아직 공개되지 않은 일정입니다.</p>
            </div>`;
        return;
    }

    content.innerHTML = _buildTimetableHtml(data, weekOffset);

    // 모바일: 오늘 요일 카드로 자동 스크롤 + dots 연동
    if (window.innerWidth <= 768) {
        requestAnimationFrame(() => {
            const mobile = content.querySelector('#ttMobileScroll');
            const todayCard = mobile && mobile.querySelector('.tt-mobile-day[data-today="true"]');
            if (mobile && todayCard) {
                mobile.scrollTo({ left: todayCard.offsetLeft - 20, behavior: 'instant' });
            }

            // 스크롤 시 dots 활성화 업데이트
            if (mobile) {
                mobile.addEventListener('scroll', () => {
                    const cards = Array.from(mobile.querySelectorAll('.tt-mobile-day'));
                    const dots = Array.from(document.querySelectorAll('.tt-day-dot'));
                    const scrollMid = mobile.scrollLeft + mobile.clientWidth / 2;
                    let activeIdx = 0;
                    cards.forEach((card, i) => {
                        if (card.offsetLeft <= scrollMid) activeIdx = i;
                    });
                    dots.forEach((dot, i) => dot.classList.toggle('tt-day-dot-active', i === activeIdx));
                }, { passive: true });
            }
        });
    }
}

async function changeTimetableWeek(delta) {
    _timetableWeekOffset += delta;
    const label = document.getElementById('timetableWeekLabel');
    if (label) label.textContent = _getWeekLabel(_timetableWeekOffset);
    await loadTimetableForWeek(_timetableWeekOffset);
}

// 시간표 저장 (이미지)
async function downloadTimetable() {
    const table = document.querySelector('.timetable');
    if (!table) {
        showToast('시간표를 찾을 수 없습니다.', 'error');
        return;
    }

    try {
        const canvas = await html2canvas(table, {
            scale: 2,
            backgroundColor: '#ffffff',
            padding: 10,
            logging: false
        });

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `시간표_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
    } catch (err) {
        console.error('시간표 저장 실패:', err);
        showToast('시간표 저장에 실패했습니다.', 'error');
    }
}
