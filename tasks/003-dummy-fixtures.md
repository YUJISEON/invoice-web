# Task 003: 상태별 더미 견적서 픽스처

관련 기능: F002, F004, F010

## 명세

- `src/lib/mocks/quote.ts`에 `dummy-*` 8종 픽스처 정의, `getMockQuote(token)`으로 조회
- `NODE_ENV !== 'production'`에서만 허용 (Phase 3 Task 013에서 제거 대상)
- 스키마 변경(`total`, `status` 추가)을 반영: `total`은 품목 합, `status`는 `대기`

## 테스트 체크리스트와 결과 (2026-11-01, dev 서버 curl)

| 분류      | 입력 → 기대                                                                                                                | 결과                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 정상      | `/quote/dummy-valid` → 200                                                                                                 | 통과                                                                                 |
| 경계      | `dummy-expired`, `dummy-expires-today`, `dummy-no-expiry`, `dummy-no-memo`, `dummy-many-items`, `dummy-long-text` → 각 200 | 통과                                                                                 |
| 오류      | `/quote/dummy-broken` → 500 (스키마 위반)                                                                                  | 통과 (상태 코드만 확인)                                                              |
| 오류      | 비더미 토큰 → 404                                                                                                          | 통과                                                                                 |
| 보안·노출 | production 빌드에서 `/quote/dummy-valid` → 404                                                                             | 통과 (`npm run build` + `npm start`, `dummy-valid`·`dummy-broken` 모두 404, `/` 200) |
| 오류      | `/quote/dummy-broken`에서 `error.tsx` DOM 표시, 내부 메시지 미노출                                                         | **미수행** (Playwright MCP 연결 실패)                                                |
| 정적 검사 | `npm run check-all`                                                                                                        | 통과                                                                                 |

## 상태

구현 완료, 테스트 통과. ROADMAP ✅ 처리(2026-11-01).

- 브라우저 확인(2026-11-01, Playwright): `/quote/dummy-broken`은 500, 화면에는 "견적서를 불러오지 못했습니다"와 "다시 시도"만 표시되고 ZodError·`quoteNumber`·digest는 없음
- 참고: 개발 모드 브라우저 콘솔에는 ZodError 상세가 출력됨 → Task 007에서 production 확인 예정
- 위 표의 "error.tsx DOM 표시, 내부 메시지 미노출" 항목은 이 확인으로 통과
