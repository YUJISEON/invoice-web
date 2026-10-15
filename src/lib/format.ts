// 값이 없을 때 화면에 표시하는 대체 문자 (F002)
const EMPTY = '-'

// 원화 포맷. 단일 통화(KRW) 가정. 예: 1234567 → '1,234,567원', null → '-'
export function formatKRW(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY
  }
  return `${value.toLocaleString('ko-KR')}원`
}

// 날짜 포맷. 스키마가 보장하는 YYYY-MM-DD를 그대로 표시하고 값이 없으면 '-'
export function formatDate(value: string | null | undefined): string {
  return value ? value : EMPTY
}
