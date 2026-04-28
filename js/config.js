// =============================================
// 시간표 (기본값, data/timetable.csv로 덮어쓰기 가능)
// =============================================
let TIMETABLE = {
    periods: [
        { num: 1, time: '09:10' }, { num: 2, time: '10:05' }, { num: 3, time: '11:00' },
        { num: 4, time: '11:55' }, { num: 5, time: '13:40' }, { num: 6, time: '14:35' },
        { num: 7, time: '15:30' }
    ],
    days: ['월', '화', '수', '목', '금'],
    schedule: [
        [{ s: '국어', t: '전태' }, { s: '체육', t: '박청' }, { s: '정보', t: '전태' }, { s: '기가', t: '안치' }, { s: '사회', t: '이현' }],
        [{ s: '과학', t: '박정' }, { s: '미술', t: '서경' }, { s: '사회', t: '변영' }, { s: '체육', t: '박청' }, { s: '진로', t: '김은' }],
        [{ s: '체육', t: '박청' }, { s: '수학', t: '김인' }, { s: '도덕', t: '김인' }, { s: '수학', t: '김인' }, { s: '수학', t: '김인' }],
        [{ s: '미술', t: '서경' }, { s: '음악', t: '정향' }, { s: '과학', t: '박정' }, { s: '사회', t: '이현' }, { s: '도덕', t: '김인' }],
        [{ s: '주제', t: '김인' }, { s: '국어', t: '전태' }, { s: '음악', t: '정향' }, { s: '영어', t: '이하' }, { s: '영어', t: '윤정' }],
        [{ s: '주제', t: '김인' }, { s: '주제', t: '김인' }, { s: '영어', t: '이하' }, { s: '국어', t: '윤현' }, { s: '기가', t: '안치' }],
        [{ s: '', t: '' }, { s: '주제', t: '김인' }, { s: '', t: '' }, { s: '', t: '' }, { s: '', t: '' }]
    ]
};

// =============================================
// 과목 색상
// =============================================
const SUBJ_COLORS = {
    '국어': '#ef4444',
    '수학': '#3b82f6',
    '영어': '#22c55e',
    '과학': '#f59e0b',
    '사회': '#8b5cf6',
    '체육': '#06b6d4',
    '음악': '#ec4899',
    '미술': '#f97316',
    '도덕': '#14b8a6',
    '기가': '#6366f1',
    '진로': '#84cc16',
    '정보': '#a855f7',
    '주제': '#64748b'
};

// =============================================
// 교과서 링크
// =============================================
const TEXTBOOKS = [
    { icon: '📖', title: '국어', url: 'https://view.chunjae.co.kr/streamdocs/view/sd;streamdocsId=Gz6AURCyLqe5Dzf8R7lamKW9LCewt2MZKY7qXtGJebQ;isExternal=eQ;printUse=;enableDapSide=;pageView=' },
    { icon: '🔤', title: '영어', url: 'https://view.chunjae.co.kr/streamdocs/view/sd;streamdocsId=8ga02zZdvlVDKPa_qNevQkJ49Bq1kE-1dmI263cOPiA;isExternal=eQ;printUse=;enableDapSide=;pageView=' },
    { icon: '🧮', title: '수학', url: 'https://view.chunjae.co.kr/streamdocs/view/sd;streamdocsId=KNj_rZK644Q0i2KmCbVI8woQlkDTgqrn7G0cGI_Hy1s;isExternal=eQ;printUse=;enableDapSide=;pageView=' },
    { icon: '🧪', title: '과학', url: 'https://ibook.vivasam.com/CBS_iBook/3776/contents/index.html?skin=basic01' },
    { icon: '🏛️', title: '사회', url: 'https://ebook.dongapublishing.com/ebook/ecatalog5.asp?Dir=2288' },
    { icon: '🗺️', title: '사회과부도', url: 'https://ebook.dongapublishing.com/ebook/ecatalog5.asp?Dir=2298' },
    { icon: '💡', title: '도덕', url: 'https://ebook.dongapublishing.com/ebook/ecatalog5.asp?Dir=2300' },
    { icon: '🛠️', title: '기가', url: 'https://s3.ap-northeast-2.amazonaws.com/tsol.jihak.co.kr/tsol/22tp/m/tec/JIHAKSA_%EA%B8%B0%EC%88%A0%EA%B0%80%EC%A0%95%E2%91%A0_%EC%A4%91_%EA%B5%90%EA%B3%BC%EC%84%9C.pdf' }
];

// =============================================
// 바로가기 링크
// =============================================
const QUICK_LINKS = [
    { icon: '🎵', title: '교가', desc: '은가람중학교 교가 감상', audio: 'assets/교가.mp3', color: '#6366f1' },
    { icon: '💬', title: '명언', desc: '선생님 명언 모음', page: 'quotes', color: '#ec4899' },
    { icon: '🤖', title: '중학교 AI 선생님', desc: '어려운 개념도 쉽게 설명해요', url: 'https://eungaram-1-2.github.io/eungaram_chat_ai/', color: '#667eea' }
];

// =============================================
// 알레르기 정보 맵
// =============================================
const ALLERGEN_MAP = {
    1: '난류',
    2: '우유',
    3: '메밀',
    4: '땅콩',
    5: '대두',
    6: '밀',
    7: '고등어',
    8: '게',
    9: '새우',
    10: '돼지고기',
    11: '복숭아',
    12: '토마토',
    13: '아황산류',
    14: '호두',
    15: '닭고기',
    16: '쇠고기',
    17: '오징어',
    18: '조개류',
    19: '잣'
};

// =============================================
// Firebase에서 시간표 동적 로드
// =============================================
function loadTimetableFromFirebase() {
    if (!fbReady()) {
        console.log('[시간표] Firebase 미연결, 기본값 사용');
        return;
    }

    _fbDB.ref('config/timetable').on('value', (snapshot) => {
        if (snapshot.exists()) {
            try {
                const data = snapshot.val();
                TIMETABLE = data;
                console.log('[시간표] Firebase에서 로드됨');
                if (typeof render === 'function' && document.location.hash.includes('timetable')) {
                    render();
                }
            } catch (e) {
                console.warn('[시간표] Firebase 파싱 실패:', e);
            }
        }
    }, (error) => {
        console.warn('[시간표] Firebase 읽기 오류:', error);
    });
}
