# Task 009: 노션 클라이언트와 속성 매핑 계층

관련 기능: F001, F010

## 명세

- `npm i server-only` 설치
- `src/lib/env.ts`: Notion 3종(`NOTION_API_KEY`, `NOTION_QUOTES_DATA_SOURCE_ID`, `NOTION_ITEMS_DATA_SOURCE_ID`)을 서버 런타임 필수값으로 전환. 누락·빈 값이면 변수 이름만 담은 설정 오류를 던짐(값은 출력하지 않음). `.env.example`을 함께 갱신
- `src/lib/notion.ts`: 첫 줄 `import 'server-only'`, `Client`(`notionVersion` 2025-09-03 명시, `timeoutMs` 10000, `retry.maxRetries` 3), data source ID 상수 export
- `src/lib/notion-mappers.ts`: 속성명 상수 `QUOTE_PROPS`, `ITEM_PROPS`, 헬퍼 `getTitle`, `getRichText`, `getNumber`, `getDate`(YYYY-MM-DD 정규화), `getStatus`, `getFormulaNumber`, 오류 클래스 `NotionMappingError`(속성명 포함, 서버 로그 전용)

## 테스트 체크리스트와 결과 (2026-11-01)

| 분류      | 입력 → 기대                                                                                      | 결과                                                                                                                                                                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 정상      | env 3종이 모두 설정 → `env` 객체 생성                                                            | 통과 (node로 직접 실행)                                                                                                                                                                                                                                                                                                         |
| 정상      | 매퍼 헬퍼: title, rich_text 합침, number, date(시간 포함 → `2026-10-01`), status, formula number | 통과 (가짜 노션 속성 객체)                                                                                                                                                                                                                                                                                                      |
| 정상      | 실제 노션 스키마가 `QUOTE_PROPS`·`ITEM_PROPS`와 일치                                             | 통과 (Invoices: 상태 status, 담당자명 rich_text, 유효기간 date, 토큰 rich_text, 총 금액 number, 발행일 date, 비고 rich_text, 견적서 번호 title, 클라이언트명 rich_text, 항목 relation / Items: 금액 formula, 수량·단가 number, Invoices relation, 항목명 title)                                                                 |
| 경계      | env 3종 모두 누락 / 1개 누락 / 빈 문자열 → 누락 변수 이름만 나열한 설정 오류                     | 통과                                                                                                                                                                                                                                                                                                                            |
| 경계      | 토큰 속성이 select → `NotionMappingError`(속성 "토큰", 기대 rich_text, 실제 select)              | 통과                                                                                                                                                                                                                                                                                                                            |
| 경계      | 없는 속성, formula 결과가 string, date null, formula null, 빈 rich_text                          | 통과 (오류 또는 null/빈 문자열)                                                                                                                                                                                                                                                                                                 |
| 오류      | `NOTION_API_KEY` 누락·401 → 일반 오류 화면 + "다시 시도"                                         | 통과 (Task 010·014: 잘못된 API 키로 production을 띄워 HTTP 500, 일반 오류 화면과 "다시 시도" 확인. 키 누락은 설정 오류로 변수 이름만 알림)                                                                                                                                                                                      |
| 오류      | 속성 타입 불일치 → 일반 오류 화면, 서버 로그에 속성명                                            | **단위 검증으로 대체**(사용자 결정, 2026-11-01): 토큰 속성이 select일 때 `NotionMappingError`(속성명 포함)가 던져지고 `toQuoteUnavailableError`가 `[notion] 오류(노션 속성 매핑 실패): …` 로그와 일반 오류로 변환함을 Task 009·012에서 확인. 화면 단계의 실제 노션 스키마 변경은 기존 토큰 값에 영향을 줄 수 있어 시도하지 않음 |
| 보안·노출 | `npm run build` 산출물 `.next/static`에 API 키·data source ID 문자열 없음                        | 통과 (Task 011·013에서 `notion.ts`를 import하는 페이지가 연결된 뒤 재확인: 클라이언트 번들 36개 파일에 키·ID·`ntn_`·노션 SDK 없음)                                                                                                                                                                                              |
| 보안·노출 | 오류 화면·네트워크 응답·콘솔에 키·ID 비노출                                                      | 통과 (Task 012·014: production 오류 화면·응답·콘솔·서버 로그에 키·ID·속성명 없음)                                                                                                                                                                                                                                               |
| 정적 검사 | `npm run check-all`, `npm run build`                                                             | 통과                                                                                                                                                                                                                                                                                                                            |

## 외부 작업 현황 (사용자)

| 항목                                 | 상태                                                                                                                                                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env.local`의 Notion 3종            | 입력 완료 (키 유효, 검증 통과)                                                                                                                                                                                   |
| Integration에 Invoices·Items DB 공유 | 완료 (두 data source 조회 성공)                                                                                                                                                                                  |
| 노션 테스트 데이터 T-01~T-09         | **임시 생성·삭제 방식으로 대체**(사용자 결정, 2026-11-01): 상시 보관하지 않고 검증할 때마다 `TEMP-` 견적서와 연결 품목을 추가해 확인한 뒤 삭제. 원래 데이터(`INV-2026-001`, 품목 3건, 토큰 입력됨)만 노션에 유지 |

## 상태

구현 완료, 테스트 통과. ROADMAP ✅ 처리(2026-11-01). 남아 있던 두 항목(속성 타입 불일치 화면, 상시 테스트 데이터)은 사용자 결정으로 각각 "단위 검증으로 대체", "임시 생성·삭제 방식으로 대체"로 닫음. 운영 절차는 Task 017 문서에 기록한다.
