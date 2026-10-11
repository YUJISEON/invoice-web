# Development Guidelines (AI Agent 전용)

## 프로젝트 개요

- 목적: 노션 견적서를 `/quote/[token]` 링크로 비로그인 클라이언트에게 표시 + 브라우저 인쇄로 PDF 저장
- 스택: Next.js 15.5.3 (App Router, Turbopack), React 19.1, TypeScript 5, TailwindCSS v4, shadcn/ui(new-york), Zod 4, `@notionhq/client` v5
- 요구사항 기준 문서: `docs/PRD.md`. 작업 순서 기준: `docs/ROADMAP.md`
- 별도 DB·인증·자동화 테스트 러너 없음. 원본 데이터는 Notion뿐

## 디렉터리 규칙

| 경로                                     | 용도                                                        |
| ---------------------------------------- | ----------------------------------------------------------- |
| `src/app/quote/[token]/`                 | `page.tsx`, `error.tsx`, `not-found.tsx`만 둔다             |
| `src/components/quote/`                  | 견적서 전용 컴포넌트 (`quote-view`, `quote-items-table` 등) |
| `src/components/ui/`                     | shadcn 컴포넌트 전용. 비즈니스 로직 금지                    |
| `src/components/layout/`, `providers/`   | 레이아웃/프로바이더                                         |
| `src/lib/schemas/quote.ts`               | Zod 스키마 + `Quote`/`QuoteItem` 타입 (단일 출처)           |
| `src/lib/notion.ts`, `notion-mappers.ts` | 노션 클라이언트/조회, 속성 매핑 (서버 전용)                 |
| `src/lib/format.ts`, `quote-status.ts`   | 원화·날짜 포맷, 만료 판정                                   |
| `src/lib/mocks/quote.ts`                 | Phase 2 더미 픽스처. Task 013에서 사용처 제거               |
| `src/lib/env.ts`                         | 환경변수 Zod 검증 (유일한 `process.env` 접근 지점)          |
| `tasks/XXX-description.md`               | 작업 명세·테스트 결과 기록                                  |

- import 별칭은 `@/*` → `src/*` 만 사용. 상대경로(`../../`) 금지
- 파일명은 kebab-case, 컴포넌트명은 PascalCase

## 코드 표준

- Prettier 준수: 세미콜론 없음, 작은따옴표, `trailingComma: es5`, `arrowParens: avoid`, 80자
- 주석·UI 문구·문서는 **한국어**. 기능 ID를 주석에 표기 (예: `// F004`)
- 기본은 Server Component. `'use client'`는 `window.print`, `reset()`, 테마 토글 등 브라우저 API가 필요한 파일에만 추가
- 스타일은 Tailwind 유틸리티 + `cn()`(`@/lib/utils`) 사용. 인라인 style·CSS 모듈 금지
- 인쇄 대응은 `print:` 변형 사용 (`print:hidden` 등)
- `params`는 Promise: `const { token } = await params`

## 노션 연동 규칙

- 노션 호출 코드는 `src/lib/notion.ts`에만 둔다. 첫 줄에 `import 'server-only'`
- 환경변수: `NOTION_API_KEY`, `NOTION_QUOTES_DATA_SOURCE_ID`, `NOTION_ITEMS_DATA_SOURCE_ID`
  - `NEXT_PUBLIC_` 접두사 **금지**
  - 새 변수 추가 시 `src/lib/env.ts`(스키마 + parse 객체) 와 `.env.example` 을 **동시에** 수정
- 조회는 `dataSources.query` 사용 (`databases.query` 금지). `isFullPage`로 응답을 좁힌다
- 속성명·속성 타입 헬퍼는 `notion-mappers.ts` 한 곳에만 상수로 정의
- 매핑 결과는 반드시 `quoteSchema.parse`로 검증한 뒤 화면에 전달
- 토큰은 호출 전에 형식 검증(`[A-Za-z0-9_-]{16,128}`). 실패 시 노션 호출 없이 `notFound()`
- 품목은 `has_more`/`next_cursor` 페이지네이션 필수

## 오류 처리 규칙

| 상황                                        | 처리                                  |
| ------------------------------------------- | ------------------------------------- |
| 토큰 형식 불량 / 결과 0건                   | `notFound()` (동일 문구, 존재 비노출) |
| 429 / 5xx / 타임아웃 / 401 / 403 / Zod 실패 | `throw` → `error.tsx` 일반 문구       |
| 중복 토큰 2건 이상                          | 서버 로그 후 오류 처리                |

- 화면·콘솔·응답에 노출 금지: 토큰 원문, API 키, 데이터 소스 ID, 노션 속성명, ZodError 메시지, 스택, digest
- 서버 로그에 토큰은 마스킹한다
- 만료(`expiresAt` 경과)는 오류가 아님: 배너만 표시하고 조회 허용. 만료일 당일은 유효, 한국 시간 기준 서버에서 판정

## 다중 파일 동시 수정 규칙

| 변경 내용             | 함께 수정할 파일                                                                    |
| --------------------- | ----------------------------------------------------------------------------------- |
| 환경변수 추가/변경    | `src/lib/env.ts`, `.env.example`, `docs/guides/notion-api-database.md`, `README.md` |
| 노션 속성 추가/변경   | `notion-mappers.ts`, `schemas/quote.ts`, 매핑 컴포넌트, `docs/PRD.md` 데이터 모델   |
| 스키마 필드 변경      | `schemas/quote.ts`, `mocks/quote.ts`, `components/quote/*`                          |
| 페이지/폴더 구조 변경 | `docs/guides/project-structure.md`                                                  |
| Task 완료             | `docs/ROADMAP.md` (`/update-roadmap`), `tasks/XXX-*.md`                             |
| 기술 스택/명령어 변경 | `CLAUDE.md`, `README.md`                                                            |

## 워크플로우

1. `docs/ROADMAP.md`의 현재 Task 확인 (현재 우선 Task: 002)
2. `tasks/XXX-description.md` 작성 (API/로직 Task는 "## 테스트 체크리스트" 필수: 정상/경계/오류/보안·노출)
3. 구현 → Playwright MCP로 체크리스트 수행 후 결과를 작업 파일에 기록
4. `npm run check-all` + `npm run build` 통과
5. 테스트 전체 통과한 Task만 ROADMAP에 ✅ 표시

## 의사결정 기준

- 요구사항 충돌 → `docs/PRD.md` 우선
- PRD "결정 필요" 항목(합계 원본, 품목 모델링, 만료 시 금액 노출)은 임의 확정 금지. ROADMAP 표의 현재 가정을 따르고 변경 시 영향 Task를 명시
- 새 UI 컴포넌트 필요 → 먼저 `npx shadcn@latest add <name>`으로 추가 가능한지 확인 후 직접 작성
- MVP 이후 기능(견적서 생성 UI, 로그인, 서버 PDF 렌더링, 웹훅 등)은 구현하지 않는다

## 금지 사항

- 클라이언트 컴포넌트에서 `@/lib/notion` 또는 노션 SDK import
- `process.env`를 `env.ts` 밖에서 직접 읽기
- 품목 합계·금액을 Zod 검증 없이 화면에서 임의 계산
- `any`, `@ts-ignore` 사용
- 더미 토큰(`dummy-*`)을 `NODE_ENV === 'production'`에서 허용
- PDF 라이브러리 추가 (`window.print()` + `@media print` 사용)
- React Hook Form 등 폼 라이브러리 도입 (MVP는 입력 폼 없음)
- `src/components/ui/*`에 견적서 도메인 로직 추가
- 검사 미통과 상태로 완료 선언 / 테스트 전 ROADMAP ✅ 표시

## 예시

- ✅ `import { Quote } from '@/lib/schemas/quote'`
- ❌ `import { Quote } from '../../lib/schemas/quote'`
- ✅ `if (!isValidToken(token)) notFound()` 후 `getQuoteByToken(token)`
- ❌ `catch (e) { return <p>{e.message}</p> }`
