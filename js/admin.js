// =============================================
// 관리자 시스템
// =============================================

let _adminOrbClicks = 0;
let _adminOrbTimer = null;

function adminOrbClick() {
    openAdminLogin();
}

function openAdminLogin() {
    document.getElementById('modalTitle').textContent = '🔐 관리자 로그인';
    document.getElementById('modalBody').innerHTML = '<div style="padding:20px"><p style="margin-bottom:15px;color:var(--text-muted);text-align:center">관리자 비밀번호를 입력하세요</p><input type="password" id="adminPassword" placeholder="비밀번호" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;margin-bottom:15px;font-size:1rem;box-sizing:border-box" onkeydown="if(event.key===\'Enter\')checkAdminPassword(this.value)"><div style="display:flex;gap:10px;justify-content:flex-end"><button onclick="closeModal()" style="padding:8px 16px;background:var(--border);border:none;border-radius:6px;cursor:pointer">취소</button><button onclick="checkAdminPassword(document.getElementById(\'adminPassword\').value)" style="padding:8px 16px;background:var(--primary);color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold">로그인</button></div></div>';
    document.getElementById('modalOverlay').classList.add('active');
    setTimeout(() => document.getElementById('adminPassword')?.focus(), 50);
}

function checkAdminPassword(pw) {
    if (pw === '1234') {
        localStorage.setItem('adminAuth', 'true');
        closeModal();
        navigate('admin');
    } else {
        const input = document.getElementById('adminPassword');
        input.style.border = '2px solid #ef4444';
        input.value = '';
        input.placeholder = '비밀번호가 틀렸습니다';
        input.focus();
        setTimeout(() => { input.style.border = '1px solid var(--border)'; input.placeholder = '비밀번호'; }, 1500);
    }
}

function adminLogout() {
    if (confirm('로그아웃하시겠습니까?')) {
        localStorage.removeItem('adminAuth');
        navigate('home');
    }
}

function renderAdmin() {
    const tab = localStorage.getItem('adminTab') || 'system';
    let subTab = localStorage.getItem('adminSubTab') || '';
    let content = '';

    const tabDefs = [
        { id:'system',      label:'🚨 시스템 설정',      subtabs:['notice','maintenance'] },
        { id:'logs',        label:'📊 로그 관리',       subtabs:['logs','logsearch','session'] },
        { id:'data',        label:'🍱 데이터 관리',      subtabs:['data','timetable','backup'] },
        { id:'access',      label:'🛡️ 접근 제어',       subtabs:['access','settings'] },
        { id:'stats',       label:'📈 통계 대시보드',     subtabs:[] },
    ];

    const subTabLabels = {
        'notice': '긴급 공지',
        'maintenance': '점검 모드',
        'logs': '접속 로그',
        'logsearch': '로그 검색',
        'session': '사용자 세션',
        'data': '급식/학사일정',
        'timetable': '시간표 편집',
        'backup': '백업/복구',
        'access': '접근 제어',
        'settings': '사이트 설정',
    };

    const tabBar = tabDefs.map(t => `
        <button onclick="localStorage.setItem('adminTab','${t.id}');${t.subtabs.length>0?`localStorage.setItem('adminSubTab','${t.subtabs[0]}');`:''} render()"
            style="padding:10px 18px;background:${tab===t.id?'var(--primary)':'var(--card)'};color:${tab===t.id?'white':'var(--text)'};border:${tab===t.id?'none':'1px solid var(--border)'};border-radius:8px;cursor:pointer;font-weight:${tab===t.id?'bold':'normal'};transition:all 0.15s;white-space:nowrap">
            ${t.label}
        </button>`).join('');

    let subTabBar = '';
    const currentTabDef = tabDefs.find(t => t.id === tab);
    if (currentTabDef && currentTabDef.subtabs.length > 0) {
        const effectiveSubTab = subTab && currentTabDef.subtabs.includes(subTab) ? subTab : currentTabDef.subtabs[0];
        subTabBar = `<div style="display:flex;gap:8px;margin-bottom:16px;border-bottom:2px solid var(--border);padding-bottom:8px">
            ${currentTabDef.subtabs.map(st => `
                <button onclick="localStorage.setItem('adminSubTab','${st}');render()"
                    style="padding:8px 14px;background:${effectiveSubTab===st?'var(--primary)':'transparent'};color:${effectiveSubTab===st?'white':'var(--text)'};border:none;border-radius:6px;cursor:pointer;font-size:0.9rem;font-weight:${effectiveSubTab===st?'bold':'normal'};transition:all 0.15s">
                    ${subTabLabels[st]}
                </button>
            `).join('')}
        </div>`;
        subTab = effectiveSubTab;
    } else {
        subTab = '';
    }

    // ── 긴급 공지 ──
    if (tab === 'system' && subTab === 'notice') {
        let en = { active: false, title: '', message: '', color: '#ef4444' };
        try { const r = localStorage.getItem('emergency_notice'); if(r) en = JSON.parse(r); } catch(e){}

        content = `
        <div style="background:var(--card);border-radius:12px;padding:24px;border:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                    <input type="checkbox" id="enActive" ${en.active?'checked':''} style="width:18px;height:18px;cursor:pointer">
                    <span style="font-weight:bold">배너 활성화</span>
                </label>
                <span style="font-size:0.85rem;color:var(--text-muted)">(활성화 시 모든 페이지 상단에 표시)</span>
            </div>
            <div style="display:grid;gap:12px">
                <div>
                    <label style="display:block;font-size:0.85rem;color:var(--text-muted);margin-bottom:6px">제목</label>
                    <input type="text" id="enTitle" placeholder="예: 긴급 공지" value="${escapeHtml(en.title)}"
                        style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;box-sizing:border-box;font-size:0.95rem">
                </div>
                <div>
                    <label style="display:block;font-size:0.85rem;color:var(--text-muted);margin-bottom:6px">내용</label>
                    <textarea id="enMessage" placeholder="공지 내용을 입력하세요"
                        style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;min-height:90px;box-sizing:border-box;font-family:inherit;font-size:0.95rem;resize:vertical">${escapeHtml(en.message)}</textarea>
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                    <label style="font-size:0.85rem;color:var(--text-muted)">배너 색상:</label>
                    <input type="color" id="enColor" value="${en.color}"
                        style="width:48px;height:36px;border:1px solid var(--border);border-radius:6px;cursor:pointer;padding:2px">
                </div>
            </div>
            <button onclick="saveEmergencyNotice()"
                style="margin-top:20px;padding:12px;width:100%;background:var(--primary);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:0.95rem">
                💾 저장하기
            </button>
        </div>`;

    // ── 시간표 편집 ──
    } else if (tab === 'data' && subTab === 'timetable') {
        const tt = TIMETABLE;
        let rows = '';
        tt.periods?.forEach((period, periIdx) => {
            let cells = `<td style="padding:8px 12px;text-align:center;font-weight:bold;white-space:nowrap;background:var(--bg);color:var(--text-muted)">${period.num}교시<br><small>${period.time}</small></td>`;
            tt.days?.forEach((day, dayIdx) => {
                const subj = tt.schedule?.[periIdx]?.[dayIdx];
                cells += `<td style="padding:6px"><input type="text" placeholder="" value="${escapeHtml(subj?.s||'')}" id="tt_${periIdx}_${dayIdx}_s"
                    style="width:62px;padding:6px 4px;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;text-align:center;box-sizing:border-box"></td>`;
            });
            rows += `<tr style="border-bottom:1px solid var(--border)">${cells}</tr>`;
        });

        const headCells = `<th style="padding:8px 12px;text-align:center;font-size:0.85rem;color:var(--text-muted)">교시</th>`
            + tt.days?.map(d => `<th style="padding:8px 12px;text-align:center;font-weight:bold">${d}</th>`).join('');

        content = `
        <div style="background:var(--card);border-radius:12px;padding:24px;border:1px solid var(--border)">
            <div style="overflow-x:auto">
                <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
                    <thead><tr style="border-bottom:2px solid var(--border)">${headCells}</tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <button onclick="saveTimetableEdit()"
                style="margin-top:20px;padding:12px;width:100%;background:var(--primary);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:0.95rem">
                💾 저장하기
            </button>
        </div>`;

    // ── 접속 로그 ──
    } else if (tab === 'logs' && subTab === 'logs') {
        const logs = DB.get('access_logs', []);
        const recent = logs.slice(-100).reverse();

        const deviceIcon = d => d==='모바일'?'📱':d==='태블릿'?'📟':'🖥️';

        content = `
        <div style="background:var(--card);border-radius:12px;padding:24px;border:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <span style="font-weight:bold">최근 ${recent.length}개 접속 기록</span>
                <button onclick="clearLogs()" style="padding:6px 12px;background:#ef444420;color:#ef4444;border:1px solid #ef444440;border-radius:6px;cursor:pointer;font-size:0.85rem">전체 삭제</button>
            </div>
            ${recent.length === 0 ? '<p style="color:var(--text-muted);text-align:center;padding:40px 0">접속 로그가 없습니다</p>' : `
            <div style="overflow-x:auto;max-height:500px;overflow-y:auto">
                <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
                    <thead style="position:sticky;top:0;background:var(--card)">
                        <tr style="border-bottom:2px solid var(--border)">
                            <th style="padding:8px;text-align:left">시간</th>
                            <th style="padding:8px;text-align:center">기기</th>
                            <th style="padding:8px;text-align:left">IP</th>
                            <th style="padding:8px;text-align:left">페이지</th>
                            <th style="padding:8px;text-align:left">화면</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recent.map(log => `
                        <tr style="border-bottom:1px solid var(--border)">
                            <td style="padding:8px;white-space:nowrap">${new Date(log.time).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
                            <td style="padding:8px;text-align:center" title="${log.device||'PC'}">${deviceIcon(log.device||'PC')}</td>
                            <td style="padding:8px;font-family:monospace">${escapeHtml(log.ip||'')}</td>
                            <td style="padding:8px">${escapeHtml(log.page||'')}</td>
                            <td style="padding:8px;color:var(--text-muted)">${log.screen||''}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>`}
        </div>`;

    // ── 통계 대시보드 ──
    } else if (tab === 'stats') {
        const logs = DB.get('access_logs', []);
        const today = new Date().toDateString();
        const deviceCounts = { '모바일': 0, '태블릿': 0, 'PC': 0 };
        const pageMap = {};
        const hourMap = {};
        const dayMap = {};

        logs.forEach(log => {
            deviceCounts[log.device || 'PC']++;
            pageMap[log.page] = (pageMap[log.page] || 0) + 1;
            const d = new Date(log.time);
            const hour = String(d.getHours()).padStart(2, '0');
            hourMap[hour] = (hourMap[hour] || 0) + 1;
            const dayKey = d.toLocaleDateString('ko-KR', {month:'short', day:'numeric'});
            dayMap[dayKey] = (dayMap[dayKey] || 0) + 1;
        });

        const topPages = Object.entries(pageMap).sort((a,b) => b[1]-a[1]).slice(0,5);
        const todayCount = logs.filter(l => new Date(l.time).toDateString() === today).length;

        content = `
        <div style="background:var(--card);border-radius:12px;padding:24px;border:1px solid var(--border)">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px">
                <div style="padding:16px;background:var(--bg);border-radius:8px;text-align:center">
                    <div style="font-size:2rem;font-weight:bold;color:var(--primary)">${logs.length}</div>
                    <div style="font-size:0.85rem;color:var(--text-muted)">총 접속 수</div>
                </div>
                <div style="padding:16px;background:var(--bg);border-radius:8px;text-align:center">
                    <div style="font-size:2rem;font-weight:bold;color:#22c55e">${todayCount}</div>
                    <div style="font-size:0.85rem;color:var(--text-muted)">오늘 접속 수</div>
                </div>
                <div style="padding:16px;background:var(--bg);border-radius:8px;text-align:center">
                    <div style="font-size:2rem;font-weight:bold;color:#3b82f6">${Object.keys(pageMap).length}</div>
                    <div style="font-size:0.85rem;color:var(--text-muted)">방문 페이지</div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
                <div style="padding:16px;background:var(--bg);border-radius:8px">
                    <div style="font-weight:bold;margin-bottom:12px;font-size:0.95rem">기기별 분포</div>
                    ${Object.entries(deviceCounts).map(([d,c]) => {
                        const pct = logs.length > 0 ? Math.round(c/logs.length*100) : 0;
                        return `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:0.85rem"><span>${d}</span><span>${c}회 (${pct}%)</span></div>`;
                    }).join('')}
                </div>
                <div style="padding:16px;background:var(--bg);border-radius:8px">
                    <div style="font-weight:bold;margin-bottom:12px;font-size:0.95rem">상위 페이지</div>
                    ${topPages.map(([p,c]) => `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:0.85rem"><span>${p}</span><span>${c}회</span></div>`).join('')}
                </div>
            </div>

            <div style="padding:16px;background:var(--bg);border-radius:8px;margin-bottom:16px">
                <div style="font-weight:bold;margin-bottom:12px;font-size:0.95rem">시간대별 트래픽</div>
                <div style="display:grid;grid-template-columns:repeat(24,1fr);gap:2px;font-size:0.6rem;margin-bottom:4px">
                    ${Array.from({length:24}).map((_, h) => `<div style="text-align:center;color:var(--text-muted);height:20px;display:flex;align-items:flex-end;justify-content:center">${String(h).padStart(2,'0')}</div>`).join('')}
                </div>
                <div style="display:grid;grid-template-columns:repeat(24,1fr);gap:2px;font-size:0.7rem">
                    ${Array.from({length:24}).map((_, h) => {
                        const hStr = String(h).padStart(2,'0');
                        const cnt = hourMap[hStr] || 0;
                        const max = Math.max(...Object.values(hourMap), 1);
                        const height = cnt > 0 ? Math.round(cnt/max*100) : 5;
                        return `<div style="text-align:center;border-bottom:${height}px solid var(--primary)" title="${hStr}시: ${cnt}건"></div>`;
                    }).join('')}
                </div>
            </div>
        </div>`;

    // ── 로그 검색 ──
    } else if (tab === 'logs' && subTab === 'logsearch') {
        const logs = DB.get('access_logs', []);
        const filterIP = document.getElementById('filterIP')?.value || '';
        const filterPage = document.getElementById('filterPage')?.value || '';
        const filterDays = parseInt(document.getElementById('filterDays')?.value || 7);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filterDays);

        const filtered = logs.filter(log => {
            const logDate = new Date(log.time);
            if (logDate < cutoffDate) return false;
            if (filterIP && !log.ip?.includes(filterIP)) return false;
            if (filterPage && !log.page?.includes(filterPage)) return false;
            return true;
        }).reverse().slice(0, 200);

        content = `
        <div style="background:var(--card);border-radius:12px;padding:24px;border:1px solid var(--border)">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 100px;gap:12px;margin-bottom:20px">
                <input type="text" id="filterIP" placeholder="IP 검색 (예: 123.45)" style="padding:10px;border:1px solid var(--border);border-radius:6px;font-size:0.9rem">
                <input type="text" id="filterPage" placeholder="페이지 검색" style="padding:10px;border:1px solid var(--border);border-radius:6px;font-size:0.9rem">
                <select id="filterDays" style="padding:10px;border:1px solid var(--border);border-radius:6px;font-size:0.9rem">
                    <option value="1">지난 1일</option>
                    <option value="7" selected>지난 7일</option>
                    <option value="30">지난 30일</option>
                    <option value="90">지난 90일</option>
                </select>
                <button onclick="render()" style="padding:10px;background:var(--primary);color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold">검색</button>
            </div>
            <div style="overflow-x:auto;max-height:600px;overflow-y:auto">
                <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
                    <thead style="position:sticky;top:0;background:var(--card)">
                        <tr style="border-bottom:2px solid var(--border)">
                            <th style="padding:8px;text-align:left">시간</th>
                            <th style="padding:8px;text-align:center">기기</th>
                            <th style="padding:8px;text-align:left">IP</th>
                            <th style="padding:8px;text-align:left">페이지</th>
                            <th style="padding:8px;text-align:left">화면</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? '<tr><td colspan="5" style="padding:40px;text-align:center;color:var(--text-muted)">검색 결과 없음</td></tr>' :
                        filtered.map(log => {
                            const deviceIcon = log.device === '모바일' ? '📱' : log.device === '태블릿' ? '📟' : '🖥️';
                            return `
                            <tr style="border-bottom:1px solid var(--border)">
                                <td style="padding:8px;white-space:nowrap">${new Date(log.time).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
                                <td style="padding:8px;text-align:center">${deviceIcon}</td>
                                <td style="padding:8px;font-family:monospace">${escapeHtml(log.ip||'')}</td>
                                <td style="padding:8px">${escapeHtml(log.page||'')}</td>
                                <td style="padding:8px;color:var(--text-muted);font-size:0.8rem">${log.screen||''}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top:12px;text-align:right;font-size:0.85rem;color:var(--text-muted)">검색 결과: ${filtered.length}개</div>
        </div>`;

    // ── 사용자 세션 ──
    } else if (tab === 'logs' && subTab === 'session') {
        const logs = DB.get('access_logs', []);
        const sessionMap = new Map();

        logs.slice(-50).forEach(log => {
            const ip = log.ip || 'unknown';
            if (!sessionMap.has(ip)) {
                sessionMap.set(ip, {ip, device: log.device, page: log.page, time: log.time, screen: log.screen});
            } else {
                const prev = sessionMap.get(ip);
                if (new Date(log.time) > new Date(prev.time)) {
                    sessionMap.set(ip, {ip, device: log.device, page: log.page, time: log.time, screen: log.screen});
                }
            }
        });

        const sessions = Array.from(sessionMap.values())
            .sort((a,b) => new Date(b.time) - new Date(a.time));

        content = `
        <div style="background:var(--card);border-radius:12px;padding:24px;border:1px solid var(--border)">
            <div style="display:grid;gap:12px">
                ${sessions.length === 0 ? '<p style="color:var(--text-muted);text-align:center;padding:40px 0">활동 중인 세션 없음</p>' :
                sessions.map(sess => {
                    const deviceIcon = sess.device === '모바일' ? '📱' : sess.device === '태블릿' ? '📟' : '🖥️';
                    const lastActive = new Date(sess.time);
                    const now = new Date();
                    const diffMin = Math.floor((now - lastActive) / 60000);
                    const timeStr = diffMin < 1 ? '방금' : diffMin < 60 ? `${diffMin}분 전` : `${Math.floor(diffMin/60)}시간 전`;
                    return `
                    <div style="padding:16px;background:var(--bg);border-radius:8px;border-left:4px solid var(--primary)">
                        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
                            <div style="font-weight:bold;font-size:1rem">${deviceIcon} ${sess.device}</div>
                            <div style="color:var(--text-muted);font-size:0.85rem">${timeStr}</div>
                        </div>
                        <div style="display:grid;gap:4px;font-size:0.85rem">
                            <div><span style="color:var(--text-muted)">IP:</span> <code style="font-weight:bold">${escapeHtml(sess.ip)}</code></div>
                            <div><span style="color:var(--text-muted)">페이지:</span> ${escapeHtml(sess.page)}</div>
                            <div><span style="color:var(--text-muted)">화면:</span> ${sess.screen}</div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>`;

    // ── 사이트 설정 ──
    } else if (tab === 'access' && subTab === 'settings') {
        const settings = DB.get('site_settings', {pushNotify: true, defaultTheme: 'dark', maintenanceMsg: ''});

        content = `
        <div style="background:var(--card);border-radius:12px;padding:24px;border:1px solid var(--border)">
            <div style="display:grid;gap:20px">
                <div style="padding:16px;background:var(--bg);border-radius:8px">
                    <label style="display:flex;align-items:center;gap:12px;cursor:pointer">
                        <input type="checkbox" id="pushNotify" ${settings.pushNotify?'checked':''} style="width:20px;height:20px;cursor:pointer">
                        <div>
                            <div style="font-weight:bold">🔔 푸시 알림</div>
                            <div style="font-size:0.85rem;color:var(--text-muted)">사이트 공지와 업데이트 알림 받기</div>
                        </div>
                    </label>
                </div>

                <div style="padding:16px;background:var(--bg);border-radius:8px">
                    <label style="display:block;margin-bottom:8px;font-weight:bold">🌙 기본 테마</label>
                    <select id="defaultTheme" style="padding:10px;border:1px solid var(--border);border-radius:6px;width:100%;font-size:0.9rem;box-sizing:border-box">
                        <option value="dark" ${settings.defaultTheme==='dark'?'selected':''}>다크 모드</option>
                        <option value="light" ${settings.defaultTheme==='light'?'selected':''}>라이트 모드</option>
                        <option value="auto" ${settings.defaultTheme==='auto'?'selected':''}>시스템 설정 따르기</option>
                    </select>
                </div>

                <div style="padding:16px;background:var(--bg);border-radius:8px">
                    <label style="display:block;margin-bottom:8px;font-weight:bold">🌐 공개 범위</label>
                    <div style="display:flex;gap:12px">
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.9rem">
                            <input type="radio" name="public" value="public" ${!settings.private?'checked':''} style="cursor:pointer">
                            공개
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.9rem">
                            <input type="radio" name="public" value="private" ${settings.private?'checked':''} style="cursor:pointer">
                            비공개 (1반만)
                        </label>
                    </div>
                </div>

                <div style="padding:16px;background:var(--bg);border-radius:8px">
                    <label style="display:block;margin-bottom:8px;font-weight:bold">📌 하단 안내 문구</label>
                    <textarea id="footerText" placeholder="푸터에 표시할 추가 문구" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;min-height:60px;font-size:0.9rem;box-sizing:border-box;resize:vertical">${escapeHtml(settings.footerText||'')}</textarea>
                </div>

                <button onclick="saveSiteSettings()" style="padding:12px;background:var(--primary);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:0.95rem">💾 저장하기</button>
            </div>
        </div>`;

    // ── 데이터 관리 (급식/학사일정) ──
    } else if (tab === 'data' && subTab === 'data') {
        const lunchOverride = DB.get('lunch_override', {});
        const calendarOverride = DB.get('calendar_override', {});

        content = `
        <div style="background:var(--card);border-radius:12px;padding:24px;border:1px solid var(--border)">
            <h3 style="margin:0 0 16px;font-size:1.05rem">급식 편집</h3>
            <div style="margin-bottom:20px;padding:16px;background:var(--bg);border-radius:8px">
                <label style="display:block;font-size:0.85rem;color:var(--text-muted);margin-bottom:8px">날짜 선택</label>
                <input type="date" id="lunchDate" style="padding:8px;border:1px solid var(--border);border-radius:6px;margin-bottom:10px;font-size:0.9rem">
                <label style="display:block;font-size:0.85rem;color:var(--text-muted);margin-bottom:8px">메뉴 (줄바꿈으로 구분)</label>
                <textarea id="lunchMenu" placeholder="예: 밥(5.6)\n된장국(5)\n삼겹살구이(10.13.16)" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;min-height:100px;font-size:0.9rem;box-sizing:border-box;resize:vertical"></textarea>
                <div style="display:flex;gap:10px;margin-top:10px">
                    <button onclick="saveLunchEdit()" style="flex:1;padding:10px;background:var(--primary);color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold">💾 저장</button>
                    <button onclick="deleteLunchEdit()" style="flex:1;padding:10px;background:#ef444415;color:#ef4444;border:1px solid #ef444430;border-radius:6px;cursor:pointer;font-weight:bold">🗑️ 삭제</button>
                </div>
            </div>

            <h3 style="margin:20px 0 16px;font-size:1.05rem">📅 학사일정 편집</h3>
            <div style="padding:16px;background:var(--bg);border-radius:8px">
                <div style="margin-bottom:12px;display:grid;gap:8px;max-height:200px;overflow-y:auto;font-size:0.85rem">
                    ${Object.entries(calendarOverride).length === 0 ? '<p style="color:var(--text-muted)">추가된 항목 없음</p>' :
                    Object.entries(calendarOverride).map(([k,v]) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--card);border-radius:4px">
                        <span><strong>${k}</strong> ${v}</span>
                        <button onclick="deleteCalendarItem('${k}')" style="padding:4px 8px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.8rem">제거</button>
                    </div>
                    `).join('')}
                </div>
                <div style="display:grid;gap:8px">
                    <input type="date" id="calendarDate" style="padding:8px;border:1px solid var(--border);border-radius:6px;font-size:0.9rem">
                    <input type="text" id="calendarTitle" placeholder="제목 (예: 봄 현장학습)" style="padding:8px;border:1px solid var(--border);border-radius:6px;font-size:0.9rem">
                    <button onclick="addCalendarItem()" style="padding:10px;background:var(--primary);color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold">➕ 추가</button>
                </div>
            </div>
        </div>`;

    // ── 접근 제어 ──
    } else if (tab === 'access' && subTab === 'access') {
        const blockData = DB.get('ip_blocklist', {blocklist: [], allowlist: []});
        const blocklist = blockData.blocklist || [];

        content = `
        <div style="background:var(--card);border-radius:12px;padding:24px;border:1px solid var(--border)">
            <h3 style="margin:0 0 16px;font-size:1.05rem">차단 목록</h3>
            <div style="padding:16px;background:var(--bg);border-radius:8px;margin-bottom:20px">
                <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;max-height:200px;overflow-y:auto">
                    ${blocklist.length === 0 ? '<p style="color:var(--text-muted);text-align:center;padding:20px 0">차단된 IP 없음</p>' :
                    blocklist.map(ip => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--card);border-radius:6px;border-left:3px solid #ef4444">
                        <code style="font-size:0.9rem;font-weight:bold">${escapeHtml(ip)}</code>
                        <button onclick="removeBlockIP('${ip}')" style="padding:4px 12px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.85rem">제거</button>
                    </div>
                    `).join('')}
                </div>
                <div style="display:flex;gap:8px">
                    <input type="text" id="blockIP" placeholder="IP 주소 (예: 123.45.67.89)" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:6px;font-size:0.9rem">
                    <button onclick="addBlockIP()" style="padding:10px 16px;background:var(--primary);color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold">추가</button>
                </div>
            </div>
        </div>`;

    // ── 백업/복구 ──
    } else if (tab === 'data' && subTab === 'backup') {
        content = `
        <div style="background:var(--card);border-radius:12px;padding:24px;border:1px solid var(--border)">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div style="padding:20px;background:var(--bg);border-radius:8px;border:2px dashed var(--border);text-align:center">
                    <div style="font-size:1.5rem;margin-bottom:10px">📥</div>
                    <h3 style="margin:0 0 8px;font-size:0.95rem">데이터 백업</h3>
                    <p style="margin:0 0 16px;font-size:0.85rem;color:var(--text-muted)">현재 모든 데이터를 JSON으로 다운로드</p>
                    <button onclick="exportData()" style="padding:10px 20px;background:var(--primary);color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;width:100%">⬇️ 다운로드</button>
                </div>
                <div style="padding:20px;background:var(--bg);border-radius:8px;border:2px dashed var(--border);text-align:center">
                    <div style="font-size:1.5rem;margin-bottom:10px">📤</div>
                    <h3 style="margin:0 0 8px;font-size:0.95rem">데이터 복구</h3>
                    <p style="margin:0 0 16px;font-size:0.85rem;color:var(--text-muted)">백업 파일을 선택하여 복구</p>
                    <input type="file" id="backupFile" accept=".json" style="display:none" onchange="importData(event)">
                    <button onclick="document.getElementById('backupFile').click()" style="padding:10px 20px;background:var(--primary);color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;width:100%">⬆️ 파일 선택</button>
                </div>
            </div>
            <div style="margin-top:20px;padding:16px;background:#3b82f615;border:1px solid #3b82f630;border-radius:8px;font-size:0.85rem;color:#3b82f6">
                <strong>💡 팁:</strong> 정기적으로 백업을 생성하여 데이터 손실에 대비하세요.
            </div>
        </div>`;

    // ── 점검 모드 ──
    } else if (tab === 'system' && subTab === 'maintenance') {
        let mm = { active: false, message: '현재 시스템 점검 중입니다.\n잠시 후 이용해주세요.' };
        try { const r = localStorage.getItem('maintenance_mode'); if(r) mm = JSON.parse(r); } catch(e){}

        content = `
        <div style="background:var(--card);border-radius:12px;padding:24px;border:1px solid var(--border)">
            ${mm.active ? `<div style="background:#ef444420;border:1px solid #ef444440;border-radius:8px;padding:12px 16px;margin-bottom:20px;color:#ef4444;font-weight:bold;font-size:0.9rem">⚠️ 현재 점검 모드가 활성화되어 있습니다</div>` : ''}
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:20px;padding:14px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">
                <input type="checkbox" id="mmActive" ${mm.active?'checked':''} style="width:20px;height:20px;cursor:pointer">
                <div>
                    <div style="font-weight:bold">점검 모드 활성화</div>
                    <div style="font-size:0.82rem;color:var(--text-muted);margin-top:2px">활성화하면 관리자 외 모든 사용자에게 점검 화면이 표시됩니다</div>
                </div>
            </label>
            <div>
                <label style="display:block;font-size:0.85rem;color:var(--text-muted);margin-bottom:6px">점검 안내 메시지</label>
                <textarea id="mmMessage" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;min-height:100px;box-sizing:border-box;font-family:inherit;font-size:0.95rem;resize:vertical">${escapeHtml(mm.message)}</textarea>
            </div>
            <button onclick="saveMaintenanceMode()"
                style="margin-top:20px;padding:12px;width:100%;background:${mm.active?'#ef4444':'var(--primary)'};color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:0.95rem">
                💾 저장하기
            </button>
        </div>`;
    }

    return `
    <div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
            <div>
                <h2 style="margin:0;font-size:1.4rem">⚙️ 관리자 패널</h2>
                <p style="margin:4px 0 0;color:var(--text-muted);font-size:0.85rem">사이트 관리 도구</p>
            </div>
            <button onclick="adminLogout()"
                style="padding:8px 16px;background:#ef444415;color:#ef4444;border:1px solid #ef444430;border-radius:8px;cursor:pointer;font-weight:bold;font-size:0.9rem">
                로그아웃
            </button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap">
            ${tabBar}
        </div>
        ${subTabBar}
        ${content}
    </div>`;
}

function saveEmergencyNotice() {
    const active = document.getElementById('enActive').checked;
    const title = document.getElementById('enTitle').value.trim();
    const message = document.getElementById('enMessage').value.trim();
    const color = document.getElementById('enColor').value;
    const data = { active, title, message, color };
    DB.set('emergency_notice', data);
    if (fbReady()) _fbDB.ref('data/emergency_notice').set(JSON.stringify(data));
    render();
}

function saveTimetableEdit() {
    const newSchedule = TIMETABLE.periods.map((p, periIdx) =>
        TIMETABLE.days.map((d, dayIdx) => {
            const s = document.getElementById(`tt_${periIdx}_${dayIdx}_s`)?.value || '';
            const orig = TIMETABLE.schedule?.[periIdx]?.[dayIdx];
            return { s, t: orig?.t || '' };
        })
    );
    TIMETABLE.schedule = newSchedule;
    if (fbReady()) {
        _fbDB.ref('config/timetable').set(TIMETABLE)
            .then(() => { alert('저장되었습니다'); render(); })
            .catch(e => { console.warn(e); alert('Firebase 저장 실패'); });
    } else {
        alert('Firebase 미연결');
    }
}

function saveMaintenanceMode() {
    const active = document.getElementById('mmActive').checked;
    const message = document.getElementById('mmMessage').value.trim();
    const data = { active, message };
    DB.set('maintenance_mode', data);
    if (fbReady()) _fbDB.ref('data/maintenance_mode').set(JSON.stringify(data));
    alert('저장되었습니다');
    render();
}

function clearLogs() {
    if (!confirm('접속 로그를 전부 삭제할까요?')) return;
    DB.set('access_logs', []);
    render();
}

// ========================= 새 탭 함수 =========================

// 급식 편집
function saveLunchEdit() {
    const date = document.getElementById('lunchDate').value;
    const menu = document.getElementById('lunchMenu').value.trim();
    if (!date || !menu) {
        alert('날짜와 메뉴를 입력하세요');
        return;
    }
    const lunchOverride = DB.get('lunch_override', {});
    lunchOverride[date] = menu.split('\n').filter(m => m.trim());
    DB.set('lunch_override', lunchOverride);
    if (fbReady()) _fbDB.ref('data/lunch_override').set(JSON.stringify(lunchOverride));
    alert('저장되었습니다');
    document.getElementById('lunchDate').value = '';
    document.getElementById('lunchMenu').value = '';
    render();
}

function deleteLunchEdit() {
    const date = document.getElementById('lunchDate').value;
    if (!date) {
        alert('날짜를 선택하세요');
        return;
    }
    const lunchOverride = DB.get('lunch_override', {});
    delete lunchOverride[date];
    DB.set('lunch_override', lunchOverride);
    if (fbReady()) _fbDB.ref('data/lunch_override').set(JSON.stringify(lunchOverride));
    alert('삭제되었습니다');
    document.getElementById('lunchDate').value = '';
    document.getElementById('lunchMenu').value = '';
    render();
}

// 학사일정 편집
function addCalendarItem() {
    const date = document.getElementById('calendarDate').value;
    const title = document.getElementById('calendarTitle').value.trim();
    if (!date || !title) {
        alert('날짜와 제목을 입력하세요');
        return;
    }
    const calendarOverride = DB.get('calendar_override', {});
    calendarOverride[date] = title;
    DB.set('calendar_override', calendarOverride);
    if (fbReady()) _fbDB.ref('data/calendar_override').set(JSON.stringify(calendarOverride));
    alert('추가되었습니다');
    document.getElementById('calendarDate').value = '';
    document.getElementById('calendarTitle').value = '';
    render();
}

function deleteCalendarItem(date) {
    const calendarOverride = DB.get('calendar_override', {});
    delete calendarOverride[date];
    DB.set('calendar_override', calendarOverride);
    if (fbReady()) _fbDB.ref('data/calendar_override').set(JSON.stringify(calendarOverride));
    render();
}

// 접근 제어
function addBlockIP() {
    const ip = document.getElementById('blockIP').value.trim();
    if (!ip || !/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
        alert('올바른 IP 주소를 입력하세요 (예: 123.45.67.89)');
        return;
    }
    const blockData = DB.get('ip_blocklist', {blocklist: [], allowlist: []});
    if (!blockData.blocklist) blockData.blocklist = [];
    if (blockData.blocklist.includes(ip)) {
        alert('이미 차단된 IP입니다');
        return;
    }
    blockData.blocklist.push(ip);
    DB.set('ip_blocklist', blockData);
    if (fbReady()) _fbDB.ref('data/ip_blocklist').set(JSON.stringify(blockData));
    alert('차단되었습니다');
    document.getElementById('blockIP').value = '';
    render();
}

function removeBlockIP(ip) {
    const blockData = DB.get('ip_blocklist', {blocklist: [], allowlist: []});
    blockData.blocklist = (blockData.blocklist || []).filter(item => item !== ip);
    DB.set('ip_blocklist', blockData);
    if (fbReady()) _fbDB.ref('data/ip_blocklist').set(JSON.stringify(blockData));
    render();
}

// 백업/복구
function exportData() {
    const keys = ['emergency_notice', 'maintenance_mode', 'access_logs', 'ip_blocklist', 'lunch_override', 'calendar_override', 'timetable', 'ddays'];
    const data = {};
    keys.forEach(k => {
        const val = DB.get(k, null);
        if (val !== null) data[k] = val;
    });
    data._exported = new Date().toISOString();
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eungaram_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (!confirm(`${Object.keys(data).length - 1}개 항목을 복구할까요?`)) return;

            const keys = Object.keys(data).filter(k => k !== '_exported');
            keys.forEach(k => {
                DB.set(k, data[k]);
            });
            alert('복구가 완료되었습니다');
            render();
        } catch (err) {
            alert('파일 형식이 올바르지 않습니다');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// 사이트 설정 저장
function saveSiteSettings() {
    const settings = {
        pushNotify: document.getElementById('pushNotify').checked,
        defaultTheme: document.getElementById('defaultTheme').value,
        private: document.querySelector('input[name="public"]:checked').value === 'private',
        footerText: document.getElementById('footerText').value.trim()
    };
    DB.set('site_settings', settings);
    if (fbReady()) _fbDB.ref('data/site_settings').set(JSON.stringify(settings));
    alert('저장되었습니다');
    render();
}

function renderMaintenancePage(msg) {
    return `
    <div style="display:flex;align-items:center;justify-content:center;min-height:80vh;padding:40px">
        <div style="text-align:center;max-width:400px">
            <div style="font-size:5rem;margin-bottom:20px">🔧</div>
            <h2 style="margin:0 0 12px">시스템 점검 중</h2>
            <p style="color:var(--text-muted);white-space:pre-wrap;line-height:1.7">${escapeHtml(msg||'현재 시스템 점검 중입니다.\n잠시 후 이용해주세요.')}</p>
        </div>
    </div>`;
}

function getDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad/.test(ua) || (/android/.test(ua) && !/mobile/.test(ua))) return '태블릿';
    if (/mobile|phone|android|iphone|ipod/.test(ua)) return '모바일';
    return 'PC';
}

function logAccess() {
    if (!fbReady() || !isAdmin()) return;
    const entry = {
        time: new Date().toISOString(),
        ip: 'unknown',
        device: getDeviceType(),
        ua: navigator.userAgent.substring(0, 80),
        lang: navigator.language,
        screen: `${screen.width}×${screen.height}`,
        page: currentPage,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    let logs = [];
    try { const r = localStorage.getItem('access_logs'); if(r) logs = JSON.parse(r); } catch(e) {}
    logs.push(entry);
    if (logs.length > 500) logs.shift();
    DB.set('access_logs', logs);
    fetch('https://api.ipify.org?format=json')
        .then(r => r.json()).then(d => { logs[logs.length-1].ip = d.ip; DB.set('access_logs', logs); })
        .catch(() => {});
}
