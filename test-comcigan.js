// 로컬 테스트 스크립트 - comci.net:4082/st 파싱 확인
const http = require('http');

const options = {
    hostname: 'comci.net',
    port: 4082,
    path: '/st',
    method: 'GET',
    headers: {
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    },
    timeout: 10000
};

const req = http.request(options, (res) => {
    let chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const text = new TextDecoder('euc-kr').decode(buf).replace(/\0/g, '');

        console.log('[상태]', res.statusCode);
        console.log('[길이]', text.length, '자');

        // 코드 추출
        const searchMatch = text.match(/url:['"]\.([^'"]+?)['"]/);
        const timeMatch = text.match(/var\s+sc3\s*=\s*['"]\.([^'"]+?)['"]/);
        const prefixMatch = text.match(/sc_data\s*\(\s*['"]([^'"]+)['"]/);

        console.log('searchPath:', searchMatch ? searchMatch[1] : 'NOT FOUND');
        console.log('timePath:  ', timeMatch ? timeMatch[1] : 'NOT FOUND');
        console.log('prefix:    ', prefixMatch ? prefixMatch[1] : 'NOT FOUND');

        // 근처 소스 확인
        const urlIdx = text.indexOf("url:'");
        if (urlIdx !== -1) console.log('\nurl 근처:', JSON.stringify(text.substring(urlIdx, urlIdx + 60)));

        const sc3Idx = text.indexOf('sc3=');
        if (sc3Idx !== -1) console.log('sc3 근처:', JSON.stringify(text.substring(sc3Idx, sc3Idx + 60)));

        const scDataIdx = text.indexOf('sc_data');
        if (scDataIdx !== -1) console.log('sc_data 근처:', JSON.stringify(text.substring(scDataIdx, scDataIdx + 80)));

        const schoolRaIdx = text.indexOf('school_ra');
        if (schoolRaIdx !== -1) console.log('school_ra 근처:', JSON.stringify(text.substring(schoolRaIdx, schoolRaIdx + 80)));
    });
});

req.on('error', e => console.error('오류:', e.message));
req.on('timeout', () => { req.destroy(); console.log('타임아웃'); });
req.end();
