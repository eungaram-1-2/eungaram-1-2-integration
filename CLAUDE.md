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

- `index.html` - 메인 페이지
- `js/` - 자바스크립트 모듈
  - `router.js` - 라우팅 및 페이지 렌더링
  - `timetable.js` - 시간표 모듈
  - `meals.js` - 급식 모듈
  - `academic-calendar.js` - 학사일정 모듈
  - `firebase-config.js` - Firebase 설정
- `style.css` / `style.min.css` - 스타일시트
- `data/` - JSON 데이터
  - `lunch.json` - 급식 데이터
  - `schedule.json` - 학사일정 데이터 (로컬 백업용)
- `assets/` - 로고, 이미지 자산
- `vercel.json` - Vercel 배포 설정

---

## 🔌 API 통합

### NEIS API (National Education Information System)
**엔드포인트:** https://open.neis.go.kr/hub/SchoolSchedule
- 학교 코드: 7692130 (은가람중학교)
- 교육청 코드: J10 (경기도)
- API 키: `ed50e755df5d42d4b94db728feab7952` (js/academic-calendar.js 에 하드코딩)
- 조회 기간: 매년 3월~다음년 1월
- 데이터 갱신: 자동 (페이지 로드 시)

**주의:**
- 토요휴업일(토요일) 이벤트는 필터링됨 (달력 가독성)
- 공휴일 인식: 신정, 설날, 삼일절, 어린이날, 현충일, 광복절, 추석, 개천절, 한글날, 성탄절, 대체공휴일 등

---

## 🔧 최근 수정 사항

### NEIS API 통합 (2026-04-23)
- 학사일정을 NEIS API에서 실시간 조회 (정적 JSON 대신)
- 토요휴업일 필터링으로 달력 가독성 개선
- 한국 공휴일 자동 인식 및 색상 분류
- 달력 중복 날짜 표시 버그 수정 (이전/다음 달 날짜 제외)

### 모바일 최적화 (2026-04-19)
- `viewport-fit=cover` 추가 (노치폰 대응)
- `safe-area-inset` 적용 (iPhone 홈바 대응)
- `100dvh` 사용 (iOS Safari 주소창 버그 수정)
- 급식 주간 이동 버튼 모바일 한 줄 배치

### 이전 버그 수정
- `router.js`에서 미구현 `renderBoard()` 호출 제거
- BANNED_RESTRICTED, TIMEOUT_RESTRICTED 배열 정리

---

## 📍 GitHub Repositories

- **원본:** https://github.com/eungaram-1-2/eungaram-1-2-tt-lunch
- **통합 브랜치:** https://github.com/eungaram-1-2/eungaram-1-2-integration

**원격 저장소 설정:**
```bash
git remote -v
# origin: https://github.com/eungaram-1-2/eungaram-1-2-tt-lunch
# integration: https://github.com/eungaram-1-2/eungaram-1-2-integration
```

---

## 🚀 배포 방법

```bash
# Vercel CLI로 배포 (설치 필요: npm i -g vercel)
vercel --prod

# 또는 GitHub integration 브랜치에 푸시 (자동 배포)
git push integration main
```

Vercel과 GitHub(integration remote)가 연동되어 있습니다.

---

## ⚙️ 주의사항

### CSS 수정
- `style.css` 수정 시 `style.min.css`도 함께 수정 필요

### 라우팅
- 새로운 라우트는 `router.js`에 추가 후 함수 구현 필요
- 라우트 추가 형식: `routes['route-name'] = renderFunctionName`

### Firebase
- Firebase 설정은 `js/firebase-config.js` 참고
- 환경변수는 Vercel 대시보드에서 관리

### 데이터 소스
- 급식: Google Sheets API 또는 로컬 lunch.json
- 시간표: 로컬 데이터
- 학사일정: **NEIS API (실시간)** - 인터넷 연결 필수

### 자주 발생하는 버그
1. **달력에 비워진 날짜 표시 문제**
   - 이전/다음 달 날짜가 현재 달처럼 표시됨
   - 해결: `renderMonthCalendar()` 의 `if (!isCurrentMonth)` 조건 확인

2. **검정색 이벤트 박스**
   - 같은 날에 3개 이상 이벤트 시 "+N" 버튼이 어두운 색으로 표시
   - 원인: 하드코딩된 이벤트와 NEIS 이벤트가 중복되거나 너무 많음
   - 해결: `loadNeisSchedule()`에서 기존 이벤트 완전 제거 후 교체

3. **공휴일이 기본 색상(노란색)으로 표시**
   - 원인: `getCategoryForEvent()`에서 공휴일명 인식 못함
   - 해결: 한국 공휴일 키워드 배열에 추가
