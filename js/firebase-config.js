// =============================================
// Firebase 설정
// =============================================
// 📌 사용 방법:
//   1. https://console.firebase.google.com 접속
//   2. 프로젝트 만들기
//   3. 빌드 → Realtime Database → 데이터베이스 만들기 (테스트 모드)
//   4. 프로젝트 설정 → 내 앱 → 웹앱 추가 → 아래 값 붙여넣기
//
// 설정 전까지는 localStorage 방식으로 동작합니다 (단일 기기).
// =============================================
const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyDqHLy776360cA5mUZ096wZ7L9BGjh7xM",
    authDomain:        "eungaram-1-2.firebaseapp.com",
    databaseURL:       "https://eungaram-1-2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "eungaram-1-2",
    storageBucket:     "eungaram-1-2.firebasestorage.app",
    messagingSenderId: "4854445179",
    appId:             "1:4854445179:web:dd2f9d87b3536d98e7c50e"
};

// Firebase 초기화 (databaseURL이 입력된 경우에만)
let _fbApp = null;
let _fbDB  = null;

(function initFirebase() {
    if (!FIREBASE_CONFIG.databaseURL) {
        console.warn('[Firebase] databaseURL 없음');
        return;
    }

    // Firebase SDK 로드 확인
    if (typeof firebase === 'undefined') {
        console.error('[Firebase] SDK 미로드');
        setTimeout(initFirebase, 1000);
        return;
    }

    try {
        _fbApp = firebase.initializeApp(FIREBASE_CONFIG);
        _fbDB  = firebase.database();
        console.info('[Firebase] ✅ Realtime Database 연결 완료');
        console.info('[Firebase] URL:', FIREBASE_CONFIG.databaseURL);
    } catch (e) {
        console.error('[Firebase] ❌ 초기화 실패:', e.message);
        _fbDB = null;
    }
})();

// 초기화 확인용
setTimeout(() => {
    console.log('[Firebase] fbReady():', fbReady());
    if (!fbReady()) {
        console.warn('[Firebase] 연결되지 않았습니다. 관리 기능이 제한될 수 있습니다.');
    }
}, 2000);

function fbReady() { return !!_fbDB; }
