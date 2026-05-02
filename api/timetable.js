// Vercel Serverless Function - 컴시간 시간표 API
// 참고: comcigan-py (school_new.py), school-timetable-main (comcigan-parser.ts)

const BASE_URL = 'http://comci.net:4082';
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
                signal: AbortSignal.timeout(10000)
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

// /st 페이지에서 3가지 코드를 추출
// searchPath: 학교 검색 경로 (school_ra -> url:'./xxx')
// timePath:   시간표 데이터 경로 (var sc3='./xxx')
// prefix:     base64 쿼리 접두사 (sc_data('PREFIX', ...))
async function getPageCodes() {
    const html = await fetchWithProxy(`${BASE_URL}/st`, true);

    // url:'./xxx' 또는 url:"./xxx" 패턴에서 경로 추출 (앞의 . 한 글자 스킵)
    const searchMatch = html.match(/url:['"]\.([^'"]+?)['"]/);
    if (!searchMatch) throw new Error('검색 경로를 찾을 수 없습니다 (school_ra url)');
    const searchPath = searchMatch[1]; // e.g. "/abc?"

    // var sc3='./xxx' 또는 var sc3="./xxx" 패턴에서 경로 추출
    const timeMatch = html.match(/var\s+sc3\s*=\s*['"]\.([^'"]+?)['"]/);
    if (!timeMatch) throw new Error('시간표 경로를 찾을 수 없습니다 (var sc3)');
    const timePath = timeMatch[1]; // e.g. "/xyz?"

    // sc_data('PREFIX', ...) 에서 첫 번째 인자 추출
    const prefixMatch = html.match(/sc_data\s*\(\s*['"]([^'"]+)['"]/);
    if (!prefixMatch) throw new Error('접두사를 찾을 수 없습니다 (sc_data)');
    const prefix = prefixMatch[1];

    console.log(`[Comcigan] searchPath=${searchPath}, timePath=${timePath}, prefix=${prefix}`);
    return { searchPath, timePath, prefix };
}

function toEucKrHex(str) {
    try {
        const iconv = require('iconv-lite');
        const buf = iconv.encode(str, 'euc-kr');
        return Array.from(buf).map(b => '%' + b.toString(16).toUpperCase().padStart(2, '0')).join('');
    } catch {
        // 은가람중학교 EUC-KR 고정값 (iconv-lite 없을 때 폴백)
        return '%C3%BA%B0%A1%B6%F7%C1%DF%C7%D0%B1%B3';
    }
}

async function getSchoolCode(searchPath) {
    const hex = toEucKrHex('은가람중학교');
    const searchUrl = `${BASE_URL}${searchPath}${hex}`;
    console.log(`[Comcigan] 학교검색 URL: ${searchUrl}`);

    const jsonText = await fetchWithProxy(searchUrl, false);
    const start = jsonText.indexOf('{');
    const end = jsonText.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('학교 검색 JSON 파싱 실패');

    const data = JSON.parse(jsonText.substring(start, end + 1));
    const schools = data['학교검색'] || [];

    const target = schools.find(s => s[2] && s[2].includes('은가람중'));
    if (!target) {
        console.warn('[Comcigan] 검색 결과:', schools.map(s => s[2]));
        throw new Error('은가람중학교를 찾을 수 없습니다');
    }

    console.log(`[Comcigan] 학교 발견: ${target[2]} (코드: ${target[3]})`);
    return target[3]; // schoolCode (숫자)
}

async function getRawTimetableData(timePath, prefix, schoolCode) {
    // base64(prefix + schoolCode + '_0_1') — 항상 _0_1 고정
    const rawQuery = `${prefix}${schoolCode}_0_1`;
    const b64 = Buffer.from(rawQuery).toString('base64');
    const url = `${BASE_URL}${timePath}${b64}`;
    console.log(`[Comcigan] 데이터 URL: ${url}`);

    const jsonText = await fetchWithProxy(url, false);
    const start = jsonText.indexOf('{');
    const end = jsonText.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('시간표 JSON 파싱 실패');

    return JSON.parse(jsonText.substring(start, end + 1));
}

// targetDate(YYYYMMDD) 기반으로 적합한 데이터셋 키 선택
function selectDataset(rawData, timetableProps, targetDate) {
    const dateRanges = {};

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

    // 날짜 범위 없는 것 중 데이터 가장 많은 것 (기본 시간표)
    // school-timetable-main 방식: 데이터 수가 10 이상이면서 가장 작은 것
    let bestKey = null;
    let minCount = Infinity;
    for (const key of timetableProps) {
        if (dateRanges[key]) continue; // 특정 기간 데이터는 제외
        const gradeData = rawData[key][GRADE];
        if (!gradeData) continue;
        let count = 0;
        for (let c = 1; c < gradeData.length; c++) {
            const cls = gradeData[c];
            if (!cls) continue;
            for (let w = 1; w <= 5; w++) {
                if (cls[w] && Array.isArray(cls[w])) {
                    count += cls[w].filter(v => typeof v === 'number' && v > 0).length;
                }
            }
        }
        if (count > 10 && count <= minCount) {
            minCount = count;
            bestKey = key;
        }
    }
    if (bestKey) return bestKey;

    // 최후 폴백: 가장 마지막 키
    return timetableProps[timetableProps.length - 1] || null;
}

function parseTimetableData(rawData, grade, classNum, targetDate) {
    const keys = Object.keys(rawData);
    const keywords = ['국어', '수학', '영어', '과학', '사회', '체육', '음악', '미술', '진로', '도덕', '기술', '정보', '한국사', '기가', '주제', '통합'];

    // 교사 배열 (끝에 * 있는 문자열 포함)
    const teacherKey = keys.find(k =>
        Array.isArray(rawData[k]) && rawData[k].some(s => typeof s === 'string' && s.endsWith('*'))
    );

    // 과목 배열
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

    // 시간표 데이터셋 목록 (grade[class][day] 배열 구조인 키들)
    const timetableProps = keys.filter(k => {
        const val = rawData[k];
        return Array.isArray(val) && val[grade] && val[grade][1] && Array.isArray(val[grade][1]);
    });

    if (timetableProps.length === 0) throw new Error('시간표 데이터셋 없음');

    const selectedKey = selectDataset(rawData, timetableProps, targetDate);
    if (!selectedKey) throw new Error('사용 가능한 데이터셋 없음');

    // baseline: 날짜 범위 없는 기본 시간표 (변경 여부 비교용)
    const baselineKey = timetableProps.find(k => {
        if (rawData['일자자료']) return !rawData['일자자료'].some(d => d[1]?.includes(k));
        return !rawData['일자']?.some(r => String(r).includes(k));
    }) || timetableProps[0];

    const teachers = teacherKey ? rawData[teacherKey] : [];
    const subjects = subjectKey ? rawData[subjectKey] : [];
    const data = rawData[selectedKey];
    const baseData = baselineKey ? rawData[baselineKey] : null;
    const bunri = rawData['분리'] !== undefined ? rawData['분리'] : 100;

    console.log(`[Comcigan] 선택된 데이터셋: ${selectedKey}, baseline: ${baselineKey}, bunri: ${bunri}`);
    console.log(`[Comcigan] 교사 배열: ${teacherKey} (${teachers.length}개), 과목 배열: ${subjectKey} (${subjects.length}개)`);

    if (!data || !data[grade] || !data[grade][classNum]) {
        throw new Error(`${grade}학년 ${classNum}반 데이터 없음`);
    }

    const classData = data[grade][classNum];

    // 선택된 데이터셋이 비어있으면 baseline으로 대체
    let isEmptyDataset = true;
    for (let w = 1; w <= 5; w++) {
        if (classData[w]?.some(v => v !== 0)) { isEmptyDataset = false; break; }
    }

    const periods = [
        { num: 1, time: '09:10' }, { num: 2, time: '10:05' }, { num: 3, time: '11:00' },
        { num: 4, time: '11:55' }, { num: 5, time: '13:40' }, { num: 6, time: '14:35' }, { num: 7, time: '15:30' }
    ];

    const schedule = periods.map((_, pi) => {
        const period = pi + 1;
        return Array.from({ length: 5 }, (_, wi) => {
            const weekday = wi + 1;
            const dayData = classData[weekday];
            let code = (dayData && dayData[period]) ? dayData[period] : 0;

            if (code === 0 && isEmptyDataset && baseData?.[grade]?.[classNum]?.[weekday]?.[period]) {
                code = baseData[grade][classNum][weekday][period];
            }

            if (!code) return { s: '', t: '', changed: false };

            let teacherIdx, subjectIdx;
            if (bunri === 100) {
                teacherIdx = Math.floor(code / bunri);
                subjectIdx = code % bunri;
            } else {
                // bunri === 1000 등
                teacherIdx = code % bunri;
                subjectIdx = Math.floor(code / bunri);
            }

            const subject = (subjects[subjectIdx] || '').replace(/_/g, '').trim();
            const teacher = (teachers[teacherIdx] || '').replace(/\*$/, '').trim();

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

        const now = new Date();
        now.setDate(now.getDate() + weekOffset * 7);
        const day = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
        const pad = n => String(n).padStart(2, '0');
        const targetDate = `${monday.getFullYear()}${pad(monday.getMonth() + 1)}${pad(monday.getDate())}`;

        console.log(`[Comcigan] 요청: weekOffset=${weekOffset}, targetDate=${targetDate}`);

        const { searchPath, timePath, prefix } = await getPageCodes();
        const schoolCode = await getSchoolCode(searchPath);
        const rawData = await getRawTimetableData(timePath, prefix, schoolCode);
        const timetable = parseTimetableData(rawData, GRADE, CLASS, targetDate);

        res.status(200).json({ ok: true, timetable, targetDate });
    } catch (e) {
        console.error('[Comcigan API]', e.message);
        res.status(500).json({ ok: false, error: e.message });
    }
}
