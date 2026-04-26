// Vercel Serverless Function - 컴시간 시간표 API
// school-timetable 프로젝트의 파싱 로직을 기반으로 작성

const BASE_URL = 'http://comci.net:4082';
const SCHOOL_NAME_EUCKR_HEX = '%C3%BA%B0%A1%B6%F7%C1%DF'; // 은가람중 EUC-KR hex (런타임에 계산)
const GRADE = 1;
const CLASS = 2;

const HEADERS = {
    'Accept': '*/*',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'Referer': `${BASE_URL}/st`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};

const PROXIES = [
    '',
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url='
];

async function fetchWithProxy(targetUrl, isEucKr = false) {
    let lastError;
    for (const proxy of PROXIES) {
        try {
            const url = proxy ? `${proxy}${encodeURIComponent(targetUrl)}` : targetUrl;
            const res = await fetch(url, {
                headers: HEADERS,
                signal: AbortSignal.timeout(8000)
            });
            if (!res.ok) continue;

            const buffer = await res.arrayBuffer();
            if (isEucKr) {
                return new TextDecoder('euc-kr').decode(buffer);
            }
            const text = new TextDecoder('utf-8').decode(buffer);
            return text.replace(/\0/g, '');
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError || new Error('모든 프록시 실패');
}

async function getPrefix() {
    const html = await fetchWithProxy(`${BASE_URL}/st`, true);
    const match = html.match(/sc_data\('([^']+)'/);
    if (!match) throw new Error('sc_data prefix를 찾을 수 없습니다');
    return match[1];
}

// 한글을 EUC-KR hex로 변환 (서버 환경에서)
function toEucKrHex(str) {
    // Node.js Buffer를 사용해 EUC-KR 인코딩
    try {
        const iconv = require('iconv-lite');
        const buf = iconv.encode(str, 'euc-kr');
        return Array.from(buf).map(b => '%' + b.toString(16).toUpperCase().padStart(2, '0')).join('');
    } catch {
        // iconv-lite 없을 경우 미리 인코딩된 값 사용
        // 은가람중학교 = C3 BA B0 A1 B6 F7 C1 DF C7 D0 B1 B3
        return '%C3%BA%B0%A1%B6%F7%C1%DF%C7%D0%B1%B3';
    }
}

async function getSchoolCode(prefix) {
    const hex = toEucKrHex('은가람중학교');
    const searchUrl = `${BASE_URL}/${prefix}${hex}`;
    const jsonText = await fetchWithProxy(searchUrl, false);

    const start = jsonText.indexOf('{');
    const end = jsonText.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('학교 검색 JSON 파싱 실패');

    const data = JSON.parse(jsonText.substring(start, end + 1));
    const schools = data['학교검색'] || [];

    // 은가람중학교 찾기
    const target = schools.find(s => s[2] && s[2].includes('은가람중'));
    if (!target) {
        console.warn('[Comcigan] 은가람중 검색 결과:', schools.map(s => s[2]));
        throw new Error('은가람중학교를 찾을 수 없습니다');
    }

    return { code1: target[3], code2: target[4] };
}

async function getRawTimetableData(prefix, code1, code2) {
    // 항상 _0_1 (weekOffset 아님 - 컴시간은 전체 데이터를 한번에 반환)
    const param = `${prefix}${code2}_0_1`;
    const b64 = Buffer.from(param).toString('base64');
    const url = `${BASE_URL}/${code1}?${b64}`;

    const jsonText = await fetchWithProxy(url, false);
    const start = jsonText.indexOf('{');
    const end = jsonText.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('시간표 JSON 파싱 실패');

    let parsed;
    try {
        parsed = JSON.parse(jsonText.substring(start, end + 1));
    } catch {
        // UTF-8 실패 시 EUC-KR 재시도는 fetchWithProxy에서 이미 처리
        throw new Error('시간표 JSON 파싱 실패');
    }
    return parsed;
}

// targetDate (YYYYMMDD) 기반으로 어떤 데이터셋을 쓸지 선택
function selectDataset(rawData, timetableProps, targetDate) {
    const dateRanges = {};

    // 일자 배열에서 날짜 범위 추출
    if (rawData['일자'] && Array.isArray(rawData['일자'])) {
        timetableProps.forEach((key, idx) => {
            if (idx + 1 < rawData['일자'].length) {
                dateRanges[key] = rawData['일자'][idx + 1];
            }
        });
    } else if (rawData['일자자료'] && Array.isArray(rawData['일자자료'])) {
        rawData['일자자료'].forEach(dt => {
            if (!Array.isArray(dt) || dt.length < 2) return;
            const [directIdx, range] = dt;
            if (typeof directIdx === 'number' && timetableProps[directIdx]) {
                dateRanges[timetableProps[directIdx]] = range;
            }
        });
    }

    // targetDate를 YY-MM-DD 형식으로 변환
    const targetShort = targetDate
        ? `${targetDate.slice(2, 4)}-${targetDate.slice(4, 6)}-${targetDate.slice(6, 8)}`
        : null;

    if (targetShort) {
        for (const [key, rangeStr] of Object.entries(dateRanges)) {
            if (typeof rangeStr !== 'string') continue;
            const parts = rangeStr.split('~').map(s => s.trim());
            if (parts.length < 2) continue;
            const start = new Date(`20${parts[0]}`);
            const end = new Date(`20${parts[1]}`);
            end.setHours(23, 59, 59, 999);
            const target = new Date(`20${targetShort}`);
            if (target >= start && target <= end) {
                return key;
            }
        }
    }

    // 날짜 범위 없는 가장 큰 번호의 데이터셋 (기본 시간표)
    const unbounded = timetableProps.filter(k => !dateRanges[k]);
    if (unbounded.length > 0) {
        return unbounded.reduce((max, k) => {
            const n = parseInt(k.replace('자료', '') || '0');
            return n > parseInt(max.replace('자료', '') || '0') ? k : max;
        }, unbounded[0]);
    }

    return timetableProps[0] || null;
}

function parseTimetableData(rawData, grade, classNum, targetDate) {
    const keys = Object.keys(rawData);
    const keywords = ['국어', '수학', '영어', '과학', '사회', '체육', '음악', '미술', '진로', '도덕', '기술', '정보', '한국사', '기가', '주제'];

    // 교사 배열 찾기 (끝에 * 있는 문자열 포함)
    const teacherKey = keys.find(k =>
        Array.isArray(rawData[k]) && rawData[k].some(s => typeof s === 'string' && s.endsWith('*'))
    );

    // 과목 배열 찾기
    let subjectKey = keys.find(k => {
        if (k === teacherKey) return false;
        const val = rawData[k];
        if (!Array.isArray(val)) return false;
        let cnt = 0;
        for (let i = 0; i < Math.min(val.length, 100); i++) {
            if (typeof val[i] === 'string' && keywords.some(kw => val[i].includes(kw))) cnt++;
            if (cnt >= 2) return true;
        }
        return false;
    });

    if (!subjectKey) {
        const candidates = keys.filter(k => k !== teacherKey && Array.isArray(rawData[k]) && typeof rawData[k][0] === 'string');
        candidates.sort((a, b) => rawData[b].length - rawData[a].length);
        if (candidates.length > 0) subjectKey = candidates[0];
    }

    // 시간표 데이터셋 목록
    const timetableProps = keys.filter(k => {
        const val = rawData[k];
        return Array.isArray(val) && val[grade] && val[grade][1] && Array.isArray(val[grade][1]);
    });

    // 날짜에 맞는 데이터셋 선택
    const selectedKey = selectDataset(rawData, timetableProps, targetDate);
    if (!selectedKey) throw new Error('사용 가능한 데이터셋 없음');

    // 기본 시간표 (baseline - 기준 시간표)
    const baselineKey = timetableProps.filter(k => !rawData['일자자료']?.some(d => d[1]?.includes(k)))
        .reduce((max, k) => {
            const n = parseInt(k.replace('자료', '') || '0');
            return n > parseInt(max.replace('자료', '') || '0') ? k : max;
        }, timetableProps[0]);

    const teachers = teacherKey ? rawData[teacherKey] : [];
    const subjects = subjectKey ? rawData[subjectKey] : [];
    const data = rawData[selectedKey];
    const baseData = baselineKey ? rawData[baselineKey] : null;
    const bunri = rawData['분리'] !== undefined ? rawData['분리'] : 100;

    if (!data || !data[grade] || !data[grade][classNum]) {
        throw new Error(`${grade}학년 ${classNum}반 데이터 없음`);
    }

    const classData = data[grade][classNum];

    // 전체 데이터가 비어있는지 확인 (미래 주간 데이터 없을 때)
    let isEmptyDataset = true;
    for (let w = 1; w <= 5; w++) {
        if (classData[w]?.some(v => v !== 0)) { isEmptyDataset = false; break; }
    }

    const periods = [
        { num: 1, time: '09:10' }, { num: 2, time: '10:05' }, { num: 3, time: '11:00' },
        { num: 4, time: '11:55' }, { num: 5, time: '13:40' }, { num: 6, time: '14:35' }, { num: 7, time: '15:30' }
    ];

    // schedule[교시][요일] 형식으로 변환
    const schedule = periods.map((_, pi) => {
        const period = pi + 1;
        return Array.from({ length: 5 }, (_, wi) => {
            const weekday = wi + 1;
            const dayData = classData[weekday];
            let code = (dayData && dayData[period]) ? dayData[period] : 0;

            // 빈 데이터셋이면 baseline으로 채우기
            if (code === 0 && isEmptyDataset && baseData?.[grade]?.[classNum]?.[weekday]?.[period]) {
                code = baseData[grade][classNum][weekday][period];
            }

            if (!code) return { s: '', t: '', changed: false };

            let teacherIdx, subjectIdx;
            if (bunri === 100) {
                teacherIdx = Math.floor(code / bunri);
                subjectIdx = code % bunri;
            } else {
                teacherIdx = code % bunri;
                subjectIdx = Math.floor(code / bunri);
            }

            const subject = (subjects[subjectIdx] || '').replace(/_/g, '').trim();
            const teacher = (teachers[teacherIdx] || '').replace(/\*$/, '').trim();

            // 변동 여부 확인
            let changed = false;
            if (baseData?.[grade]?.[classNum]?.[weekday]?.[period]) {
                const baseCode = baseData[grade][classNum][weekday][period];
                changed = baseCode !== code && selectedKey !== baselineKey;
            }

            return { s: subject, t: teacher, changed };
        });
    });

    return {
        periods,
        days: ['월', '화', '수', '목', '금'],
        schedule,
        datasetId: selectedKey,
        source: 'Comcigan',
        updated: new Date().toISOString()
    };
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

    try {
        const weekOffset = parseInt(req.query.weekOffset || '0', 10);

        // weekOffset → targetDate (해당 주 월요일 날짜)
        const now = new Date();
        now.setDate(now.getDate() + weekOffset * 7);
        const day = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
        const pad = n => String(n).padStart(2, '0');
        const targetDate = `${monday.getFullYear()}${pad(monday.getMonth() + 1)}${pad(monday.getDate())}`;

        console.log(`[Comcigan] 요청: weekOffset=${weekOffset}, targetDate=${targetDate}`);

        const prefix = await getPrefix();
        const { code1, code2 } = await getSchoolCode(prefix);
        const rawData = await getRawTimetableData(prefix, code1, code2);
        const timetable = parseTimetableData(rawData, GRADE, CLASS, targetDate);

        res.status(200).json({ ok: true, timetable, targetDate });
    } catch (e) {
        console.error('[Comcigan API]', e.message);
        res.status(500).json({ ok: false, error: e.message });
    }
}
