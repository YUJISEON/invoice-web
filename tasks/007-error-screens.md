# Task 007: 오류 안내 화면 완성

관련 기능: F004, F010

## 명세

- `src/components/quote/quote-error-layout.tsx`: `error.tsx`와 `not-found.tsx`의 중복 레이아웃을 공통화
- `not-found.tsx`: 토큰 없음·형식 불량·존재하지 않음 모두 같은 문구("유효하지 않은 링크입니다")
- `error.tsx`: 일시 오류 문구와 "다시 시도" 버튼. `startTransition`으로 `router.refresh()` 후 `reset()`을 호출해 서버에서 재조회. `error.message`·digest는 출력하지 않음

## 테스트 체크리스트와 결과 (2026-11-01, dev 서버 응답 확인)

| 분류       | 입력 → 기대                                                                        | 결과                                                             |
| ---------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 정상(회귀) | `/quote/dummy-valid` → 200, 견적서 정상 표시                                       | 통과                                                             |
| 경계       | `/quote`(토큰 없음) → 404                                                          | 통과(404). 단 Next 기본 영문 404 화면이 표시됨(아래 참고)        |
| 경계       | `/quote/` + 500자 토큰 → 404, 서버 오류 없음                                       | 통과                                                             |
| 오류       | `/quote/nonexistent` → 404                                                         | 통과                                                             |
| 오류       | `/quote/dummy-broken` → 500                                                        | 통과(상태 코드). 응답의 보이는 HTML에 내부 정보 없음             |
| 오류       | `dummy-broken`에서 "견적서를 불러오지 못했습니다" 표시, "다시 시도" 클릭 후 재조회 | **미수행** (Playwright MCP 연결 실패, 클라이언트 렌더·클릭 필요) |
| 보안·노출  | 404 문구가 존재하지 않음/형식 불량에서 동일                                        | 통과 (같은 `not-found.tsx` 사용)                                 |
| 보안·노출  | 오류 화면 DOM·콘솔에 스택, digest, ZodError 메시지, 속성명 없음                    | **미수행** (브라우저 필요)                                       |
| 정적 검사  | `npm run check-all`                                                                | 통과                                                             |

## 확인된 사항 / 후속 결정 필요

- `/quote`(토큰 없음)는 `[token]` 세그먼트 밖이라 Next 기본 영문 404가 나왔다. 해결(2026-11-01): `src/app/not-found.tsx`를 추가해 같은 `QuoteErrorLayout`과 문구를 쓰도록 했고 `docs/guides/project-structure.md`를 갱신했다. Playwright로 `/quote`가 404 상태와 "유효하지 않은 링크입니다" 화면으로 표시됨을 확인했다.

## 상태

구현 완료. ROADMAP ✅ 처리(2026-11-01). 이월했던 **production 콘솔 노출 확인은 Task 012에서 해소**됨: production 오류 화면 콘솔에는 일반 메시지 한 줄뿐이고 ZodError·속성명 없음(`tasks/012-validation-errors.md` 참고).

브라우저 확인(Playwright):

- 통과: `dummy-broken` 오류 화면 DOM에 ZodError·속성명·digest 없음, "다시 시도"(클릭·키보드 Enter 모두)가 서버 재조회(`?_rsc=` 요청)를 보내고 화면이 멈추지 않음, 375px에서 가로 넘침 없음
- **미통과**: 개발 모드 브라우저 콘솔에 ZodError 상세(`quoteNumber`, `items[0].name`, `items[0].quantity` 경로)가 출력됨. Next 개발 모드가 서버 오류를 클라이언트로 전달하는 동작으로 추정되나 production에서의 확인이 필요함
- 해소 방법: 더미 토큰은 production에서 404라 재현할 수 없으므로, Task 012(실제 검증 실패 T-07) 또는 Task 014에서 production 빌드의 콘솔·네트워크 응답에 ZodError·속성명이 없는지 확인한 뒤 ✅
- 참고: 개발 모드에서는 Tab 순서에 Next 오버레이(`nextjs-portal`)가 끼어들어 "다시 시도"에 곧바로 포커스되지 않음. production에서는 해당 없음
