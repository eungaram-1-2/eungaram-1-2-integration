// 학교 검색 응답 raw 디버깅
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
                'Referer': 'http://comci.net:4082/st',
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
                resolve({ text: text.replace(/\0/g, ''), status: res.statusCode });
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.end();
    });
}

async function main() {
    const BASE_URL = 'http://comci.net:4082';

    // 여러 검색어와 인코딩 방법 시도
    const searchPath = '/36179?17384l';

    // iconv-lite로 실제 EUC-KR hex 계산
    let eucKrHex;
    try {
        const iconv = require('iconv-lite');
        const buf = iconv.encode('은가람중학교', 'euc-kr');
        eucKrHex = Array.from(buf).map(b => '%' + b.toString(16).padStart(2, '0')).join('');
        console.log('iconv EUC-KR hex (소문자):', eucKrHex);

        const eucKrHexUpper = Array.from(buf).map(b => '%' + b.toString(16).toUpperCase().padStart(2, '0')).join('');
        console.log('iconv EUC-KR hex (대문자):', eucKrHexUpper);
    } catch (e) {
        eucKrHex = '%c3%ba%b0%a1%b6%f7%c1%df%c7%d0%b1%b3';
        console.log('iconv-lite 없음, 고정값 사용:', eucKrHex);
    }

    // 시도 1: 소문자 hex + 긴 이름
    const urls = [
        `${BASE_URL}${searchPath}${eucKrHex}`,
        `${BASE_URL}${searchPath}${eucKrHex.toUpperCase()}`,
        // 짧은 이름 시도
    ];

    // '은가람중' (짧게)
    try {
        const iconv = require('iconv-lite');
        const buf2 = iconv.encode('은가람중', 'euc-kr');
        const shortHex = Array.from(buf2).map(b => '%' + b.toString(16).padStart(2, '0')).join('');
        urls.push(`${BASE_URL}${searchPath}${shortHex}`);
        console.log('은가람중 hex:', shortHex);
    } catch {}

    for (const url of urls) {
        console.log('\n--- URL:', url, '---');
        try {
            const { text, status } = await httpGet(url, false);
            console.log('상태:', status);
            console.log('응답 (첫 500자):', text.substring(0, 500));
        } catch (e) {
            console.log('오류:', e.message);
        }
    }
}

main().catch(e => console.error('오류:', e.message));
