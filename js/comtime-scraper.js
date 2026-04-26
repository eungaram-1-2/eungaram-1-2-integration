// =============================================
// 컴시간 알리미 웹사이트 시간표 스크래핑
// =============================================

const COMTIME_CONFIG = {
    URL: 'https://xn--s39a564bmri.xn--hk3b17f.xn--3e0b707e/?sc=94427'
};

async function fetchComtimeTimetable() {
    try {
        console.log('[컴시간] 시간표 로드 시작...');

        const response = await fetch(COMTIME_CONFIG.URL);
        if (!response.ok) {
            console.warn(`[컴시간] 페이지 로드 실패: ${response.status}`);
            return [];
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const tbody = doc.querySelector('tbody');
        if (!tbody) {
            console.warn('[컴시간] 테이블을 찾을 수 없습니다.');
            return [];
        }

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const schedule = [];

        rows.forEach((row) => {
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length < 6) return; // 첫 번째 셀(교시) + 5개 요일

            const periodRow = [];

            // 각 요일별 처리 (첫 번째 셀 제외)
            for (let dayIdx = 1; dayIdx < cells.length; dayIdx++) {
                const cell = cells[dayIdx];
                const innerHtml = cell.innerHTML;

                // 빈 칸 확인 (border 클래스가 있고 내용이 "-"인 경우)
                if (innerHtml.includes('text-slate-300') || innerHtml.includes('>-<')) {
                    periodRow.push({ s: '', t: '' });
                    continue;
                }

                // 과목명 추출: text-[11px] ~ whitespace-nowrap 사이의 텍스트
                const subjectMatch = innerHtml.match(
                    /text-\[11px\][^>]*>[^<]*?<\/div>\s*<div[^>]*>([^<]+)<\/div>/
                );

                // 교사명 추출: text-[9px] ~ whitespace-nowrap 사이의 텍스트 (amber-600 제외)
                const teacherMatch = innerHtml.match(
                    /text-\[9px\](?!.*amber-600)[^>]*>\s*<div[^>]*>([^<]+)<\/div>/
                );

                const subject = subjectMatch ? subjectMatch[1].trim() : '';
                const teacher = teacherMatch ? teacherMatch[1].trim() : '';

                if (subject && subject !== '-') {
                    periodRow.push({ s: subject, t: teacher });
                } else {
                    periodRow.push({ s: '', t: '' });
                }
            }

            if (periodRow.length === 5) {
                schedule.push(periodRow);
            }
        });

        if (schedule.length === 0) {
            console.warn('[컴시간] 시간표 데이터를 추출할 수 없습니다.');
            return [];
        }

        console.log(`[컴시간] 시간표 로드 완료: ${schedule.length}교시`);
        return schedule;
    } catch (e) {
        console.warn('[컴시간] 스크래핑 실패:', e.message);
        return [];
    }
}

/**
 * 컴시간 시간표 배열 → TIMETABLE 형식 변환
 */
function buildTimetableFromComtime(scheduleArray) {
    if (!scheduleArray || !Array.isArray(scheduleArray) || scheduleArray.length === 0) return null;

    const periods = [
        { num: 1, time: '09:10' },
        { num: 2, time: '10:05' },
        { num: 3, time: '11:00' },
        { num: 4, time: '11:55' },
        { num: 5, time: '13:40' },
        { num: 6, time: '14:35' },
        { num: 7, time: '15:30' }
    ];

    return {
        periods: periods,
        days: ['월', '화', '수', '목', '금'],
        schedule: scheduleArray,
        source: '컴시간 알리미',
        updated: new Date().toISOString()
    };
}

/**
 * 컴시간 알리미 → Firebase → 웹사이트 흐름
 */
async function loadTimetableFromComtime() {
    console.log('[시간표] 컴시간 알리미에서 시간표 로드 시작...');

    const scheduleData = await fetchComtimeTimetable();
    if (!scheduleData || scheduleData.length === 0) {
        console.warn('[컴시간] 데이터 없음 → NEIS API/Firebase 사용');
        return false;
    }

    const timetable = buildTimetableFromComtime(scheduleData);
    if (!timetable) return false;

    // TIMETABLE 업데이트
    TIMETABLE = timetable;
    console.log('[컴시간] 시간표 업데이트 완료:', timetable.schedule.length, '교시');

    // Firebase에 저장 (선택사항)
    if (typeof fbReady === 'function' && fbReady()) {
        try {
            _fbDB.ref('config/timetable').set(timetable).catch(e => {
                console.warn('[Firebase] 시간표 저장 실패:', e);
            });
        } catch (e) {}
    }

    return true;
}
