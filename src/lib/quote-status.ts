const KST_OFFSET_MS = 9 * 60 * 60 * 1000

// 한국 시간 기준 오늘 날짜(YYYY-MM-DD)
function getKstDateString(now: Date): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10)
}

// 유효기간 만료 여부 (F004). 유효기간이 없으면 만료 아님, 만료일 당일은 유효하다.
// YYYY-MM-DD 문자열은 사전순 비교가 날짜순과 같다
export function isExpired(expiresAt: string | null, now: Date): boolean {
  if (!expiresAt) return false
  return expiresAt < getKstDateString(now)
}
