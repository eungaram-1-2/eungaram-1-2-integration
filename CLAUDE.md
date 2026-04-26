# 은가람 중학교 1-2반 통합 사이트

## 📱 배포 정보

**Vercel 배포 URL:**
```
https://eungaram-lunch-krohe8wsn-juhyukkang2013-8919s-projects.vercel.app
```

**프로젝트명:** eungaram-lunch  
**배포 상태:** ✅ READY (Production)  
**배포일:** 2026-04-19

---

## 📋 프로젝트 구조

```
index.html            메인 진입점 (모든 JS를 defer로 로드)
style.css             원본 스타일시트
style.min.css         배포용 최소화 버전 (style.css 수정 시 함께 수정)
manifest.json         PWA 매니페스트
sw.js                 Service Worker (오프라인 캐시)
build.js              CSS 최소화 빌드 스크립트
vercel.json           Vercel 배포 설정
tsconfig.json         IDE 자동완성용 (checkJs: false — 실제 타입 검사 없음)
data/
  lunch.json          급식 데이터 (NEIS API 폴백용)
  schedule.json       학사일정 로컬 백업
assets/               로고, 이미지
scripts/
  scrape-lunch.js     급식 스크래퍼 (Node.js, jsdom + node-fetch 사용)
```

---

## 🧩 JS 모듈 목록 (js/)

### 핵심 인프라
| 파일 | 역할 |
|------|------|
| `main.js` | 앱 초기화 — 모든 모듈 부트스트랩 |
| `router.js` | 해시 기반 라우팅, 긴급공지 배너 표시 |
| `db.js` | localStorage + Firebase 실시간 동기화 |
| `firebase-config.js` | Firebase 초기화 설정 |
| `config.js` | 시간표 기본값 (data/timetable.csv로 오버라이드 가능) |
| `utils.js` | 공통 유틸리티 (escapeHtml, 날짜 포매팅 등) |

### 페이지 렌더링
| 파일 | 역할 |
|------|------|
| `home.js` | 홈 페이지 (오늘 급식·시간표 요약) |
| `static-pages.js` | 정적 페이지 (공지사항, 정보, 개인정보처리방침 등) |
| `modal.js` | 전역 모달 컴포넌트 |

### 주요 기능
| 파일 | 역할 |
|------|------|
| `lunch.js` | 급식 메뉴 (NEIS API → Firebase → lunch.json 폴백) |
| `timetable.js` | 로컬 시간표 렌더링 |
| `neis-timetable.js` | NEIS API에서 시간표 실시간 조회 |
| `academic-calendar.js` | 학사일정 달력 (NEIS API + 하드코딩 공휴일) |
| `dday.js` | D-Day 카운터 |
| `chat.js` | Firebase 기반 실시간 채팅 |
| `votes.js` | 투표 기능 |
| `board` | (게시판 — router.js에 라우트 있으나 별도 처리) |
| `links.js` | 학급 바로가기 링크 모음 |
| `cleaning.js` | 청소 당번표 |
| `seat-draw.js` | 자리 뽑기 (랜덤 배치) |
| `games.js` | 미니게임 모음 |
| `map.js` | OpenStreetMap + Leaflet.js 학교 지도 |
| `suggestion.js` | 건의함/신고함 (Google Forms 연동) |
| `reactions.js` | 게시글 이모지 반응 |

### 시스템 / 관리
| 파일 | 역할 |
|------|------|
| `admin.js` | 관리자 패널 (긴급공지, 유지보수 모드, 밴/타임아웃, 로그 등) |
| `security.js` | Rate Limiter (DDoS/브루트포스 방지) |
| `notifications.js` | Web Notifications API (새 공지·게시글 알림) |
| `pwa-manager.js` | Service Worker 등록, 업데이트 배너, 설치 프롬프트 |
| `cache-manager.js` | IndexedDB 기반 API 응답 캐시 (TTL 지원) |
| `network-monitor.js` | 온라인/오프라인 상태, 배터리, 연결 속도 감지 |
| `performance-monitor.js` | Core Web Vitals 등 성능 지표 수집 |
| `analytics.js` | GA4 + Web Vitals 이벤트 전송 |
| `error-handler.js` | 전역 에러 핸들링 |
| `error-tracking.js` | Sentry 통합 에러 추적 |
| `logger.js` | 통합 로거 (레벨별 필터링) |
| `ab-testing.js` | A/B 테스팅 프레임워크 |
| `theme.js` | 다크/라이트 모드 전환 |
| `visitors.js` | 방문자 카운터 |
| `user-feedback.js` | 사용자 피드백 위젯 |

---

## 🔌 API 통합

### NEIS API
- **학사일정:** `https://open.neis.go.kr/hub/SchoolSchedule`
- **시간표:** `https://open.neis.go.kr/hub/hisTimetable`
- 학교 코드: `7692130`, 교육청 코드: `J10` (경기도)
- API 키: `ed50e755df5d42d4b94db728feab7952` (`js/academic-calendar.js`, `js/neis-timetable.js`에 하드코딩)
- 토요휴업일 이벤트는 필터링됨 (달력 가독성)

### Firebase Realtime Database
- 동기화 키: `board`, `votes`, `ddays`, `bans`, `timeouts`, `chat`, `emergency_notice`, `timetable` 등
- `js/db.js`의 `_FB_SYNC_KEYS` 배열이 동기화 대상 관리

### 급식 데이터 흐름
NEIS API → (실패 시) Firebase → (실패 시) `data/lunch.json`

---

## 📦 의존성

### dependencies (런타임)
- `jsdom` + `node-fetch` — `scripts/scrape-lunch.js` 서버사이드 스크래퍼 전용

### devDependencies
- `@playwright/test` — E2E 테스트 (`npm test`)
- `clean-css-cli` — CSS 최소화 (`npm run minify`)
- `eslint` / `prettier` — 코드 품질
- `husky` + `lint-staged` — pre-commit 훅

---

## 🔧 최근 수정 사항

### 긴급공지 X 버튼 개선 (2026-04-26)
- X 클릭 시 `sessionStorage`에 상태 저장 → 같은 세션 내 재표시 방지
- 브라우저 닫고 다시 열면 재표시 (sessionStorage 초기화)

### NEIS API 통합 (2026-04-23)
- 학사일정을 NEIS API에서 실시간 조회 (정적 JSON 대신)
- 토요휴업일 필터링, 한국 공휴일 자동 인식 및 색상 분류
- 달력 이전/다음 달 날짜 빈 칸 처리 수정

### 모바일 최적화 (2026-04-19)
- `viewport-fit=cover`, `safe-area-inset`, `100dvh` 적용

---

## 📍 GitHub Repositories

- **origin:** https://github.com/eungaram-1-2/eungaram-1-2-tt-lunch
- **integration:** https://github.com/eungaram-1-2/eungaram-1-2-integration (Vercel 자동 배포)

---

## 🚀 배포 방법

```bash
git push integration main   # GitHub → Vercel 자동 배포
# 또는
vercel --prod
```

---

## ⚙️ 주의사항

### CSS 수정
- `style.css` 수정 시 `npm run minify`로 `style.min.css`도 재생성

### 라우팅
- 새 라우트는 `router.js`의 `routes` 객체에 추가 후 렌더 함수 구현

### Firebase
- `js/firebase-config.js` 참고, 환경변수는 Vercel 대시보드에서 관리

### 데이터 소스 요약
| 기능 | 소스 |
|------|------|
| 급식 | NEIS API → Firebase → lunch.json |
| 시간표 | NEIS API (neis-timetable.js) + 로컬 (timetable.js) |
| 학사일정 | NEIS API + 하드코딩 공휴일 (academic-calendar.js) |
| 커뮤니티 | Firebase Realtime Database |

### 알려진 이슈 (수정 완료)
- 달력 이전/다음 달 날짜 이벤트 표시 → ✅ `if (!isCurrentMonth)` 빈 칸 처리
- 공휴일 노란색 표시 → ✅ `getCategoryForEvent()` 키워드 배열에 추가
- 이벤트 더보기(+N) 버튼 색상 → `var(--text-muted)` 사용 중 (의도된 동작)
