// =============================================
// 컴시간 시간표 API 호출 (Vercel Function)
// =============================================

async function fetchComtimeTimetable() {
    try {
        console.log('[컴시간] 시간표 API 호출 시작...');

        const res = await fetch('/api/timetable');
        if (!res.ok) {
            console.warn(`[컴시간] API 응답 실패: ${res.status}`);
            return null;
        }

        const json = await res.json();
        if (!json.ok || !json.timetable) {
            console.warn('[컴시간] API 데이터 없음:', json.error);
            return null;
        }

        console.log('[컴시간] 시간표 로드 완료:', json.timetable.schedule.length, '교시');
        return json.timetable;
    } catch (e) {
        console.warn('[컴시간] API 호출 실패:', e.message);
        return null;
    }
}

async function loadTimetableFromComtime() {
    const timetable = await fetchComtimeTimetable();
    if (!timetable) {
        console.warn('[컴시간] 데이터 없음 → NEIS API/Firebase 사용');
        return false;
    }

    TIMETABLE = timetable;
    console.log('[컴시간] 시간표 업데이트 완료');

    if (typeof fbReady === 'function' && fbReady()) {
        try {
            _fbDB.ref('config/timetable').set(timetable).catch(e => {
                console.warn('[Firebase] 시간표 저장 실패:', e);
            });
        } catch (e) {}
    }

    return true;
}
