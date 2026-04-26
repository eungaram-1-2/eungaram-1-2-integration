// =============================================
// 컴시간 알리미 HTML 스크래핑
// =============================================

const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

const COMTIME_URL = 'https://xn--s39a564bmri.xn--hk3b17f.xn--3e0b707e/?sc=94427';

async function scrapeComtimeTimetable() {
    try {
        console.log('[컴시간] 시간표 스크래핑 시작...');

        const response = await fetch(COMTIME_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (!response.ok) {
            console.error(`[컴시간] 페이지 로드 실패: ${response.status}`);
            return null;
        }

        const html = await response.text();
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // tbody 찾기
        const tbody = document.querySelector('tbody');
        if (!tbody) {
            console.error('[컴시간] 시간표 테이블을 찾을 수 없습니다.');
            return null;
        }

        // 행(tr) 추출
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const schedule = [];

        // 각 행 (교시) 처리
        rows.forEach((row) => {
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length < 6) return; // 첫 번째 셀(교시) + 5개 요일

            const periodRow = [];

            // 각 요일별 처리 (첫 번째 셀 제외)
            for (let dayIdx = 1; dayIdx < cells.length; dayIdx++) {
                const cell = cells[dayIdx];

                // 과목명: text-[11px] font-semibold 클래스를 가진 div
                const subjectDiv = Array.from(cell.querySelectorAll('div')).find(el => {
                    return el.className && el.className.includes('text-[11px]') && el.className.includes('font-semibold');
                });

                // 교사명: text-[9px]이고 amber-600이 아닌 div
                const teacherDiv = Array.from(cell.querySelectorAll('div')).find(el => {
                    return el.className &&
                           el.className.includes('text-[9px]') &&
                           !el.className.includes('amber-600') &&
                           el.textContent.trim() !== '-';
                });

                const subject = subjectDiv ? subjectDiv.textContent.trim() : '';
                const teacher = teacherDiv ? teacherDiv.textContent.trim() : '';

                // 빈 칸 처리
                if (!subject || subject === '-') {
                    periodRow.push({ s: '', t: '' });
                } else {
                    periodRow.push({ s: subject, t: teacher });
                }
            }

            if (periodRow.length === 5) {
                schedule.push(periodRow);
            }
        });

        if (schedule.length === 0) {
            console.error('[컴시간] 시간표 데이터를 추출할 수 없습니다.');
            return null;
        }

        const timetable = {
            periods: [
                { num: 1, time: '09:10' },
                { num: 2, time: '10:05' },
                { num: 3, time: '11:00' },
                { num: 4, time: '11:55' },
                { num: 5, time: '13:40' },
                { num: 6, time: '14:35' },
                { num: 7, time: '15:30' }
            ],
            days: ['월', '화', '수', '목', '금'],
            schedule: schedule,
            source: '컴시간 알리미',
            updated: new Date().toISOString()
        };

        console.log('[컴시간] 스크래핑 완료!');
        console.log(`[컴시간] 추출 교시: ${schedule.length}개`);

        return timetable;
    } catch (e) {
        console.error('[컴시간] 스크래핑 실패:', e.message);
        return null;
    }
}

// CLI 실행
if (require.main === module) {
    scrapeComtimeTimetable().then(data => {
        if (data) {
            console.log('\n✅ 시간표 스크래핑 성공!\n');
            console.log('📋 최종 시간표:');
            console.log(JSON.stringify(data, null, 2));

            // 샘플 출력
            if (data.schedule.length > 0) {
                console.log('\n📌 1교시 샘플:');
                data.schedule[0].forEach((cls, idx) => {
                    const dayName = data.days[idx];
                    console.log(`  ${dayName}요일: ${cls.s || '(없음)'} ${cls.t ? `(${cls.t})` : ''}`);
                });
            }
        } else {
            console.error('\n❌ 스크래핑 실패');
            process.exit(1);
        }
    });
}

module.exports = { scrapeComtimeTimetable };
