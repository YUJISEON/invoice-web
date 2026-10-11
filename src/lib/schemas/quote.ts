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

// 견적서 (F002, F010). 값이 없을 수 있는 필드는 nullable
export const quoteSchema = z.object({
  token: z.string().min(1),
  quoteNumber: z.string().min(1),
  clientName: z.string().min(1),
  contactName: z.string().nullable(),
  issuedAt: dateString.nullable(),
  expiresAt: dateString.nullable(),
  items: z.array(quoteItemSchema),
  memo: z.string().nullable(),
})

export type QuoteItem = z.infer<typeof quoteItemSchema>
export type Quote = z.infer<typeof quoteSchema>

// TODO(결정 필요: 합계 원본): 현재는 품목 amount 합산을 앱에서 계산한다.
// 노션 Formula/Rollup이 원본으로 결정되면 스키마에 total 필드를 추가하고 이 함수의 사용처를 교체한다.
export function calculateTotal(items: QuoteItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0)
}
