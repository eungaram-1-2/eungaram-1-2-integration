// 전체 파이프라인 테스트 - 학교 검색 + 데이터 fetch
const http = require('http');

function httpGet(urlStr, isEucKr = false) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const options = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest',
            },
            timeout: 10000
        };
        const req = http.request(options, (res) => {
            let chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                const buf = Buffer.concat(chunks);
                const text = isEucKr
                    ? new TextDecoder('euc-kr').decode(buf)
                    : new TextDecoder('utf-8').decode(buf);
                resolve(text.replace(/\0/g, ''));
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.end();
    });
}

function toEucKrHex(str) {
    // 은가람중학교 EUC-KR 고정값
    return '%C3%BA%B0%A1%B6%F7%C1%DF%C7%D0%B1%B3';
}

async function main() {
    const BASE_URL = 'http://comci.net:4082';

    // 1단계: /st 페이지에서 코드 추출
    console.log('=== 1단계: /st 페이지 파싱 ===');
    const html = await httpGet(`${BASE_URL}/st`, true);

    const searchMatch = html.match(/url:['"]\.([^'"]+?)['"]/);
    const timeMatch = html.match(/var\s+sc3\s*=\s*['"]\.([^'"]+?)['"]/);
    const prefixMatch = html.match(/sc_data\s*\(\s*['"]([^'"]+)['"]/);

    const searchPath = searchMatch ? searchMatch[1] : null;
    const timePath = timeMatch ? timeMatch[1] : null;
    const prefix = prefixMatch ? prefixMatch[1] : null;

    console.log('searchPath:', searchPath);
    console.log('timePath:  ', timePath);
    console.log('prefix:    ', prefix);

    if (!searchPath || !timePath || !prefix) {
        console.error('코드 추출 실패!');
        return;
    }

    // 2단계: 학교 검색
    console.log('\n=== 2단계: 학교 검색 ===');
    const hex = toEucKrHex('은가람중학교');
    const searchUrl = `${BASE_URL}${searchPath}${hex}`;
    console.log('검색 URL:', searchUrl);

    const searchResult = await httpGet(searchUrl, false);
    const start = searchResult.indexOf('{');
    const end = searchResult.lastIndexOf('}');
    if (start === -1) { console.error('검색 결과 파싱 실패'); return; }

    const data = JSON.parse(searchResult.substring(start, end + 1));
    const schools = data['학교검색'] || [];
    console.log('검색된 학교:', schools.map(s => `${s[2]}(${s[3]})`));

    const target = schools.find(s => s[2] && s[2].includes('은가람중'));
    if (!target) { console.error('은가람중 없음'); return; }

    const schoolCode = target[3];
    console.log('학교 코드:', schoolCode);

    // 3단계: 시간표 데이터 fetch
    console.log('\n=== 3단계: 시간표 데이터 ===');
    const rawQuery = `${prefix}${schoolCode}_0_1`;
    const b64 = Buffer.from(rawQuery).toString('base64');
    const dataUrl = `${BASE_URL}${timePath}${b64}`;
    console.log('rawQuery:', rawQuery);
    console.log('base64:  ', b64);
    console.log('데이터 URL:', dataUrl);

    const jsonText = await httpGet(dataUrl, false);
    const s2 = jsonText.indexOf('{');
    const e2 = jsonText.lastIndexOf('}');
    if (s2 === -1) { console.error('시간표 JSON 파싱 실패\n응답:', jsonText.substring(0, 200)); return; }

    const raw = JSON.parse(jsonText.substring(s2, e2 + 1));
    const keys = Object.keys(raw);
    console.log('\n시간표 JSON 키 목록:', keys);

    // 분리 값 확인
    console.log('분리:', raw['분리']);

    // 교사 배열 찾기
    const teacherKey = keys.find(k =>
        Array.isArray(raw[k]) && raw[k].some(s => typeof s === 'string' && s.endsWith('*'))
    );
    console.log('교사 키:', teacherKey, teacherKey ? `(${raw[teacherKey].length}개)` : '');
    if (teacherKey) console.log('교사 샘플:', raw[teacherKey].slice(1, 6));

    // 과목 배열 찾기
    const keywords = ['국어', '수학', '영어', '과학', '사회', '체육', '음악', '미술'];
    const subjectKey = keys.find(k => {
        if (k === teacherKey) return false;
        const val = raw[k];
        if (!Array.isArray(val)) return false;
        let cnt = 0;
        for (let i = 0; i < Math.min(val.length, 100); i++) {
            if (typeof val[i] === 'string' && keywords.some(kw => val[i].includes(kw))) cnt++;
            if (cnt >= 2) return true;
        }
        return false;
    });
    console.log('과목 키:', subjectKey, subjectKey ? `(${raw[subjectKey].length}개)` : '');
    if (subjectKey) console.log('과목 샘플:', raw[subjectKey].slice(1, 10));

    // 시간표 데이터셋 찾기
    const timetableProps = keys.filter(k => {
        const val = raw[k];
        return Array.isArray(val) && val[1] && val[1][1] && Array.isArray(val[1][1]);
    });
    console.log('\n시간표 데이터셋:', timetableProps);

    if (timetableProps.length > 0) {
        const key = timetableProps[0];
        const grade1class2 = raw[key][1][2];
        console.log(`\n${key} 1학년 2반 월요일:`, grade1class2[1]);
    }
}

main().catch(e => console.error('오류:', e.message));
