# Task 002: 견적서 도메인 타입과 Zod 스키마, 포맷 유틸

관련 기능: F010, F002

## 명세

- `src/lib/schemas/quote.ts`: `quoteItemSchema`, `quoteSchema`, `QuoteItem`/`Quote` 타입, `calculateTotal(items)`
  - 날짜 필드는 `YYYY-MM-DD` 문자열(정규식 검증), 노션 `date.start` 정규화는 Task 010 매퍼 책임
  - 합계는 스키마 필드가 아니라 `calculateTotal`로 계산 (TODO: 합계 원본 결정 필요)
- `src/lib/format.ts`: `formatKRW`, `formatDate` (순수 함수, 시간대 변환 없음)

## 수락 기준

- `formatKRW(1234567)` → `1,234,567원`, `formatKRW(null)` → `-`
- `formatDate('2026-10-11')` → `2026-10-11`, `formatDate(null)` → `-`
- 스키마 필수/nullable 필드가 PRD 데이터 모델과 일치
- `npm run check-all` 통과

## 검증 결과

- 정적 검사: `npm run check-all`(typecheck, lint, format:check) 통과 (2026-11-01)
- 포맷 유틸 출력과 스키마 `parse` 동작: 브라우저 진입점이 없어 Task 003(픽스처), Task 004(화면)에서 검증 예정
- 합계 원본(노션 Formula/Rollup vs 앱 계산)은 미결정 상태로 앱 계산 가정 유지
