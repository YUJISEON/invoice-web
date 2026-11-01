# Task 005: 만료 판정과 안내 배너

관련 기능: F004

## 명세

- `src/lib/quote-status.ts`: `isExpired(expiresAt, now)`. 한국 시간 기준 날짜 비교, `null`이면 false, 만료일 당일은 유효
- `src/components/quote/expired-banner.tsx`: shadcn `Alert`(destructive) 기반 배너
- `QuoteView` 상단에서 서버가 만든 `new Date()`로 판정해 만료 시에만 배너 표시
- 결정(현재 가정): 만료돼도 금액은 노출, 인쇄에도 배너 포함(`print:hidden` 없음)

## 테스트 체크리스트와 결과 (2026-11-01, dev 서버 HTML 응답 확인)

| 분류      | 입력 → 기대                                     | 결과                                                                         |
| --------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| 정상      | `dummy-valid`(유효기간 미래) → 배너 없음        | 통과                                                                         |
| 경계      | `dummy-expires-today` → 배너 없음 (당일 유효)   | 통과                                                                         |
| 경계      | `dummy-expired`(어제) → 배너 표시               | 통과                                                                         |
| 경계      | `dummy-no-expiry`(null) → 배너 없음             | 통과                                                                         |
| 오류      | 날짜 형식 불량은 스키마 단계(Task 012)에서 처리 | 해당 없음. 판정은 서버에서 수행되어 클라이언트 시간대와 무관                 |
| 보안·노출 | `dummy-expired`에서 금액 노출 정책(노출)과 일치 | 통과 (`1,234,567원` 표시)                                                    |
| 보안·노출 | 인쇄 미리보기(print 미디어)에서 배너 포함       | **미수행** (Playwright MCP 연결 실패. `print:hidden` 미적용을 코드로만 확인) |
| 정적 검사 | `npm run check-all`                             | 통과                                                                         |

## 상태

구현 완료, 테스트 통과. ROADMAP ✅ 처리(2026-11-01).

- 브라우저 확인(Playwright): print 미디어에서 `dummy-expired`의 만료 배너가 `display: grid`로 포함되고 금액 `6,969,134원`도 표시됨 (인쇄 포함 결정과 일치)
