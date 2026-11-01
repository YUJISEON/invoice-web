# Task 012: Zod 검증·변환과 오류 매핑

관련 기능: F010, F004

## 명세

- `src/lib/notion-errors.ts` 신규
  - `QuoteUnavailableError`: 화면(`error.tsx`)으로 전달되는 **유일한 오류**. 메시지는 항상 `QUOTE_UNAVAILABLE`이고 내부 정보를 담지 않음. 분류용 `reason`만 가짐
  - `toQuoteUnavailableError(error, maskedToken)`: 모든 오류를 서버 로그에 한 줄로 남기고(분류 + 코드, 토큰은 앞 4자) 일반 오류로 변환. 이미 `QuoteUnavailableError`면 그대로 반환
  - 분류: 429·5xx·`ConflictError`·타임아웃 = 노션 일시 오류 / 401·403·404(`object_not_found`)·400 등 = 노션 설정·권한 오류 / `ZodError` = 데이터 검증 실패(필드 경로와 이슈 코드만 기록, 값은 기록하지 않음) / `NotionMappingError` = 노션 속성 매핑 실패 / 그 외 = 알 수 없는 오류
  - 노션 오류의 `message`는 data source ID 등이 섞일 수 있어 로그에도 쓰지 않고 코드와 상태만 기록
- `src/lib/notion.ts`: `getQuoteByToken`을 `fetchQuote`(실제 조회)와 오류 변환 래퍼로 분리. 형식 불량·결과 없음은 오류가 아닌 `null`(호출부가 `notFound()`). 중복 토큰도 `QuoteUnavailableError('중복 토큰')`로 통일

## 테스트 결과 (2026-11-01)

노션에 임시 견적서 2건(G, H)과 품목 1건을 추가해 확인하고 삭제했다.

| 분류      | 입력 → 기대                                                                                       | 결과                                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 정상      | T-01(`INV-2026-001`) → 모든 필드 표시                                                             | 통과 (production. 품목 3건 입력 순서대로, 총 금액 5,000,000원)                                                                                                                |
| 경계      | **T-04**(발행일·유효기간·담당자명·비고가 비어 있음) → 오류 없이 표시, 비고 섹션 숨김, 빈 필드 `-` | 통과 (production. 발행일 `-`, 유효기간 `-`, 담당자 `-`, 비고 섹션 없음, 만료 배너 없음, 품목·총 금액 2,000원 표시)                                                            |
| 오류      | **T-07**(견적서 번호 빈 값) → 일반 오류 화면 + 서버 로그에 검증 실패 기록                         | 통과 (HTTP 500, 화면은 "견적서를 불러오지 못했습니다"와 "다시 시도"만. 서버 로그 `[notion] 오류(데이터 검증 실패): quoteNumber: too_small (token=nN0Y…)`)                     |
| 오류      | 429·500·503·타임아웃 → 일시 오류 / 401·403·404·400 → 설정·권한 오류, 모두 일반 오류로 전환        | 통과 (로컬 목 서버로 **실제 SDK 오류 객체**를 만들어 분류 함수에 입력. 8종 모두 `QuoteUnavailableError: QUOTE_UNAVAILABLE`, 로그는 `code`·`status`만)                         |
| 오류      | `ZodError`, `NotionMappingError`, 이미 일반 오류(중복 토큰), 알 수 없는 오류                      | 통과 (각각 분류·로그 확인, 중복 토큰은 같은 객체를 반환하고 추가 로그 없음)                                                                                                   |
| 오류      | "다시 시도" 클릭 후 복구 시 정상 표시                                                             | 통과 (production에서 T-07 오류 화면이 떠 있는 상태로 노션의 견적서 번호를 채우고 "다시 시도" → 정상 견적서 표시, 오류 화면 사라짐)                                            |
| 보안·노출 | **production** 오류 화면 콘솔                                                                     | 통과: `An error occurred in the Server Components render. The specific message is omitted in production builds…` 한 줄만 출력. ZodError·`too_small`·`quoteNumber`·속성명 없음 |
| 보안·노출 | production 응답·오류 화면 본문에 ZodError·필드명·digest 없음                                      | 통과 (응답에 `ZodError`·`too_small`·`quoteNumber` 없음, 화면 텍스트에 `QUOTE_UNAVAILABLE`·`견적서 번호`·`digest` 없음)                                                        |
| 보안·노출 | 서버 로그의 토큰 마스킹                                                                           | 통과 (`token=nN0Y…`, 원문 0건)                                                                                                                                                |
| 보안·노출 | 목 서버가 돌려준 원본 메시지(`SECRET-DETAIL`, data source ID)가 로그·화면에 없음                  | 통과                                                                                                                                                                          |
| 회귀      | Task 010·011 (정상 조회, 품목 순서, 중복 토큰 500)                                                | 통과                                                                                                                                                                          |
| 정적 검사 | `npm run check-all`, `npm run build`                                                              | 통과                                                                                                                                                                          |

## 확인된 사항

- **개발 모드 콘솔(Task 007에서 이월한 항목)**: 변경 전에는 `ZodError` 상세(`items.0.quantity: expected number, received null` 등)가 개발 모드 브라우저 콘솔에 그대로 찍혔다. 변경 후에는 던지는 오류가 `QuoteUnavailableError: QUOTE_UNAVAILABLE`로 바뀌어 ZodError 덤프가 사라졌다. 다만 Next 개발 서버는 **서버 로그를 브라우저 콘솔로 전달**하므로 우리가 남긴 `[notion] 오류(데이터 검증 실패): quoteNumber: too_small` 한 줄은 개발 모드에서만 콘솔에 보인다. production에서는 전달되지 않음을 확인했다
- SDK가 실패한 시도마다 `@notionhq/client warn: request fail {code, message…}`를 서버 콘솔에 직접 출력한다. 서버 로그 전용이고 토큰은 포함되지 않지만 `message`에 data source ID 등이 섞일 수 있다. 서버 로그를 외부에 공유할 때 주의한다
- 응답 지연(타임아웃) 시 일반 오류 화면까지의 대기 시간과 무한 로딩 여부는 Task 016에서 확인한다(분류 자체는 목 서버 타임아웃으로 확인)

## 상태

구현 완료, 테스트 전 항목 통과. ROADMAP ✅ 처리(2026-11-01). Task 007에서 이월한 production 콘솔 노출 확인도 이 Task로 해소됨.
