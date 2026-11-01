# Task 006: PDF 다운로드 버튼과 인쇄 스타일

관련 기능: F003

## 명세

- `src/components/quote/print-button.tsx`: `use client`, 클릭 시 `window.print()`, `print:hidden`, lucide `Printer` 아이콘
- `QuoteView` 헤더 우측에 배치. `ThemeToggle`은 page.tsx에서 `print:hidden` 유지
- `src/app/globals.css`: `@page { size: A4; margin: 16mm }`, 인쇄 시 라이트 토큰으로 복원(다크여도 흰 배경), `thead { display: table-header-group }`, `tr { break-inside: avoid }`
- PDF 라이브러리는 추가하지 않음 (PRD: 브라우저 인쇄)

## 테스트 체크리스트와 결과 (2026-11-01, dev 서버 HTML·CSS 응답 확인)

| 분류      | 입력 → 기대                                                                                            | 결과                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 정상      | `dummy-valid` HTML에 "PDF 다운로드" 버튼과 `print:hidden` 존재                                         | 통과                                                                                          |
| 정상      | "PDF 다운로드" 클릭 시 `window.print` 1회 호출 (스텁)                                                  | **미수행** (Playwright MCP 연결 실패)                                                         |
| 경계      | 서빙된 CSS에 `@page`, `table-header-group`, `break-inside` 존재                                        | 통과 (규칙 존재만 확인)                                                                       |
| 경계      | `dummy-many-items` print 에뮬레이션에서 헤더 반복, 행 `break-inside: avoid`, 다크 모드 + print 흰 배경 | **미수행** (print 미디어 에뮬레이션에 브라우저 필요)                                          |
| 오류      | 해당 없음 (브라우저 인쇄 기능 의존)                                                                    | -                                                                                             |
| 보안·노출 | 화면에 렌더되는 HTML에 토큰 원문 없음                                                                  | 통과 (script 제외). RSC payload의 토큰 포함 여부는 Task 004 기록과 동일하게 Task 010에서 검토 |
| 보안·노출 | print 미디어에서 버튼·ThemeToggle이 `display: none`                                                    | **미수행** (클래스 `print:hidden` 존재만 확인)                                                |
| 정적 검사 | `npm run check-all`                                                                                    | 통과                                                                                          |

## 운영 문서 이월 (Task 017)

브라우저 인쇄의 머리글·바닥글에는 URL(토큰 포함)이 찍힐 수 있고 페이지에서 제어할 수 없다. 운영 문서에 "인쇄 대화상자에서 머리글/바닥글 옵션을 끄도록" 안내를 추가한다.

## 상태

구현 완료, 테스트 통과. ROADMAP ✅ 처리(2026-11-01).

브라우저 확인(Playwright):

- `window.print` 스텁 후 Enter 1회, 클릭 1회로 총 2회 호출됨. 포커스 링(3px 링 그림자) 적용
- print 미디어: PDF 다운로드 버튼 `display: none`, 테마 토글 래퍼 `display: none`, `thead`는 `table-header-group`, 행은 `break-inside: avoid`
- 다크 + print: `body` 배경 흰색, 글자 거의 검정
- 본문 텍스트에 토큰 원문 없음
