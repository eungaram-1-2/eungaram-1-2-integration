// Vercel Serverless Function
// 컴시간 알리미에서 시간표 파싱 후 JSON 반환

const COMCIGAN_HOST = 'http://컴시간학생.kr';
const SCHOOL_NAME = '은가람중학교';
const GRADE = 1;
const CLASS = 2;

async function fetchWithEucKr(url) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
        }
    });
    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    return decoder.decode(buffer);
}

async function init() {
    const body = await fetchWithEucKr(COMCIGAN_HOST);

    const frameMatch = body.match(/<frame [^>]*src=['"]([^'"]+)['"][^>]*>/i);
    if (!frameMatch) throw new Error('frame을 찾을 수 없습니다');

    const frameUrl = frameMatch[1];
    const baseUrl = new URL(frameUrl).origin;

    const innerBody = await fetchWithEucKr(frameUrl);

    const raIdx = innerBody.indexOf('school_ra(sc)');
    const scIdx = innerBody.indexOf("sc_data('");
    if (raIdx === -1 || scIdx === -1) throw new Error('식별 코드를 찾을 수 없습니다');

    const raMatch = innerBody.substr(raIdx, 50).replace(/ /g, '').match(/url:'(.*?)'/);
    const scMatch = innerBody.substr(scIdx, 30).replace(/ /g, '').match(/\(.*\)/);

    if (!raMatch || !scMatch) throw new Error('코드 파싱 실패');

    const extractCode = raMatch[1];
    const scData = scMatch[0].replace(/[()]/g, '').replace(/'/g, '').split(',');

    return { baseUrl, extractCode, scData };
}

async function searchSchool(baseUrl, extractCode, schoolName) {
    // EUC-KR URL 인코딩
    const encoded = encodeURIComponent(schoolName);
    const searchUrl = baseUrl + extractCode + encoded;

    const res = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const buffer = await res.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);
    const jsonStr = text.substring(0, text.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonStr);
    const results = parsed['학교검색'];
    if (!results || results.length === 0) throw new Error('학교를 찾을 수 없습니다');
    return results.map(d => ({ code: d[3], region: d[1], name: d[2] }));
}

async function getTimetableData(baseUrl, extractCode, scData, schoolCode, weekOffset = 0) {
    const s7 = scData[0] + schoolCode;
    const rawQuery = s7 + `_${weekOffset}_1`;
    const b64 = Buffer.from(rawQuery).toString('base64');
    const sc3 = extractCode.split('?')[0] + '?' + b64;
    const url = baseUrl + sc3;

    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const buffer = await res.arrayBuffer();

    let text = new TextDecoder('utf-8').decode(buffer);
    let jsonStr = text.substring(0, text.lastIndexOf('}') + 1);

    try {
        const test = JSON.parse(jsonStr);
        const keys = Object.keys(test);
        if (keys.some(k => k.includes('?'))) {
            text = new TextDecoder('euc-kr').decode(buffer);
            jsonStr = text.substring(0, text.lastIndexOf('}') + 1);
        }
    } catch {
        text = new TextDecoder('euc-kr').decode(buffer);
        jsonStr = text.substring(0, text.lastIndexOf('}') + 1);
    }

    return JSON.parse(jsonStr);
}

function parseTimetable(data, grade, classNum) {
    const keys = Object.keys(data);
    const keywords = ['국어', '수학', '영어', '과학', '사회', '체육', '음악', '미술', '진로', '도덕', '기술', '정보', '한국사'];

    const teacherKey = keys.find(k =>
        Array.isArray(data[k]) && data[k].some(s => typeof s === 'string' && s.endsWith('*'))
    );

    let subjectKey = keys.find(k => {
        const val = data[k];
        if (!Array.isArray(val)) return false;
        for (let i = 0; i < Math.min(val.length, 100); i++) {
            if (typeof val[i] === 'string' && keywords.some(kw => val[i].includes(kw))) return true;
        }
        return false;
    });

    if (!subjectKey) {
        const candidates = keys.filter(k => k !== teacherKey && Array.isArray(data[k]) && typeof data[k][0] === 'string');
        candidates.sort((a, b) => data[b].length - data[a].length);
        if (candidates.length > 0) subjectKey = candidates[0];
    }

    const scheduleProps = keys.filter(k => {
        const val = data[k];
        return Array.isArray(val) && val[grade] && val[grade][1] && Array.isArray(val[grade][1]);
    });

    let scheduleKey = '';
    let minCount = Infinity;
    for (let i = scheduleProps.length - 1; i >= 0; i--) {
        const gradeData = data[scheduleProps[i]][grade];
        if (!gradeData) continue;
        let count = 0;
        for (let c = 1; c < gradeData.length; c++) {
            const cd = gradeData[c];
            if (!cd) continue;
            for (let w = 1; w <= 5; w++) {
                if (cd[w] && Array.isArray(cd[w]))
                    count += cd[w].filter(x => typeof x === 'number' && x > 0).length;
            }
        }
        if (count > 10 && count <= minCount) {
            minCount = count;
            scheduleKey = scheduleProps[i];
        }
    }
    if (!scheduleKey && scheduleProps.length > 0) scheduleKey = scheduleProps[scheduleProps.length - 1];

    const teachers = teacherKey ? data[teacherKey] : [];
    const subjects = subjectKey ? data[subjectKey] : [];
    const scheduleData = scheduleKey ? data[scheduleKey] : null;
    const bunri = data['분리'] !== undefined ? data['분리'] : 100;

    if (!scheduleData) throw new Error('시간표 데이터 없음');

    const gradeData = scheduleData[grade];
    if (!gradeData) throw new Error(`${grade}학년 데이터 없음`);

    const classData = gradeData[classNum];
    if (!classData) throw new Error(`${grade}학년 ${classNum}반 데이터 없음`);

    // 7교시 x 5요일 배열 생성
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
            if (!dayData || !Array.isArray(dayData) || period >= dayData.length) return { s: '', t: '' };

            const cell = dayData[period];
            if (!cell || cell === 0) return { s: '', t: '' };

            let teacherCode, subjectCode;
            if (bunri === 100) {
                teacherCode = Math.floor(cell / bunri);
                subjectCode = cell % bunri;
            } else {
                teacherCode = cell % bunri;
                subjectCode = Math.floor(cell / bunri);
            }

            const subject = (subjects[subjectCode] || '').trim();
            const teacher = (teachers[teacherCode] || '').replace(/\*$/, '').trim();
            return { s: subject, t: teacher };
        });
    });

    return { periods, days: ['월', '화', '수', '목', '금'], schedule, source: 'Comcigan', updated: new Date().toISOString() };
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    try {
        const weekOffset = parseInt(req.query.weekOffset || '0', 10);
        const { baseUrl, extractCode, scData } = await init();
        const schools = await searchSchool(baseUrl, extractCode, SCHOOL_NAME);
        const school = schools[0];
        const data = await getTimetableData(baseUrl, extractCode, scData, school.code, weekOffset);
        const timetable = parseTimetable(data, GRADE, CLASS);

        res.status(200).json({ ok: true, timetable });
    } catch (e) {
        console.error('[Comcigan API]', e.message);
        res.status(500).json({ ok: false, error: e.message });
    }
}
