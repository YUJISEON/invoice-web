# Task 004: 견적서 상세 화면 컴포넌트

관련 기능: F002

## 명세

- `src/components/ui/table.tsx`: shadcn table (`npx shadcn@latest add table`, 생성된 깨진 `cn` import를 `@/lib/utils`로 수정, 불필요한 `use client` 제거)
- `src/components/quote/quote-items-table.tsx`: 품목 표, 숫자 열 우측 정렬, `th scope="col"`, 가로 스크롤 컨테이너, 품목 0건 안내 행
- `src/components/quote/quote-view.tsx`: 헤더(견적번호·발행일·유효기간), 고객 정보, 품목 표, 합계(`quote.total`을 `formatKRW`로 표시, 화면에서 계산하지 않음), 비고(없으면 섹션 미렌더)
- `src/app/quote/[token]/page.tsx`: placeholder를 `QuoteView`로 교체, 토큰 표시 제거

## 테스트 체크리스트와 결과 (2026-11-01, dev 서버 HTML 응답 확인)

| 분류      | 입력 → 기대                                                           | 결과                                                                                                                                                                                                         |
| --------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 정상      | `dummy-valid` → 견적번호, `1,234,567원` 형식 금액, 품목 행, 합계 표시 | 통과                                                                                                                                                                                                         |
| 경계      | `dummy-no-memo` → 비고 섹션 없음, 담당자 `-`                          | 통과                                                                                                                                                                                                         |
| 경계      | `dummy-many-items` → 품목 행 20개                                     | 통과 (`tr` 21개 = 헤더 1 + 품목 20)                                                                                                                                                                          |
| 경계      | `dummy-long-text` → `scrollWidth <= clientWidth`                      | **미수행** (브라우저 필요, Playwright MCP 연결 실패). `overflow-x-auto`·`break-words` 클래스 존재만 확인                                                                                                     |
| 오류      | 해당 없음 (표시 전용, 오류 경로는 Task 007)                           | -                                                                                                                                                                                                            |
| 보안·노출 | 화면에 표시되는 본문에 토큰 원문 없음                                 | 통과 (화면 렌더 기준). 단, 응답 전체의 RSC payload에는 URL 경로와 dev 모드 디버그 payload로 토큰이 포함됨. production 응답의 `props.quote.token` 포함 여부는 Task 010에서 `Quote`의 `token` 제외와 함께 검토 |
| 정적 검사 | `npm run check-all`, `npm run build`                                  | 통과                                                                                                                                                                                                         |

## 상태

구현 완료, 테스트 통과. ROADMAP ✅ 처리(2026-11-01).

- 브라우저 확인(Playwright): `dummy-long-text`가 1280px에서 문서 `scrollWidth`(1265) = `clientWidth`(1265)로 가로 넘침 없음, 375px에서도 넘침 없고 긴 품목명은 줄바꿈, 10자리 금액 `9,999,999,999원` 표시
- 본문 텍스트(`innerText`)에 URL 토큰 원문 없음
- 구현 후 개선: 375px에서 단가·금액이 화면 밖으로 밀리던 문제를 해결(`sm` 미만은 품목별 리스트, `sm` 이상은 표, 인쇄는 표)과 요약 카드 적용
