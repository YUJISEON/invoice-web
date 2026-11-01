import { z } from 'zod'

// 날짜는 YYYY-MM-DD 문자열. 노션 date.start(시간 포함 가능)의 정규화는 매퍼(Task 010) 책임이다 (F010)
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

// 견적 품목 (F002, F010). 수량은 소수를 허용한다
export const quoteItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  amount: z.number().nonnegative(),
})

// 링크 토큰 형식 (F001). 형식이 맞지 않으면 노션을 호출하지 않고 404로 처리한다
export const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{16,128}$/)

// 견적서 (F002, F010). 값이 없을 수 있는 필드는 nullable.
// 토큰은 접근 수단일 뿐 화면 모델에 필요 없어서 포함하지 않는다(응답에 실리는 경로를 줄이기 위함)
export const quoteSchema = z.object({
  quoteNumber: z.string().min(1),
  clientName: z.string().min(1),
  contactName: z.string().nullable(),
  issuedAt: dateString.nullable(),
  expiresAt: dateString.nullable(),
  // 노션 '상태' 값. 화면에 표시하지 않는 내부 참고용이며 값 집합이 미확정이라 enum으로 두지 않는다
  status: z.string().nullable(),
  // 합계 원본은 노션 '총 금액'이다 (결정 완료). 화면은 이 값을 표시한다
  total: z.number().nonnegative(),
  items: z.array(quoteItemSchema),
  memo: z.string().nullable(),
})

export type QuoteItem = z.infer<typeof quoteItemSchema>
export type Quote = z.infer<typeof quoteSchema>

// 품목 amount 합산. 표시용이 아니라 노션 '총 금액'과의 불일치 감지용 교차 검증에만 사용한다
export function sumItemAmounts(items: QuoteItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0)
}
