// =============================================
// 시간표 (기본값, data/timetable.csv로 덮어쓰기 가능)
// =============================================
let TIMETABLE = {
    periods: [
        { num:1, time:'09:10' }, { num:2, time:'10:05' }, { num:3, time:'11:00' },
        { num:4, time:'11:55' }, { num:5, time:'13:40' }, { num:6, time:'14:35' },
        { num:7, time:'15:30' }
    ],
    days: ['월','화','수','목','금'],
    schedule: [
        [{s:'국어',t:'전태'},{s:'체육',t:'박준'},{s:'학스',t:'전태'},{s:'기가',t:'안치'},{s:'사회',t:'이혜'}],
        [{s:'과학',t:'박정'},{s:'미술',t:'이경'},{s:'사회',t:'변혜'},{s:'체육',t:'박준'},{s:'진로',t:'순미'}],
        [{s:'체육',t:'박준'},{s:'수학',t:'김정'},{s:'도덕',t:'김현'},{s:'수학',t:'김정'},{s:'수학',t:'김정'}],
        [{s:'미술',t:'이경'},{s:'음악',t:'정향'},{s:'과학',t:'박정'},{s:'사회',t:'이혜'},{s:'도덕',t:'김현'}],
        [{s:'주제1',t:'김인'},{s:'국어',t:'전태'},{s:'음악',t:'정향'},{s:'영어',t:'이하'},{s:'영어',t:'윤정'}],
        [{s:'주제1',t:'김인'},{s:'주제2',t:'김인'},{s:'영어',t:'이하'},{s:'국어',t:'윤현'},{s:'기가',t:'안치'}],
        [{s:'',t:''},{s:'주제2',t:'김인'},{s:'',t:''},{s:'',t:''},{s:'',t:''}]
    ]
};

// =============================================
// 과목 색상
// =============================================
const SUBJ_COLORS = {
    '국어':'#ef4444','수학':'#3b82f6','영어':'#22c55e','과학':'#f59e0b',
    '사회':'#8b5cf6','체육':'#06b6d4','음악':'#ec4899','미술':'#f97316',
    '도덕':'#14b8a6','기가':'#6366f1','진로':'#84cc16','학스':'#a855f7',
    '주제1':'#64748b','주제2':'#64748b'
};

// =============================================
// 교과서 링크
// =============================================
const TEXTBOOKS = [
    { icon:'🇰🇷', title:'국어', url:'https://view.chunjae.co.kr/streamdocs/view/sd;streamdocsId=Gz6AURCyLqe5Dzf8R7lamKW9LCewt2MZKY7qXtGJebQ;isExternal=eQ;printUse=;enableDapSide=;pageView=' },
    { icon:'🇬🇧', title:'영어', url:'https://view.chunjae.co.kr/streamdocs/view/sd;streamdocsId=8ga02zZdvlVDKPa_qNevQkJ49Bq1kE-1dmI263cOPiA;isExternal=eQ;printUse=;enableDapSide=;pageView=' },
    { icon:'🔢', title:'수학', url:'https://view.chunjae.co.kr/streamdocs/view/sd;streamdocsId=KNj_rZK644Q0i2KmCbVI8woQlkDTgqrn7G0cGI_Hy1s;isExternal=eQ;printUse=;enableDapSide=;pageView=' },
    { icon:'🔬', title:'과학', url:'https://ibook.vivasam.com/CBS_iBook/3776/contents/index.html?skin=basic01' },
    { icon:'🌍', title:'사회', url:'https://ebook.dongapublishing.com/ebook/ecatalog5.asp?Dir=2288' },
    { icon:'🗺️', title:'사회과부도', url:'https://ebook.dongapublishing.com/ebook/ecatalog5.asp?Dir=2298' },
    { icon:'😊', title:'도덕', url:'https://ebook.dongapublishing.com/ebook/ecatalog5.asp?Dir=2300' },
    { icon:'⚙️', title:'기가', url:'https://s3.ap-northeast-2.amazonaws.com/tsol.jihak.co.kr/tsol/22tp/m/tec/JIHAKSA_%EA%B8%B0%EC%88%A0%EA%B0%80%EC%A0%95%E2%91%A0_%EC%A4%91_%EA%B5%90%EA%B3%BC%EC%84%9C.pdf' }
];

// =============================================
// 바로가기 링크
// =============================================
const QUICK_LINKS = [
    { icon:'🏫', title:'은가람중학교 공식 사이트', desc:'학교 공식 홈페이지',       url:'https://eungaram-m.goegh.kr/eungaram-m/main.do', color:'#7c3aed' },
    { icon:'📚', title:'전자도서관',               desc:'온라인 전자도서관 이용',   url:'https://eungaram.yes24library.com/', color:'#3b82f6' },
    { icon:'📖', title:'교과서, 한눈에!',         desc:'핸드폰으로 교과서 보기',   page:'textbook', color:'#d946ef' },
    { icon:'🔍', title:'도서 검색',               desc:'학교 도서 검색 서비스',    url:'https://read365.edunet.net/PureScreen/SchoolSearch?schoolName=%EC%9D%80%EA%B0%80%EB%9E%8C%EC%A4%91%ED%95%99%EA%B5%90&provCode=J10&neisCode=J100007036', color:'#22c55e' },
    { icon:'🍽️', title:'급식 안내',               desc:'이번 주 급식 메뉴 확인',   url:'https://eungaram-m.goegh.kr/eungaram-m/ad/fm/foodmenu/selectFoodMenuView.do?mi=8056', color:'#f59e0b' },
    // { icon:'💭', title:'실시간 채팅',            desc:'친구들과 즉시 소통',       page:'chat', color:'#06b6d4' },
    // { icon:'⏰', title:'D-Day',                   desc:'주요 일정 카운트다운',     page:'dday', color:'#f97316' },
    { icon:'📋', title:'학교 정보',               desc:'학교 알리미 정보 공개',    url:'https://www.schoolinfo.go.kr/ei/ss/Pneiss_b01_s0.do?SHL_IDF_CD=5279faf7-723c-4be3-985f-fb64171392e7', color:'#ec4899' },
    // { icon:'📮', title:'건의함',                  desc:'의견 및 건의사항 제출',    url:'https://docs.google.com/forms/u/0/d/e/1FAIpQLSc1s4oIvfvoT_GbvdFU95ZglDqYvsfngXrwZOaiaeDDC2NsiA/formResponse', color:'#14b8a6' },
    // { icon:'💬', title:'1-2반 건의함',         desc:'웹사이트 피드백 및 건의',   url:'https://docs.google.com/forms/d/e/1FAIpQLScUFM4zrlhQRJrgg0bXX33IiNY2nynXp4STqQsypHCHFb7byQ/viewform', color:'#ef4444' },
    { icon:'🎵', title:'교가',                 desc:'은가람중학교 교가 감상',     audio:'assets/교가.mp3', color:'#6366f1' },
    // { icon:'📮', title:'건의함/신고함',         desc:'건의사항 및 신고 제출',       page:'suggestion', color:'#14b8a6' },
    { icon:'💬', title:'웹사이트 건의',         desc:'웹사이트 피드백 및 건의',     url:'https://open.kakao.com/o/sQsGreji', color:'#ef4444' },
    // { icon:'🎲', title:'자리 뽑기',             desc:'랜덤 좌석 배정 (관리자)',   page:'seat-draw', color:'#8b5cf6' }
    { icon:'🤖', title:'중학교 AI 선생님',       desc:'어려운 개념도 쉽게 설명해요', url:'https://eungaram-1-2.github.io/eungaram_chat_ai/', color:'#667eea' },
    { icon:'🧹', title:'청소 당번표',             desc:'우리 반 청소 구역 배정표',     page:'cleaning', color:'#10b981' },
    { icon:'🗺️', title:'지도',                   desc:'장소 검색 · 현재 위치 · 길찾기', page:'map', color:'#0ea5e9' },
    { icon:'📆', title:'예전 시간표/급식 사이트 바로가기', desc:'이전 버전의 시간표/급식 사이트 접속', url:'https://eungaram-1-2.github.io/eungaram-1-2-tt-lunch', color:'#a78bfa' }
];

// =============================================
// 알레르기 정보 맵
// =============================================
const ALLERGEN_MAP = {
    1:'난류', 2:'우유', 3:'메밀', 4:'땅콩', 5:'대두', 6:'밀', 7:'고등어', 8:'게', 9:'새우',
    10:'돼지고기', 11:'복숭아', 12:'토마토', 13:'아황산류', 14:'호두', 15:'닭고기', 16:'쇠고기', 17:'오징어', 18:'조개류', 19:'잣'
};

// =============================================
// Firebase에서 시간표 동적 로드
// =============================================
function loadTimetableFromFirebase() {
    if (!fbReady()) {
        console.log('[시간표] Firebase 미연결 → 기본값 사용');
        return;
    }

    _fbDB.ref('config/timetable').on('value', (snapshot) => {
        if (snapshot.exists()) {
            try {
                const data = snapshot.val();
                TIMETABLE = data;
                console.log('[시간표] Firebase에서 로드됨');
                // 현재 페이지가 시간표라면 리렌더
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
