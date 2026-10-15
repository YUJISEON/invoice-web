# invoice-web 개발 로드맵

노션에 작성한 견적서를 클라이언트가 전용 링크로 확인하고 PDF로 저장하는 견적서 웹 뷰어(MVP)

## 개요

노션으로 견적서를 관리하는 1인 사업자/프리랜서(운영자)와, 링크를 받아 로그인 없이 확인하는 클라이언트를 위한 견적서 웹 뷰어입니다. 주요 기능:

- **토큰 기반 견적서 조회** (F001): 링크의 토큰으로 노션 DB에서 견적서 1건과 품목을 서버에서 조회
- **견적서 상세 표시** (F002): 견적번호, 발행일, 유효기간, 고객 정보, 품목 표, 합계, 비고 표시
- **PDF 다운로드** (F003): 인쇄용 레이아웃 적용 후 브라우저 인쇄로 PDF 저장
- **접근 오류/만료 안내** (F004): 유효하지 않은 링크, 조회 실패, 유효기간 만료를 구분해 안내
- **노션 데이터 검증/변환** (F010): 노션 응답을 Zod로 검증하고 화면용 모델로 변환

## 진행 현황

- 전체: 2 / 18 Task 완료
- 현재 Phase: Phase 1
- 최종 업데이트: 2026-10-15

## 현재 코드 상태 (2026-10-11 확인)

| 구분        | 이미 존재                                                                                               | 아직 없음                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 라우트      | `src/app/quote/[token]/page.tsx`(토큰 앞 4자만 표시하는 placeholder), `error.tsx`, `not-found.tsx`, `/` | 견적서 본문 UI, 만료 배너, PDF 버튼                             |
| 환경변수    | `src/lib/env.ts`(Notion 3종, optional), `.env.example`                                                  | 필수값 검증, `server-only`                                      |
| 의존성      | `@notionhq/client` ^5.27, `zod` ^4.1, `next-themes`, `lucide-react`                                     | `server-only` 패키지                                            |
| UI 컴포넌트 | `button`, `card`, `badge`, `alert`, `separator`, `dropdown-menu`, `Container`, `ThemeToggle`            | 견적서 전용 컴포넌트(`src/components/quote/`), `table` 컴포넌트 |
| 데이터 계층 | -                                                                                                       | `src/lib/schemas/quote.ts`, `src/lib/notion.ts`, 매퍼, 픽스처   |
| 인쇄 스타일 | 페이지에 `print:hidden`(ThemeToggle) 1건                                                                | `@page`/인쇄 전용 레이아웃                                      |
| 테스트/검증 | `npm run check-all`(typecheck + lint + format:check)                                                    | 자동화 테스트 러너 없음 → 검증은 Playwright MCP 시나리오로 수행 |

## 개발 워크플로우

1. **작업 계획**: 코드베이스 파악 후 ROADMAP.md 갱신, 우선순위 작업은 마지막 완료 작업 다음에 삽입
2. **작업 생성**: `/tasks/XXX-description.md` 생성 (명세, 관련 파일, 수락 기준, 구현 단계, API/로직 작업은 "## 테스트 체크리스트" 필수 — 정상/경계/오류/보안 케이스와 사용할 Playwright MCP 도구 포함)
3. **작업 구현**: 명세 준수, 단계별 진행 상황 갱신
4. **테스트 수행 (필수)**: 구현 직후 Playwright MCP로 테스트 체크리스트를 모두 수행하고 결과(통과/실패, 스크린샷·콘솔·네트워크 근거)를 작업 파일에 기록. 실패 시 수정 후 재테스트하며, `npm run check-all` 및 `npm run build` 통과도 확인
5. **로드맵 갱신**: 테스트가 모두 통과한 작업만 ✅로 표시 (`/update-roadmap` 사용)

### 테스트 공통 규칙

- **완료 조건**: 구현 + 테스트 전 항목 통과 + `npm run check-all` 통과. 테스트 전이거나 실패 항목이 남아 있으면 ✅ 금지
- **분류**: 모든 테스트 묶음은 정상 / 경계 / 오류 / 보안·노출 네 가지로 구분하며, 해당 없음은 이유를 적습니다
- **형식**: `입력 → 기대 결과`. 서버 전용 동작(노션 호출 횟수, 로그 마스킹)은 dev 서버 로그로 함께 확인
- **도구**: 화면·상태는 `browser_navigate` / `browser_snapshot` / `browser_take_screenshot`, 동작은 `browser_click` / `browser_press_key` / `browser_wait_for`, 인쇄·반응형은 `browser_emulate_media` / `browser_resize`, 노출 점검은 `browser_console_messages` / `browser_network_requests` / `browser_evaluate`
- **인쇄 대화상자**: 실제 `window.print()`는 브라우저 대화상자가 자동화를 막을 수 있으므로 `browser_evaluate`로 `window.print`를 스텁해 호출 여부만 확인하고, 인쇄 레이아웃은 `browser_emulate_media`(print)로 검증
- **환경**: 개발 중에는 `npm run dev`(`http://localhost:3000`), Phase 마지막 Task에서는 `npm run build` + `npm start`(프로덕션 모드)로 동일 시나리오를 재실행

### 테스트 데이터 세트 (노션, Task 009에서 준비)

Phase 3의 모든 테스트가 사용합니다. 토큰은 서로 다른 16자 이상 랜덤 문자열을 씁니다.

| ID   | 견적서 상태                                        | 용도                                       |
| ---- | -------------------------------------------------- | ------------------------------------------ |
| T-01 | 정상(품목 5건, 비고 있음, 유효기간 미래)           | 기본 정상 케이스, 노션 원본 대조           |
| T-02 | 유효기간 만료(어제)                                | 만료 배너, 금액 노출 정책                  |
| T-03 | 유효기간 당일                                      | 만료 경계(당일은 유효)                     |
| T-04 | 비고·담당자명·발행일 비어 있음                     | null 허용 필드 처리, 섹션 숨김             |
| T-05 | 품목 0건                                           | 빈 품목 처리                               |
| T-06 | 품목 30건(25건 초과)                               | 페이지네이션(`has_more`), 다중 페이지 인쇄 |
| T-07 | 필수값 누락(견적번호 빈 값)                        | 검증 실패 → 일반 오류                      |
| T-08 | 동일 토큰을 가진 견적서 2건                        | 중복 토큰 처리                             |
| T-09 | 다른 견적서의 품목만 가진 견적서(T-01과 품목 분리) | relation 필터 정확성(품목 섞임 방지)       |

## 결정 필요 / 가정

PRD의 "가정 / 결정 필요" 항목입니다. 노션 템플릿이 확정되기 전까지 Phase 3 Task는 아래 가정으로 진행하되, 결정이 바뀌면 영향 Task를 다시 엽니다.

| 항목                        | 현재 가정                                                                                                  | 영향 Task          | 결정 시점        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------ | ---------------- |
| 노션 속성명/타입            | `docs/PRD@old.md` 가정값(토큰·견적번호·고객사명·담당자명·발행일·유효기간·비고). 실제 템플릿 미확인         | 002, 009, 010, 012 | Task 009 착수 전 |
| 품목 모델링                 | 별도 품목 DB + Relation(견적서 1 : 품목 N). 대안: 본문 표 블록, JSON 속성                                  | 002, 009, 011      | Task 009 착수 전 |
| 합계(소계/부가세/총액) 원본 | 미정. 임시로 품목 `amount` 합산을 앱에서 계산해 표시. 노션 Formula/Rollup이 원본이면 해당 값을 읽도록 변경 | 002, 004, 011, 014 | Task 002 착수 전 |
| 만료 시 금액 노출           | 배너만 표시하고 금액은 노출                                                                                | 005, 013, 014      | Task 005 착수 전 |
| 통화                        | 단일 통화 KRW                                                                                              | 004                | -                |
| 토큰 규칙                   | 노션에 수동 입력한 충분히 긴 랜덤 문자열(가이드 기준 `[A-Za-z0-9_-]{16,128}`)                              | 010, 017           | Task 010 착수 전 |

## 개발 단계

### Phase 1: 애플리케이션 골격

- **Task 001: 견적서 라우트와 오류 화면 골격, 환경변수 구조 구성** ✅ - 완료
  - ✅ `/quote/[token]` 동적 라우트(Server Component, `params` Promise) 생성
  - ✅ `error.tsx`(다시 시도 버튼), `not-found.tsx`(유효하지 않은 링크) 뼈대 생성
  - ✅ `src/lib/env.ts`에 `NOTION_API_KEY`, `NOTION_QUOTES_DATA_SOURCE_ID`, `NOTION_ITEMS_DATA_SOURCE_ID` 추가, `.env.example` 작성
  - ✅ 루트 레이아웃 `noindex` 메타데이터, 홈(`/`) 안내 화면
  - ⚠️ 테스트 근거 미기록: 파일 존재 기준으로 완료 처리됨. Task 007에서 오류 화면을, Task 008에서 라우트 전반을 Playwright MCP로 회귀 확인
  - 관련 기능: F001, F004

- **Task 002: 견적서 도메인 타입과 Zod 스키마를 정의해 화면·조회 계층의 계약 확정** ✅ - 완료
  - `src/lib/schemas/quote.ts`에 `quoteItemSchema`, `quoteSchema`, `Quote`/`QuoteItem` 타입 정의
  - 필드: token, quoteNumber, clientName, contactName(nullable), issuedAt/expiresAt(ISO, nullable), items[], memo(nullable)
  - 합계 필드 구조 확정(⚠️ 결정 필요: 합계 원본) 후 스키마에 반영
  - `src/lib/format.ts`에 원화·날짜 포맷 유틸 정의. 기대값: `1234567` → `1,234,567원`, `2026-10-11` → `2026-10-11`, `null` → `-`
  - 테스트 (구현 후 필수):
    - 정상/경계: Playwright 직접 검증 해당 없음 — 타입·스키마·순수 유틸이라 브라우저 진입점이 없음. 스키마 `parse`는 Task 003(픽스처), 포맷 유틸 출력은 Task 004(화면)에서 위 기대값으로 검증
    - 오류/보안: 해당 없음(데이터 정의 Task)
    - 정적 검사: `npm run check-all` 통과, 스키마 필수/nullable 필드가 PRD 데이터 모델과 일치
  - 관련 기능: F010, F002

### Phase 2: UI/UX 완성 (더미 데이터)

- **Task 003: 상태별 더미 견적서 픽스처를 만들어 UI 개발·검증 기반 마련** - 우선순위
  - ⚠️ 구현 완료, 테스트 일부 미수행(2026-10-15): curl로 `dummy-*` 7종 200, `dummy-broken` 500, 비더미 404, production 빌드에서 더미 토큰 404 확인. Playwright MCP 연결 실패로 오류 화면(`error.tsx`) DOM·내부 메시지 미노출 확인은 보류 → 해결 후 ✅
  - `src/lib/mocks/quote.ts`에 픽스처 정의: `dummy-valid`(정상), `dummy-expired`(어제 만료), `dummy-expires-today`(당일), `dummy-no-expiry`(유효기간 null), `dummy-no-memo`(비고·담당자 없음), `dummy-many-items`(20건), `dummy-long-text`(긴 텍스트), `dummy-broken`(스키마 위반)
  - 더미 토큰 진입은 `NODE_ENV !== 'production'`에서만 허용하고 Phase 3에서 제거 대상임을 `TODO`로 표기
  - 테스트 (Playwright MCP, 구현 후 필수):
    - 정상: `/quote/dummy-valid` 접속 → 200, 페이지에 견적번호 표시(`browser_navigate`, `browser_snapshot`)
    - 경계: 유효한 픽스처 7종이 `quoteSchema.parse`를 통과해 각 토큰 접속 시 화면이 렌더됨(오류 화면 아님)
    - 오류: `/quote/dummy-broken` → 일반 오류 화면(`error.tsx`) 표시, 내부 메시지 미노출
    - 보안/노출: `npm run build` 후 `npm start`에서 `/quote/dummy-valid` → 404 화면(`browser_network_requests`로 상태 코드 확인)
    - 정적 검사: `npm run check-all` 통과
  - 관련 기능: F002, F004, F010

- **Task 004: 견적서 상세 화면 컴포넌트를 구현해 클라이언트가 확인할 핵심 내용 표시**
  - `src/components/quote/quote-view.tsx`: 견적번호·발행일·유효기간 헤더, 고객사/담당자 블록
  - `src/components/quote/quote-items-table.tsx`: 품목명·수량·단가·금액 표, 숫자 우측 정렬, KRW 포맷(Task 002 유틸)
  - 합계 영역(Task 002 결정 반영)과 비고 섹션(값이 없으면 섹션 자체 숨김)
  - shadcn `table` 컴포넌트 추가(`npx shadcn@latest add table`), 파일명 kebab-case/컴포넌트 PascalCase 준수, placeholder의 토큰 표시 제거
  - 테스트 (Playwright MCP, 구현 후 필수):
    - 정상: `/quote/dummy-valid` → 견적번호·발행일·유효기간·고객사·담당자·품목 행·합계가 픽스처 값과 일치(`browser_snapshot`), 금액이 `1,234,567원` 형식
    - 경계: `dummy-no-memo` → 비고 섹션이 DOM에 없음, 담당자명 자리에 `-` / `dummy-many-items` → 품목 행 20개 / `dummy-long-text` → `browser_evaluate`로 `scrollWidth <= clientWidth`(가로 넘침 없음) / 금액 0원·큰 금액(10자리) 포맷 확인
    - 오류: 해당 없음(표시 전용 컴포넌트, 오류 경로는 Task 007)
    - 보안/노출: 화면 어디에도 URL 토큰 원문이 표시되지 않음(`browser_snapshot` 텍스트 검색)
    - 정적 검사: `npm run check-all` 통과
  - 관련 기능: F002

- **Task 005: 유효기간 만료 판정과 안내 배너를 구현해 만료 견적서 상태 구분**
  - `src/lib/quote-status.ts`: `isExpired(expiresAt, now)`(한국 시간 기준 날짜 비교, 만료일 당일은 유효) 구현
  - `src/components/quote/expired-banner.tsx`: shadcn `Alert` 기반 상단 배너, 조회는 허용
  - 인쇄 시에도 만료 배너가 출력에 포함되는지 결정 후 반영
  - ⚠️ 결정 필요: 만료 시 금액 노출 여부(현재 가정: 노출)
  - 테스트 (Playwright MCP, 구현 후 필수):
    - 정상: `dummy-valid`(유효기간 미래) → 만료 배너 없음
    - 경계: `dummy-expires-today` → 배너 없음(당일 유효) / `dummy-expired`(어제) → 배너 표시 / `dummy-no-expiry`(null) → 배너 없음
    - 오류: 날짜 형식 불량은 스키마 단계(Task 012)에서 처리하므로 해당 없음. 만료 판정은 서버에서 수행되므로 클라이언트 시간대와 무관함을 확인
    - 보안/노출: `dummy-expired`에서 금액 노출 정책(가정: 노출)이 결정과 일치, 인쇄 미리보기(`browser_emulate_media` print)에서 배너 포함 여부가 결정과 일치
    - 정적 검사: `npm run check-all` 통과
  - 관련 기능: F004

- **Task 006: PDF 다운로드 버튼과 인쇄 전용 스타일을 구현해 브라우저 인쇄로 PDF 저장 지원**
  - `src/components/quote/print-button.tsx`(Client Component): `window.print()` 호출, `lucide-react` 아이콘
  - 인쇄 시 버튼·ThemeToggle 등 UI 숨김(`print:hidden`), 다크 테마여도 흰 배경/검정 글자로 출력
  - `globals.css`에 `@page { size: A4; margin }` 및 표 행 `break-inside: avoid`, 긴 표의 헤더 반복 처리
  - 테스트 (Playwright MCP, 구현 후 필수):
    - 정상: `browser_evaluate`로 `window.print`를 스텁 후 "PDF 다운로드" 클릭(`browser_click`) → 스텁 1회 호출
    - 경계: `dummy-many-items`를 `browser_emulate_media`(media=print)로 확인 → 표 헤더가 `table-header-group`, 행이 `break-inside: avoid`(`getComputedStyle`) / 다크 모드 + print → 배경 흰색·글자 어두운색
    - 오류: 해당 없음(브라우저 인쇄 기능 의존, 앱 오류 경로 없음)
    - 보안/노출: print 미디어에서 "PDF 다운로드" 버튼·ThemeToggle이 `display: none`, 본문에 토큰 미표시. 브라우저 머리글/바닥글의 URL(토큰 포함) 인쇄는 페이지에서 제어 불가이므로 Task 017 운영 문서에 안내 항목 추가
    - 정적 검사: `npm run check-all` 통과
  - 관련 기능: F003

- **Task 007: 오류 안내 화면을 완성해 원인별 안내와 다시 시도 동선 제공**
  - `not-found.tsx`: 토큰 없음/형식 불량 문구, 견적서 존재 여부 비노출
  - `error.tsx`: 일시 오류 문구와 "다시 시도" 버튼(`reset()` + `router.refresh()`로 서버 재조회), 내부 오류 메시지·digest 비노출
  - 오류 화면 공통 레이아웃 컴포넌트로 중복 제거
  - `/quote`(토큰 없음) 경로의 404 처리 확인
  - 테스트 (Playwright MCP, 구현 후 필수):
    - 정상: 해당 없음(오류 화면 전용). 대신 회귀: `/quote/dummy-valid`가 오류 화면 변경 후에도 정상 표시
    - 경계: `/quote`(토큰 없음) → 404 / `/quote/` 뒤 매우 긴 문자열(500자) → 404, 서버 오류 없음
    - 오류: 더미 외 토큰 `/quote/nonexistent` → 404 + "유효하지 않은 링크입니다"(`browser_network_requests`로 404 확인) / `dummy-broken` → "견적서를 불러오지 못했습니다" + "다시 시도" 클릭(`browser_click`) 후 화면이 멈추지 않고 재조회됨
    - 보안/노출: 오류 화면 DOM·콘솔(`browser_console_messages`)에 스택, digest, ZodError 메시지, 속성명 없음 / 404 응답에서 "존재하지 않음"과 "형식 불량"이 동일 문구
    - 회귀: Task 001(라우트·오류 화면 골격)
    - 정적 검사: `npm run check-all` 통과
  - 관련 기능: F004, F010

- **Task 008: 반응형·접근성을 점검하고 Playwright MCP로 화면 상태별 시각 검증**
  - 모바일(375px)/태블릿(768px)/데스크톱(1280px)에서 품목 표 가로 넘침 없음 확인(필요 시 가로 스크롤 컨테이너)
  - 시맨틱 마크업(`main`, `h1`~, `table` 헤더 `scope`), 버튼 포커스 링, 색 대비 확인
  - 라이트/다크 테마 양쪽 확인
  - 테스트 (Playwright MCP, 구현 후 필수):
    - 정상: 3개 뷰포트(`browser_resize`)에서 `dummy-valid` 스크린샷(`browser_take_screenshot`) 확인, 라이트/다크(`browser_emulate_media`) 각각
    - 경계: `dummy-many-items`·`dummy-long-text`에서 375px 가로 스크롤이 문서 전체가 아닌 표 컨테이너에만 발생(`browser_evaluate`), print 미리보기 스크린샷
    - 오류: `dummy-broken`·`/quote/nonexistent` 화면이 모바일에서도 깨지지 않음
    - 보안/노출: 해당 없음(시각·접근성 점검)
    - 접근성: 키보드 Tab 이동(`browser_press_key`)으로 "PDF 다운로드"·"다시 시도" 버튼에 포커스가 가고 Enter로 동작, `browser_snapshot`의 접근성 트리에서 heading 순서·표 헤더 확인
    - 회귀: Task 003~007 시나리오 전체 재실행
    - Phase 완료: `npm run check-all`, `npm run build` 통과
  - 관련 기능: F002, F003, F004

### Phase 3: 핵심 기능 구현

- **Task 009: 노션 클라이언트와 속성 매핑 계층을 구성하고 테스트 데이터 세트 준비**
  - ⚠️ 결정 필요: 속성명/타입, 품목 모델링 방식(실제 노션 템플릿 확인 후 확정)
  - `npm i server-only` 후 `src/lib/notion.ts`에 `import 'server-only'`, `Client`(`timeoutMs`, `retry`, `notionVersion` 명시) 구성
  - `src/lib/notion-mappers.ts`: 속성 타입별 헬퍼(title/rich_text/number/date/formula)와 속성명 상수 한 곳에 집중
  - `env.ts`에서 Notion 3종을 서버 런타임 필수값으로 전환(누락 시 명확한 설정 오류), `NEXT_PUBLIC_` 접두사 사용 금지
  - 노션에 위 "테스트 데이터 세트"(T-01~T-09)를 작성하고 Integration에 공유
  - 테스트 (Playwright MCP, 구현 후 필수):
    - 정상: 올바른 환경변수로 dev 서버 기동 후 `/` 접속 → 정상 렌더(설정 검증이 기동을 막지 않음)
    - 경계: 속성 타입이 가정과 다른 경우(예: 토큰 속성이 select) → 일반 오류 화면, 서버 로그에 어느 속성이 문제인지 기록
    - 오류: `NOTION_API_KEY` 누락·잘못된 값(401) → 일반 오류 화면, "다시 시도" 노출 / 데이터 소스 ID 누락 → 일반 오류 화면
    - 보안/노출: `npm run build` 산출물(`.next/static`)에 API 키 문자열 없음 / 오류 화면·네트워크 응답(`browser_network_requests`)·콘솔에 키·ID 비노출
    - 정적 검사: `npm run check-all` 통과
  - 관련 기능: F001, F010

- **Task 010: 토큰으로 견적서 1건을 조회하는 `getQuoteByToken`을 구현**
  - 토큰 형식 사전 검증(길이·허용 문자) 실패 시 노션 호출 없이 `null` 반환
  - `dataSources.query`에 토큰 속성 `equals` 필터, `page_size: 2`로 조회해 0건 → `null`, 2건 이상(중복 토큰) → 서버 로그 후 오류 처리
  - `isFullPage`로 응답 좁히기, 견적서 속성을 `Quote` 원본 객체로 매핑
  - 테스트 (Playwright MCP, 구현 후 필수 / 데이터: T-01, T-08):
    - 정상: T-01 토큰 접속 → 견적번호·고객사명·발행일·유효기간이 노션 원본과 일치(`browser_snapshot`)
    - 경계: 토큰 길이 15자 / 16자 / 128자 / 129자 → 15·129자는 404 + dev 서버 로그상 노션 호출 0회, 16·128자는 형식 통과 후 조회 / 대소문자만 다른 토큰 → 404
    - 오류: 형식은 맞지만 없는 토큰 → 404, 문구가 형식 불량 토큰과 동일 / T-08(중복 토큰) → 일반 오류 화면 + 서버 로그에 중복 기록 / 데이터 소스 ID를 잘못 설정 → 일반 오류 화면
    - 보안/노출: `../`, `%00`, 공백, `'; --`, 특수문자 토큰 → 404, 노션 호출 0회 / 응답·콘솔·서버 로그에 토큰 원문 미노출
    - 회귀: Task 007(오류 화면), Task 004(화면 표시)
    - 정적 검사: `npm run check-all` 통과
  - 관련 기능: F001

- **Task 011: 견적 품목 조회와 합계 계산을 구현해 품목 표 데이터 완성**
  - ⚠️ 결정 필요: 합계 원본(노션 Formula/Rollup vs 앱 계산)
  - 품목 DB를 `relation contains page_id` 필터로 `dataSources.query`, `has_more`/`next_cursor` 페이지네이션 처리
  - 수량·단가·금액 매핑(금액이 Formula면 `formula.number` 추출), 정렬 기준 명시
  - 합계는 결정된 방식으로 계산하고, 노션 값과 일치함을 샘플 견적서로 대조
  - 테스트 (Playwright MCP, 구현 후 필수 / 데이터: T-01, T-05, T-06, T-09):
    - 정상: T-01 → 품목 5행의 품목명·수량·단가·금액이 노션 원본과 일치, 화면 합계 = 노션 값(또는 결정된 계산식)
    - 경계: T-05(0건) → 빈 품목 안내와 합계 0원 / 품목 1건 / T-06(30건) → 30행 모두 표시, 정렬 순서 유지 / 소수 수량, 10자리 금액 / 금액 Formula가 비어 있는 행 처리
    - 오류: 품목 DB ID 오설정·미공유 → 견적서 본문만 일부 표시하지 않고 전체 일반 오류 화면
    - 보안/노출: T-01과 T-09 비교 → 서로의 품목이 섞이지 않음 / 품목 DB ID가 화면·응답에 비노출
    - 회귀: Task 010 시나리오(조회 정상/404)
    - 정적 검사: `npm run check-all` 통과
  - 관련 기능: F001, F002

- **Task 012: Zod 검증·변환과 오류 매핑을 구현해 노션 응답을 안전한 화면 모델로 변환**
  - 매핑 결과를 `quoteSchema.parse`로 검증, 실패 시 서버에만 상세 로그(토큰·원본 body 마스킹) 후 일반 오류로 전환
  - 오류 매핑을 별도 함수로 분리: 결과 없음/형식 불량 → `notFound()`, 429/5xx/타임아웃 → `error.tsx`, 401/403/object_not_found → 서버 로그 + 일반 오류, ZodError → 일반 오류
  - 필수값 누락(견적번호 빈 값 등)·타입 불일치 케이스 처리, null 허용 필드(비고·담당자명·발행일)는 빈 값 허용
  - 테스트 (Playwright MCP, 구현 후 필수 / 데이터: T-01, T-04, T-07):
    - 정상: T-01 → 모든 필드 표시
    - 경계: T-04(비고·담당자명·발행일 비어 있음) → 오류 없이 표시, 비고 섹션 숨김, 빈 필드 `-`
    - 오류: T-07(견적번호 빈 값) → 일반 오류 화면 + 서버 로그에 검증 실패 기록 / 429·5xx·응답 지연 → 로컬 목 서버를 SDK `baseUrl` 옵션(지원 여부 확인)으로 지정해 재현, "다시 시도" 클릭 후 복구 시 정상 표시
    - 보안/노출: 오류 화면·콘솔·네트워크 응답에 ZodError 메시지·노션 속성명·원본 body 없음 / 서버 로그의 토큰 마스킹
    - 회귀: Task 010, 011 시나리오
    - 정적 검사: `npm run check-all` 통과
  - 관련 기능: F010, F004

- **Task 013: 견적서 페이지에 실제 데이터를 연결하고 더미 경로를 제거**
  - `page.tsx`에서 `getQuoteByToken` → `notFound()` / `QuoteView` 렌더, 만료 시 배너 표시
  - Task 003의 더미 토큰 진입과 `src/lib/mocks` 사용처 제거(픽스처는 테스트 참고용으로만 유지 여부 결정)
  - `export const dynamic = 'force-dynamic'`로 매 요청 조회(PRD 결정과 일치), 응답이 검색 노출·캐시되지 않도록 확인
  - 테스트 (Playwright MCP, 구현 후 필수 / 데이터: T-01, T-02, T-03):
    - 정상: T-01 접속 → 실제 데이터 표시, "PDF 다운로드" 동작(`window.print` 스텁)
    - 경계: T-03(당일) → 배너 없음, T-02(어제) → 배너 / 노션에서 T-01 품목명을 수정 후 새로고침 → 즉시 반영(`force-dynamic`)
    - 오류: `/quote/dummy-valid` → 404(더미 경로 제거 확인)
    - 보안/노출: 응답에 `noindex`(메타 또는 `X-Robots-Tag`) 포함, 캐시 헤더 확인(`browser_network_requests`)
    - 회귀: Task 004~008 시나리오를 실제 데이터로 재실행
    - 정적 검사: `npm run check-all`, `npm run build` 통과
  - 관련 기능: F001, F002, F004, F010

- **Task 014: Playwright MCP로 전체 사용자 여정과 엣지 케이스를 프로덕션 모드에서 통합 검증**
  - `npm run build` + `npm start`(프로덕션 모드)에서 아래 시나리오를 모두 수행하고 결과를 `/tasks/014-*.md`에 기록
  - 테스트 (Playwright MCP, 필수):
    - 정상: T-01 링크 접속 → 내용 표시 → "PDF 다운로드" 클릭(`window.print` 스텁 호출 확인) → print 미리보기에서 UI 숨김 / 노션 원본과 화면 값 대조(견적번호·품목·합계)로 "원본과 100% 일치" 확인
    - 경계: T-02(만료) 배너 + 조회 허용 + 금액 노출 정책 일치 / T-03 당일 / T-04 빈 값 / T-05 품목 0건 / T-06 30건 + 다중 페이지 print
    - 오류: 토큰 불량(짧음·특수문자), 미존재 토큰 → 404 / 잘못된 API 키·데이터 소스 ID → 일반 오류 + "다시 시도" / T-07 검증 실패 → 일반 오류 / T-08 중복 토큰 → 일반 오류
    - 보안/노출: 모든 오류 화면에서 토큰·키·내부 구조 비노출(`browser_console_messages`, `browser_network_requests`), 더미 토큰 404
    - 반응형: 375px에서 T-01, T-06 확인
    - 정적 검사: `npm run check-all`, `npm run build` 통과
  - 관련 기능: F001, F002, F003, F004, F010

### Phase 4: 마무리 및 배포

- **Task 015: 보안 점검으로 토큰·키 노출 경로 차단**
  - `NOTION_API_KEY`가 클라이언트 번들·HTML·오류 응답·로그에 노출되지 않는지 `next build` 산출물과 네트워크 응답으로 확인
  - 링크 토큰이 서버 로그·오류 메시지에 평문으로 남지 않는지 확인
  - `robots`/`noindex`, 응답 헤더(캐시, `Referrer-Policy`) 점검
  - 토큰 열거 시도로 인한 레이트 리밋 소진 위험을 평가하고 대응 필요 여부를 기록(미들웨어 보호는 MVP 이후 후보)
  - 테스트 (Playwright MCP, 구현 후 필수):
    - 정상: 프로덕션 모드에서 T-01 접속 → `browser_network_requests`로 확인한 요청 중 노션 API 직접 호출·키 포함 요청 0건
    - 경계: 브라우저 소스(`browser_evaluate`로 `document.documentElement.outerHTML`·로드된 스크립트 URL)에 키·데이터 소스 ID 문자열 없음
    - 오류: 노션 장애 상황(잘못된 키)에서 응답 본문·헤더·콘솔에 원본 에러 body 없음
    - 보안/노출: 응답 헤더에 `Referrer-Policy`, `noindex` 확인 / `/quote/<무작위 토큰>` 20회 연속 시도 시 서버 동작(404 유지, 서버 오류 없음)과 노션 호출 수를 기록해 위험도 평가
    - 정적 검사: `npm run check-all`, `npm run build` 통과
  - 관련 기능: F001, F004

- **Task 016: 성능·호출 비용을 점검해 응답 지연과 레이트 리밋 위험 완화**
  - 견적서 1건당 노션 호출 수(견적 1 + 품목 N 페이지) 측정, 타임아웃·재시도 값 검토
  - `force-dynamic` 유지 여부 판단, 트래픽 증가 시 `unstable_cache`(revalidate 60초 미만, 파일 URL 만료 고려) 도입 기준 문서화
  - 대기 상태 UI(`loading.tsx`) 필요 여부 검토
  - 테스트 (Playwright MCP, 구현 후 필수):
    - 정상: T-01 접속 응답 시간 5회 측정(`browser_network_requests`의 문서 요청 소요 시간 또는 `browser_evaluate`의 `performance.getEntriesByType('navigation')`) → 평균·최대값 기록
    - 경계: T-06(30건)에서 노션 호출 수가 예상(견적 1 + 품목 2회)과 일치(서버 로그)
    - 오류: 응답 지연 목 서버로 `timeoutMs` 초과 시 → 대기 후 일반 오류 화면, 무한 로딩 없음
    - 보안/노출: 해당 없음(성능 점검)
    - 정적 검사: `npm run check-all`, `npm run build` 통과
  - 관련 기능: F001

- **Task 017: 운영 문서를 정리해 노션 템플릿과 링크 발급 절차 고정**
  - 노션 설정 체크리스트 최신화(Integration 생성, DB 공유, 속성명·타입, 품목 DB 연결)
  - 토큰 생성·교체(유출 시 폐기) 규칙 문서화, 인쇄 시 브라우저 머리글/바닥글에 URL이 포함될 수 있다는 안내
  - `docs/guides/notion-api-database.md`의 환경변수명(`NOTION_DATA_SOURCE_ID`)을 실제 코드(`NOTION_QUOTES_DATA_SOURCE_ID`, `NOTION_ITEMS_DATA_SOURCE_ID`)와 일치시킴
  - README와 `.env.example` 갱신, 확정된 결정 사항을 PRD 가정 항목에 반영
  - 테스트 (Playwright MCP, 구현 후 필수 — 문서 재현성 검증):
    - 정상: 갱신된 문서의 체크리스트만 따라 새 견적서 1건을 작성 → 발급한 링크로 접속 시 정상 표시(`browser_navigate`, `browser_snapshot`)
    - 경계/오류: 문서 지침대로 토큰 교체 후 이전 링크 → 404, 새 링크 → 정상
    - 보안/노출: 문서·`.env.example`에 실제 키·토큰 값이 없음(검색 확인)
    - 정적 검사: `npm run check-all`(문서 포맷 포함) 통과
  - 관련 기능: F001, F010

- **Task 018: Vercel에 배포하고 실제 링크로 운영 점검**
  - Vercel 환경변수(Notion 3종) 등록, `npm run check-all` 및 `npm run build` 통과 확인
  - 프로덕션 URL에서 테스트 견적서 링크 접속·PDF 저장(Chrome/Safari/모바일) 확인
  - 오류 화면(잘못된 토큰, 일시 오류) 프로덕션 동작 확인
  - 테스트 (Playwright MCP, 구현 후 필수 / 대상: 프로덕션 URL):
    - 정상: T-01 링크 → 내용 표시, "PDF 다운로드" 동작, 노션 원본 대조
    - 경계: T-02 만료 배너, T-06 30건 표시, 375px 뷰포트
    - 오류: 잘못된 토큰 → 404, 오류 화면에서 내부 정보 비노출
    - 보안/노출: 프로덕션 응답·콘솔에 키·토큰 비노출, `noindex` 헤더, 더미 토큰 404
    - 수동 확인(Playwright MCP 범위 밖, Chromium 전용): Safari·모바일 실기기에서 실제 인쇄 → PDF 저장 결과 확인
    - 회귀: Task 014 시나리오 전체를 프로덕션 URL로 재실행
  - 관련 기능: F001, F002, F003, F004

## 기능 추적 매트릭스

| 기능 ID | 기능명                | 구현 Task               | 테스트 Task                       |
| ------- | --------------------- | ----------------------- | --------------------------------- |
| F001    | 토큰 기반 견적서 조회 | 001, 009, 010, 011, 013 | 009, 010, 011, 013, 014, 015, 018 |
| F002    | 견적서 상세 표시      | 002, 003, 004, 011, 013 | 003, 004, 008, 011, 014, 018      |
| F003    | PDF 다운로드          | 006                     | 006, 008, 014, 018                |
| F004    | 접근 오류/만료 안내   | 001, 005, 007, 012      | 005, 007, 008, 012, 013, 014      |
| F010    | 노션 데이터 검증/변환 | 002, 009, 012           | 003, 009, 012, 014                |

## MVP 이후 (범위 밖)

- 앱 내 견적서 생성/수정, 운영자용 링크·토큰 발급 UI
- 클라이언트 로그인, 견적서 목록/대시보드
- 전자서명, 승인/거절, 온라인 결제
- 다중 통화, 노션 웹훅 실시간 동기화
- 서버 사이드 PDF 렌더링, 열람 여부 추적
