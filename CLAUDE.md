# 은가람 중학교 1-2반 통합 사이트

**프로젝트명:** eungaram-1-2  
**유형:** 정적 HTML/CSS/JS 사이트 (Progressive Web App)  
**배포 플랫폼:** Vercel  
**리포지토리:** 
- origin: https://github.com/eungaram-1-2/eungaram-1-2-tt-lunch
- integration: https://github.com/eungaram-1-2/eungaram-1-2-integration (자동 배포)

---

## 🎯 프로젝트 개요

은가람 중학교 1학년 2반을 위한 통합 정보 제공 사이트. 
- **급식 정보** (NEIS API 실시간 조회)
- **시간표** (NEIS API + 로컬 CSV)
- **학사일정** (NEIS API + 한국 공휴일)
- **실시간 채팅** (Firebase)
- **공지사항 및 투표** (Firebase)
- **D-Day 카운터**
- **미니게임 및 바로가기**

**주요 특징:**
- ✅ PWA (오프라인 지원, 설치 가능)
- ✅ 모바일 최적화 (100dvh, safe-area-inset)
- ✅ 보안 (CSP, HSTS, 세션 Rate Limiting)
- ✅ 성능 모니터링 (Core Web Vitals, Sentry)
- ✅ 실시간 업데이트 (Firebase, Web Notifications)

---

## 📦 기술 스택

| 구분 | 기술 |
|------|------|
| **Frontend** | Vanilla JavaScript (번들러 없음) |
| **Database** | Firebase Realtime Database |
| **API** | NEIS API (교육청 시간표/일정), Google Maps API |
| **배포** | Vercel (정적 호스팅) |
| **DevOps** | GitHub Actions, Husky pre-commit |
| **모니터링** | Google Analytics 4, Sentry, Web Vitals |

### Runtime Dependencies
```json
{
  "comcigan-parser-edited": "시간표 파싱",
  "jsdom": "스크래퍼 서버사이드 렌더링",
  "node-fetch": "Node.js fetch polyfill"
}
```

### Development Dependencies
```json
{
  "@playwright/test": "E2E 테스트",
  "clean-css-cli": "CSS 최소화",
  "eslint": "린팅",
  "prettier": "포매팅",
  "husky": "pre-commit 훅",
  "lint-staged": "스테이징된 파일만 검사"
}
```

---

## 📂 프로젝트 구조

```
index.html                  # 메인 진입점
style.css                   # 원본 스타일시트 (⚠️ 수정 후 minify 필요)
style.min.css               # 배포용 최소화 버전
manifest.json               # PWA 메니페스트
sw.js                       # Service Worker (오프라인 캐시)
vercel.json                 # Vercel 배포 설정
build.js                    # CSS 최소화 빌드 스크립트
package.json                # 의존성 정의

data/
  ├── lunch.json            # 급식 데이터 폴백 (NEIS API 실패 시)
  ├── schedule.json         # 학사일정 로컬 백업
  ├── timetable.csv         # 시간표 로컬 CSV (기본값: config.js)
  └── accounts.csv          # 기본 사용자 계정 (테스트용)

assets/
  ├── logo.svg              # 학교 로고
  └── 시간표.png            # 시간표 이미지

js/
  ├── [핵심 인프라]
  │   ├── main.js           # 앱 초기화 & 라우팅 시작
  │   ├── router.js         # SPA 라우팅 (해시 기반)
  │   ├── db.js             # localStorage ↔ Firebase 동기화
  │   ├── firebase-config.js # Firebase 초기화
  │   ├── config.js         # 기본 설정값 (시간표 등)
  │   ├── utils.js          # 공용 유틸리티
  │   ├── security.js       # Rate Limiting, 세션 관리
  │   └── modal.js          # 전역 모달 컴포넌트
  │
  ├── [페이지 렌더링]
  │   ├── home.js           # 홈 (오늘 요약)
  │   ├── static-pages.js   # 정적 페이지 (공지, 정보 등)
  │   ├── lunch.js          # 급식
  │   ├── timetable.js      # 로컬 시간표
  │   ├── neis-timetable.js # NEIS API 시간표
  │   ├── academic-calendar.js # 학사일정 (NEIS API)
  │   ├── links.js          # 바로가기
  │   ├── cleaning.js       # 청소 당번표
  │   ├── games.js          # 미니게임
  │   ├── seat-draw.js      # 자리 뽑기
  │   ├── suggestion.js     # 건의함 (Google Forms)
  │   └── map.js            # 학교 지도 (Leaflet.js - 현재 비활성)
  │
  ├── [커뮤니티 & 상호작용]
  │   ├── chat.js           # 실시간 채팅 (Firebase)
  │   ├── votes.js          # 투표 (Firebase)
  │   ├── board.js          # 게시판 (Firebase)
  │   ├── reactions.js      # 이모지 반응
  │   ├── notifications.js  # 브라우저 알림
  │   └── user-feedback.js  # 사용자 피드백 위젯
  │
  ├── [시스템 & 관리]
  │   ├── admin.js          # 관리자 패널 (긴급공지, 로그 등)
  │   ├── logger.js         # 통합 로거 (DEBUG, INFO, WARN, ERROR)
  │   ├── error-handler.js  # 전역 에러 핸들링
  │   ├── error-tracking.js # Sentry 에러 추적
  │   ├── analytics.js      # GA4 이벤트 전송
  │   ├── performance-monitor.js # Core Web Vitals 수집
  │   ├── cache-manager.js  # IndexedDB 기반 API 응답 캐시
  │   ├── pwa-manager.js    # Service Worker 등록 & 업데이트
  │   ├── theme.js          # 다크/라이트 모드
  │   ├── network-monitor.js # 온라인/배터리/속도 감지
  │   ├── ab-testing.js     # A/B 테스팅
  │   ├── visitors.js       # 방문자 카운터
  │   └── comtime-scraper.js # Comcigan 시간표 스크래퍼
  │
  └── [보안 & 성능]
      ├── server-side-scraper.js # (scripts/) 급식 서버사이드 스크래퍼
      └── ...

scripts/
  └── scrape-lunch.js       # 급식 데이터 스크래핑 (Node.js)

tests/
  └── e2e.spec.js           # Playwright E2E 테스트
```

---

## 🔌 API 통합

### 1️⃣ NEIS API (교육청)

**엔드포인트:**
```javascript
// 학사일정
https://open.neis.go.kr/hub/SchoolSchedule
  ?KEY=ed50e755df5d42d4b94db728feab7952
  &Type=json
  &pIndex=1&pSize=100
  &SCHUL_CODE=7692130
  &ATPT_OFCDE=J10

// 시간표
https://open.neis.go.kr/hub/hisTimetable
  ?KEY=ed50e755df5d42d4b94db728feab7952
  &Type=json
  &pIndex=1&pSize=100
  &SCHUL_CODE=7692130
  &GRADE=1
  &CLASS=2

// 급식
https://open.neis.go.kr/hub/MealServiceDietInfo
  ?KEY=ed50e755df5d42d4b94db728feab7952
  &Type=json
  &pIndex=1&pSize=100
  &SCHUL_CODE=7692130
```

**학교 정보:**
- 학교명: 은가람 중학교
- 학교코드 (SCHUL_CODE): 7692130
- 교육청코드 (ATPT_OFCDE): J10 (경기도)
- **⚠️ API 키는 하드코딩됨** (`academic-calendar.js`, `neis-timetable.js`, `lunch.js`에 있음)

**CORS 처리:**
- NEIS API는 CORS 미지원 → 프록시 사용
- `vercel.json` rewrites로 처리 또는 CORS 프록시 서비스 이용

### 2️⃣ Firebase Realtime Database

**프로젝트 설정:**
```javascript
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAe5Jq...",
  authDomain:        "eungaram-1-2.firebaseapp.com",
  databaseURL:       "https://eungaram-1-2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "eungaram-1-2",
  storageBucket:     "eungaram-1-2.firebasestorage.app",
  messagingSenderId: "4854445179",
  appId:             "1:4854445179:web:..."
};
```

**동기화 키 (`db.js`의 `_FB_SYNC_KEYS`):**
```javascript
const _FB_SYNC_KEYS = [
  'board',           // 게시판
  'votes',           // 투표
  'ddays',           // D-Day
  'bans',            // 차단된 IP/사용자
  'timeouts',        // 타임아웃 사용자
  'chat',            // 실시간 채팅
  'emergency_notice',// 긴급공지
  'timetable',       // 관리자가 업로드한 시간표
  'reactions'        // 게시글 이모지 반응
];
```

**realtime 구조:**
```
eungaram-1-2/
├── board/
│   └── {postId}
│       ├── title
│       ├── content
│       ├── author
│       ├── timestamp
│       └── ...
├── chat/
│   └── {messageId}
│       ├── text
│       ├── author
│       ├── timestamp
│       └── ...
├── emergency_notice
│   ├── message
│   ├── severity (info|warning|danger)
│   └── active
└── ...
```

### 3️⃣ 기타 API

**Google Analytics 4:**
- 이벤트: page_view, engagement, user_action
- Measurement ID: `js/analytics.js` 참고

**Sentry (에러 추적):**
- DSN: `js/error-tracking.js` 참고
- 자동 에러 수집, 성능 모니터링

**Google Maps (현재 비활성):**
- `js/map.js`에서 Leaflet.js 사용 (학교 지도)

---

## 🔐 보안 설정

### Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
  script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdn.jsdelivr.net;
  connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com https://open.neis.go.kr ...;
  ...
">
```

**주의:**
- `'unsafe-inline'` 사용 (모던 웹 앱에서는 nonce 권장)
- NEIS API, Firebase, 분석 도구 whitelisting 필요

### HTTP 보안 헤더 (Vercel)

```json
{
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
}
```

### Rate Limiting & 세션 관리

**`security.js`:**
- 슬라이딩 윈도우 기반 Rate Limiter
- IP별 최대 요청 수 제한
- 비정상 행동 감지 (banned users, timeouts)

**localStorage:**
```javascript
const _RATE_LIMIT_KEY = 'app_rate_limit_window';
const _SESSION_KEY = 'app_session_id';
const _BANNED_UNTIL_KEY = 'app_banned_until';
```

### HTTPS 강제화

- Vercel에서 자동으로 HTTPS 제공
- `upgrade-insecure-requests` CSP 지시어 포함

---

## 📊 데이터 플로우

### 급식 데이터

```
┌─────────────────┐
│  NEIS API       │ (우선순위 1)
└────────┬────────┘
         │ 실패
         ▼
┌─────────────────┐
│  Firebase DB    │ (우선순위 2 - 관리자 수동 입력)
└────────┬────────┘
         │ 실패
         ▼
┌─────────────────┐
│  lunch.json     │ (우선순위 3 - 폴백)
└─────────────────┘
```

**구현:** `js/lunch.js`

### 시간표 데이터

```
┌──────────────────┐
│  NEIS API        │ → 실시간 동기화 (neis-timetable.js)
└──────────────────┘

┌──────────────────┐
│  Firebase        │ → 관리자가 CSV 업로드 (admin.js)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  config.js       │ (기본값)
└──────────────────┘

┌──────────────────┐
│  timetable.csv   │ → 로컬 폴백 (timetable.js)
└──────────────────┘
```

---

## 🚀 배포 프로세스

### 1. 로컬 개발

```bash
# 저장소 클론
git clone https://github.com/eungaram-1-2/eungaram-1-2-tt-lunch.git
cd eungaram-1-2-tt-lunch

# 의존성 설치
npm install

# CSS 최소화 (style.css 수정 시)
npm run minify

# 로컬 테스트 (HTTP 서버)
npx http-server

# 또는 VS Code Live Server 사용
```

### 2. 코드 검사

```bash
# 린팅
npm run lint

# 포매팅
npm run format
npm run format:check

# E2E 테스트 (선택)
npm test
```

### 3. 커밋 & 푸시

```bash
# 커밋 (pre-commit 훅 자동 실행)
git add .
git commit -m "feat: 설명"

# origin 원본에 푸시
git push origin main

# integration 배포 브랜치에 푸시 (Vercel 자동 배포)
git push integration main
```

### 4. Vercel 배포 (자동)

- `integration` 브랜치에 push → Vercel 자동 빌드 & 배포
- 배포 상태: https://vercel.com/dashboard

**수동 배포 (필요시):**
```bash
vercel --prod
```

---

## 🛠️ 개발 워크플로우

### 급식 데이터 업데이트

```bash
# NEIS API에서 자동 스크래핑
# (매일 자정에 Firebase에 저장)

# 또는 수동 업데이트
npm run scrape:lunch
```

### 시간표 수정

**방법 1: 로컬 CSV (빠름)**
```
data/timetable.csv 수정 → 브라우저 새로고침
```

**방법 2: Firebase (관리자만)**
```
admin.js에서 CSV 파일 업로드 → 모든 사용자 실시간 동기화
```

**방법 3: config.js (기본값)**
```javascript
// js/config.js의 시간표 배열 수정
```

### 학사일정 수정

- NEIS API에서 자동 조회 (priority)
- `academic-calendar.js`에서 공휴일 추가 가능

---

## 🐛 트러블슈팅

### 문제: 급식이 나타나지 않음

**확인:**
1. 브라우저 DevTools → Network → NEIS API 호출 상태 확인
2. Firebase 콘솔에서 `lunch` 키에 데이터가 있는지 확인
3. `data/lunch.json`에 폴백 데이터가 있는지 확인
4. CSP 위반 확인 (`Console` 탭)

**해결:**
```javascript
// lunch.js의 fetch 에러 로깅 활성화
const DEBUG = true; // logger.js에서 활성화
```

### 문제: 시간표가 비어있음

**확인:**
1. NEIS API 응답 확인 (`neis-timetable.js`)
2. 로컬 CSV 파일 구조 확인 (`data/timetable.csv`)
3. Firebase 시간표 데이터 확인

**해결:**
```bash
# 로컬 CSV 사용 강제
# js/timetable.js를 직접 호출
```

### 문제: Service Worker 캐시 문제

**증상:** 새 버전이 배포되었는데 구버전이 로드됨

**해결:**
```javascript
// sw.js에서 캐시 버전 업데이트
const CACHE_VERSION = 'v6'; // v5에서 변경
```

**또는:**
```javascript
// Cache Storage 수동 삭제
if ('caches' in window) {
  caches.keys().then(names => names.forEach(n => caches.delete(n)));
}
```

### 문제: Firebase 연결 실패

**확인:**
1. DevTools → Network → Firebase 엔드포인트 상태
2. Firebase 프로젝트 상태 확인 (콘솔)
3. IP 화이트리스트 설정 확인

**해결:**
```javascript
// firebase-config.js의 설정 확인
// 또는 Firestore Rules 재설정
```

---

## 📋 CSS 관리

⚠️ **중요:** `style.css` 수정 후 **반드시** minify해야 함

```bash
# CSS 최소화
npm run minify

# 또는 수동
node build.js
```

**build.js:**
```javascript
const CleanCSS = require('clean-css');
const fs = require('fs');

const css = fs.readFileSync('style.css', 'utf8');
const minified = new CleanCSS().minify(css);
fs.writeFileSync('style.min.css', minified.styles);
```

---

## 🔄 Service Worker & PWA

### manifest.json

```json
{
  "name": "은가람 중학교 1-2반",
  "short_name": "은가람중 1-2반",
  "start_url": "/",
  "display": "standalone",
  "scope": "/",
  "background_color": "#ffffff",
  "theme_color": "#1428A0",
  "orientation": "portrait-primary",
  "icons": [...]
}
```

### Service Worker (sw.js)

- 오프라인 지원
- 애플리케이션 shell 캐싱
- 정기적 백그라운드 동기화
- 푸시 알림

**활성화:**
```javascript
// js/pwa-manager.js에서 등록
navigator.serviceWorker.register('/sw.js')
  .then(reg => console.log('SW registered'))
  .catch(err => console.error('SW registration failed', err));
```

---

## 📈 성능 & 모니터링

### Core Web Vitals

추적: `js/performance-monitor.js`

```javascript
// LCP (Largest Contentful Paint)
// FID (First Input Delay) / INP (Interaction to Next Paint)
// CLS (Cumulative Layout Shift)
```

### Google Analytics 4

이벤트:
- `page_view` — 페이지 방문
- `engagement` — 사용자 상호작용
- `user_action` — 공지 작성, 투표 등

### Sentry 에러 추적

```javascript
Sentry.captureException(error);
Sentry.captureMessage('warning message', 'warning');
```

---

## 🔑 환경 변수 & 설정

### Vercel 대시보드

**프로덕션 환경 변수:**
- Firebase API 키 (프로덕션 DB)
- GA4 Measurement ID
- Sentry DSN

**설정 파일:**
- `js/firebase-config.js` (클라이언트사이드)
- `js/analytics.js` (GA4)
- `js/error-tracking.js` (Sentry)

---

## ✅ 배포 전 체크리스트

- [ ] `npm run lint` — 에러 없음
- [ ] `npm run format:check` — 포매팅 일관성
- [ ] CSS 수정 시 `npm run minify` 실행
- [ ] 로컬 `npx http-server`에서 테스트
- [ ] 모바일 기기에서 반응형 테스트 (iPhone, Android)
- [ ] 콘솔 에러/경고 없음
- [ ] Service Worker 캐시 버전 업데이트 (필요시)
- [ ] `git pull` 으로 최신 동기화
- [ ] commit message 명확함
- [ ] `git push origin main` (원본)
- [ ] `git push integration main` (배포)

---

## 📞 알려진 이슈 & 해결 방안

### 1. CORS 문제 (NEIS API)

**증상:** `fetch failed: CORS error`

**원인:** NEIS API가 CORS 미지원

**해결:**
- Vercel rewrites로 프록시 처리
- 또는 Cors-anywhere, AllOrigins 등 CORS 프록시 사용 (현재 구현)

### 2. 모바일 주소창 깜빡임

**증상:** 스크롤 시 주소창이 나타났다 사라짐

**원인:** 모바일 브라우저 기본 동작

**해결:**
- `100dvh` (dynamic viewport height) 사용
- `viewport-fit=cover` 메타 태그

### 3. Firebase 실시간 동기화 지연

**증상:** 사용자 A가 작성한 메시지가 사용자 B에게 표시되는 데 지연

**원인:** 네트워크 지연, Firebase 대기시간

**완화:**
- 옙티미스틱 업데이트 (로컬 먼저 표시)
- 재시도 메커니즘

### 4. 자동 로그아웃 없음

**현재:** 24시간 세션 유지 (관리자 패널에만 적용)

**개선:** sessionStorage 기반 세션 타임아웃

---

## 🎓 학습 자료

- **Firebase 공식 문서:** https://firebase.google.com/docs
- **NEIS API 문서:** https://open.neis.go.kr
- **Web Vitals:** https://web.dev/vitals
- **PWA:** https://web.dev/progressive-web-apps

---

## 👨‍💻 개발자 정보

- **Lead Developer:** kang_juhyuk
- **GitHub:** https://juhyukkang2013-art.github.io/my_portfolio/

마지막 수정: 2026-04-28
