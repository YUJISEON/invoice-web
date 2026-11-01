# Task 013: 견적서 페이지 실데이터 연결과 더미 경로 제거

관련 기능: F001, F002, F004, F010

## 명세

- `src/app/quote/[token]/page.tsx`: `getQuoteByToken` 결과가 없으면 `notFound()`, 있으면 `QuoteView` 렌더. `export const dynamic = 'force-dynamic'`으로 매 요청 조회
- 더미 경로 제거: `getMockQuote` 폴백과 `src/lib/mocks/quote.ts`(픽스처)를 **삭제**(결정: 실데이터로 대체되어 사용처가 없고, 이력은 git에 남음)
- 문서 갱신: `docs/guides/project-structure.md`(lib 트리), `shrimp-rules.md`(디렉터리·동시 수정 표, 금지 사항), ROADMAP "현재 코드 상태" 표

## 테스트 결과 (2026-11-01)

노션에 임시 견적서(`TEMP-I`, 유효기간 오늘)와 품목 1건을 추가해 확인하고 삭제했다. 원래 데이터(`INV-2026-001`, 품목 3건)는 변경하지 않았다.

| 분류      | 입력 → 기대                                                                                                 | 결과                                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 정상      | T-01 실제 토큰 → 실제 데이터 표시                                                                           | 통과 (dev·production. `INV-2026-001`, 품목 3건 입력 순서, 5,000,000원)                                                             |
| 정상      | "PDF 다운로드" 동작(`window.print` 스텁)                                                                    | 통과 (dev 클릭 1회, production 키보드 Tab·Enter 1회, 포커스 링 적용)                                                               |
| 경계      | **T-03 유효기간 당일** → 배너 없음                                                                          | 통과 (임시 견적서 유효기간 2026-11-01, 한국 시간 오늘. dev·production 모두 배너 없음)                                              |
| 경계      | **T-02 유효기간 어제** → 배너 표시                                                                          | 통과 (`INV-2026-001` 유효기간 2026-10-10. 배너 표시, 금액 노출)                                                                    |
| 경계      | 노션에서 품목명 수정 후 새로고침 → 즉시 반영                                                                | 통과 (dev: 수정 전→수정 후, production: 다시 수정 후 새로고침으로 반영. `force-dynamic`, `Cache-Control: no-store`)                |
| 오류      | `/quote/dummy-valid` 등 더미 토큰 → 404                                                                     | 통과 (dev·production 모두 `dummy-valid`, `dummy-expired`, `dummy-broken`, `dummy-many-items` 404, 화면 "유효하지 않은 링크입니다") |
| 보안·노출 | 응답에 `noindex`                                                                                            | 통과 (메타 `robots: noindex`가 정상 견적서·404·`/quote`·`/`·없는 경로 모두에 있음. `X-Robots-Tag` 헤더는 없음)                     |
| 보안·노출 | 캐시 헤더                                                                                                   | 통과 (`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`)                                                    |
| 회귀      | Task 004 (375px 실데이터, 문서 가로 넘침 없음, 모바일 리스트 3건 금액 표시)                                 | 통과 (스크린샷 확인)                                                                                                               |
| 회귀      | Task 005 (만료 배너 유무, 인쇄에도 포함)                                                                    | 통과 (print 미디어에서 배너 표시)                                                                                                  |
| 회귀      | Task 006 (print: 버튼·토글 숨김, 표 표시·모바일 리스트 숨김, 헤더 반복, 행 나눔 방지, 다크 + print 흰 배경) | 통과                                                                                                                               |
| 회귀      | Task 007 (오류 화면, 404 문구)                                                                              | 통과                                                                                                                               |
| 회귀      | Task 008 (키보드 포커스·Enter, 375px)                                                                       | 통과                                                                                                                               |
| 회귀      | Task 010·011·012 (조회, 정렬, 일반 오류)                                                                    | 통과 (dev·production 응답 코드와 화면 동일)                                                                                        |
| 정적 검사 | `npm run check-all`, `npm run build`                                                                        | 통과                                                                                                                               |

## 확인된 사항

- `noindex`는 `X-Robots-Tag` 헤더가 아니라 메타 태그로만 제공된다. 검색엔진 대부분이 인식하지만 헤더도 함께 두려면 Task 015에서 응답 헤더 점검 시 판단한다
- 응답 헤더에는 `Referrer-Policy: origin-when-cross-origin`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`가 있다(Next 기본값). `Referrer-Policy`를 더 엄격히 할지는 Task 015에서 검토한다
- 더미 경로가 없어져 Task 003·007의 `dummy-*` 기반 시나리오는 더 이상 재현되지 않는다. 대신 실데이터와 노션 임시 데이터로 같은 항목을 검증했다(Task 010~012 기록)

## 상태

구현 완료, 테스트 전 항목 통과. ROADMAP ✅ 처리(2026-11-01).
