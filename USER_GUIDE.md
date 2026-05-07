# 한국DNA밸리 랜딩 페이지 운영 가이드

> 비개발자(오세흔 팀장님 / 박상호 대표님 측) 기준으로 "어디를 바꾸면 어디에 반영되는지"를 정리한 문서입니다. 코드를 직접 손대지 않더라도, 수정 요청을 주실 때 어느 위치인지 같이 알려주시면 작업 속도가 빨라집니다.

---

## 1. 사이트 구성 요약

| 항목 | 내용 |
| --- | --- |
| 호스팅 | Vercel (자동 배포) |
| 소스 저장소 | GitHub `mkt-jaehoon/DNA-VALLEY` (브랜치 `main`) |
| 프레임워크 | Vite + React (TypeScript) |
| 폼 데이터 적재 | Google Sheets (시트 ID 1aZud4gJTC0l...) |
| Node 런타임 | 24.x |

### 접속 URL (운영용)
- **메인 도메인**: https://dna-valley.vercel.app
- 보조 도메인:
  - https://dna-valley-kimjaehuns-projects-584252bd.vercel.app
  - https://dna-valley-eksska12-1611-kimjaehuns-projects-584252bd.vercel.app
- Vercel 대시보드: https://vercel.com/kimjaehuns-projects-584252bd/dna-valley
- GitHub 저장소: https://github.com/mkt-jaehoon/DNA-VALLEY

---

## 2. 페이지 구역 ↔ 코드 위치

수정을 요청하실 때 "어느 섹션"이라고 알려주시면 빠르게 반영합니다.

| 페이지에서 보이는 영역 | 파일 / 위치 |
| --- | --- |
| 상단 메뉴 (한국DNA밸리, 검사, 절차, 신청, FAQ) | `src/App.tsx` → `<nav className="site-nav">` |
| Hero 영역 (큰 제목 + 신청/전화 버튼) | `src/App.tsx` → `<section className="hero">` |
| 검사종류 카드 (현재 16종 1개) | `testTypes` 배열 |
| 가격 패널 (100,000원) | `pricingOptions` 배열 |
| 추천대상 3개 카드 | `recommendations` 배열 |
| 신청 프로세스 5단계 (📋📞📦📬✅) | `processSteps` 배열 |
| 회사 연혁 (2007~2025) | `history` 배열 |
| 인증/특허 카드 3개 | `certificates` 배열 |
| 박상호 대표 인용문 | `<blockquote>` |
| 신청 폼 | `<form className="apply-form">` |
| FAQ | `faqs` 배열 |
| 푸터 (회사명/주소/전화/이메일) | `<footer>` |
| 메인 색상/폰트/여백 | `src/styles.css` |
| 메타 설명 (검색·SNS 미리보기 글) | `index.html` `<meta name="description">` |

---

## 3. 자주 바꾸는 항목 — 위치 빠르게

### A. 전화번호
- **파일**: `src/App.tsx` 5번째 줄 부근
- **변수**: `salesPhone`
- 한 곳만 바꾸면 Hero 버튼 + 푸터 모두 동시에 반영됩니다.

### B. 이메일
- **파일**: `src/App.tsx` 6번째 줄 부근
- **변수**: `email`

### C. 푸터 회사 주소 / 사업자번호 / 대표자
- **파일**: `src/App.tsx` 맨 아래 `<footer>` 블록
- 평문 텍스트라 그대로 교체하면 됩니다.

### D. 가격
- **파일**: `src/App.tsx`
- `pricingOptions` 배열의 `price`
- 폼 라디오 버튼에도 `<b>100,000원</b>` 부분이 있으니 같이 변경 필요

### E. 검사 항목 늘리기 / 줄이기
- `testTypes`, `pricingOptions`, 신청폼 라디오 그룹, FAQ를 함께 갱신해야 일관성 유지됩니다.
- `api/submit.ts`의 `ALLOWED_TEST_TYPES` 도 같이 바꿔야 폼이 정상 제출됩니다 (검증 통과를 위해).

### F. 메인 이미지 (Hero, 배너, 연구소 사진)
- **폴더**: `public/images/`
  - `hero-mobile.webp`, `hero-desktop.webp` — 상단 배경
  - `swab-banner.webp` — 절차 섹션 배너
  - `dna-banner.webp` — 상담 안내 배너
  - `lab.webp` — 연구소 신뢰 배경
- 동일 파일명/포맷(.webp)으로 덮어쓰면 자동 반영됩니다. 새 이름이면 `src/App.tsx` 상단 import 경로도 같이 수정.

### G. 개인정보처리방침 본문
- **파일**: `public/privacy.html` (HTML 직접 수정)

---

## 4. 수정 → 배포 흐름

### 코드 변경이 일어나면 Vercel이 자동 배포합니다

1. 작업자가 GitHub `main` 브랜치에 commit + push
2. Vercel Webhook이 새 빌드 트리거 (보통 30초~2분)
3. 빌드 성공 → `dna-valley.vercel.app` 갱신
4. 빌드 실패 → 이전 배포가 그대로 유지 (사이트 안 깨짐)

### 직접 트리거하고 싶을 때
- Vercel 대시보드 → Deployments → 우측 점 메뉴 → "Redeploy"
- 또는 같은 브랜치에 빈 커밋 푸시

### 빌드 상태 확인
- https://vercel.com/kimjaehuns-projects-584252bd/dna-valley → 최상단 Deployment 카드의 상태
  - `Building` = 빌드 중
  - `Ready` = 배포 완료
  - `Error` = 실패 (로그 클릭해서 원인 확인)

---

## 5. 신청 폼 데이터 흐름

```
사용자 폼 제출
  ↓
브라우저 → POST /api/submit (Vercel 서버리스 함수)
  ↓
api/submit.ts 가 입력 검증
  ↓
Google Sheets API 로 한 줄 추가
  ↓
Google 스프레드시트(시트1) 업데이트
```

### 시트가 업데이트 안 될 때 점검 순서
1. Vercel 환경변수 확인 (`GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SPREADSHEET_ID`, `GOOGLE_SHEET_NAME`)
2. 서비스 계정이 해당 스프레드시트에 "편집자" 권한으로 공유돼 있는지 확인
3. Vercel 대시보드 → Logs 에서 `submit` 함수 에러 메시지 확인

### 시트 컬럼 순서 (A~J)
| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| 신청일자 | 문의유형 | 보호자명 | 연락처 | 이메일 | 반려견 이름 | 품종 | 희망 검사 | 주소 | 문의 내용 |

컬럼 순서를 바꾸면 `api/submit.ts` 의 append 배열 순서도 함께 수정해야 합니다.

---

## 6. 보안/주의

- `.env` / 서비스 계정 JSON 파일은 절대 GitHub에 올리지 마세요. `.gitignore`로 차단돼 있습니다.
- 서비스 계정 키가 노출되면 Google Cloud Console에서 즉시 키 회전(rotate) 필요.
- `dist/`, `node_modules/`, `.vercel/` 폴더는 git 추적 제외. Vercel이 빌드 시 자동 생성합니다.

---

## 7. 자주 묻는 트러블슈팅

| 증상 | 원인 / 해결 |
| --- | --- |
| 사이트가 옛 버전 그대로 | 브라우저 강력 새로고침 (Ctrl+Shift+R) — Vercel CDN 캐시는 보통 즉시 갱신되지만 브라우저 캐시는 남음 |
| 폼 제출 시 "전송 중 문제" 메시지 | Vercel 환경변수 누락 또는 서비스 계정 권한 문제. 5번 항목 점검 |
| Vercel 배포 Error | Vercel 대시보드 → 해당 Deployment → Logs 탭에서 에러 라인 확인 후 공유 |
| 로컬에서 `npm run build` 실패 | 프로젝트 폴더 경로에 한글 포함 시 Node native 모듈이 크래시. 영문 경로(`C:\dev\...`)로 옮기면 해결 |
| 페이지 일부 텍스트만 안 바뀜 | `dist/` 폴더는 캐시. 소스 변경(`src/App.tsx`)이 push되면 Vercel에서 다시 빌드됨 |

---

## 8. 수정 요청 템플릿 (작업자에게 넘기실 때)

```
[변경 위치] (예: 푸터 / Hero / 가격 / 검사항목 / 이미지)
[현재 내용] (스크린샷 또는 텍스트 그대로)
[변경 후 내용] (정확한 문구·번호·이메일·이미지 첨부)
[변경 이유 / 우선순위]
```

이 형식으로 주시면 누락 없이 한 번에 반영됩니다.

---

## 9. 빠른 참고: 현재 상태 (2026-05-07 기준)

- 검사 상품: **16종 1종으로 단일화** (가격 100,000원)
- 푸터 연락처: **010-5828-9130** (Hero 버튼과 동일 번호)
- 푸터 이메일: **korea91300@naver.com**
- 푸터 주소: 충청북도 청주시 오송읍 오송생명 1로 194-41 충북C&V센터 기업연구관II 504·505호
  - ⚠ 사업자등록증 원본 이미지 수령 후 정확한 주소로 재확인 필요
- 폼 제출 → Google Sheet ID `1aZud4gJTC0l...` 에 적재
