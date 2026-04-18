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
- `js/` - 자바스크립트 모듈 (라우터, 급식, 시간표 등)
- `style.css` / `style.min.css` - 스타일시트
- `data/` - JSON 데이터 (급식, 학사일정 등)
- `assets/` - 로고, 이미지 자산
- `vercel.json` - Vercel 배포 설정

---

## 🔧 최근 수정 사항

### 모바일 최적화 (2026-04-19)
- `viewport-fit=cover` 추가 (노치폰 대응)
- `safe-area-inset` 적용 (iPhone 홈바 대응)
- `100dvh` 사용 (iOS Safari 주소창 버그 수정)
- 급식 주간 이동 버튼 모바일 한 줄 배치

### 버그 수정
- `router.js`에서 미구현 `renderBoard()` 호출 제거
- BANNED_RESTRICTED, TIMEOUT_RESTRICTED 배열 정리

---

## 📍 GitHub Repositories

- **원본:** https://github.com/eungaram-1-2/eungaram-1-2-tt-lunch
- **통합 브랜치:** https://github.com/eungaram-1-2/eungaram-1-2-integration

---

## 🚀 배포 방법

```bash
# Vercel CLI로 배포
vercel --prod
```

Vercel과 GitHub(integration remote)가 연동되어 있습니다.

---

## ⚙️ 주의사항

- CSS 수정 시 `style.min.css`도 함께 수정 필요
- 새로운 라우트는 `router.js`에 추가 후 함수 구현 필요
- Firebase 설정은 `js/firebase-config.js` 참고
