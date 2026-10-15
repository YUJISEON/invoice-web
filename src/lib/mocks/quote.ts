import { quoteSchema, type Quote, type QuoteItem } from '@/lib/schemas/quote'

// TODO(Task 013): 실제 노션 연동 후 이 파일과 더미 토큰 진입 경로를 제거한다.

// 한국 시간 기준 오늘로부터 offset일 뒤의 YYYY-MM-DD
function kstDate(offsetDays: number): string {
  const kstNow = Date.now() + 9 * 60 * 60 * 1000
  return new Date(kstNow + offsetDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

function makeItems(count: number): QuoteItem[] {
  return Array.from({ length: count }, (_, i) => {
    const quantity = (i % 5) + 1
    const unitPrice = 100_000 * (i + 1)
    return {
      name: `품목 ${i + 1}`,
      quantity,
      unitPrice,
      amount: quantity * unitPrice,
    }
  })
}

const baseItems: QuoteItem[] = [
  {
    name: '웹사이트 기획',
    quantity: 1,
    unitPrice: 1_500_000,
    amount: 1_500_000,
  },
  {
    name: 'UI/UX 디자인',
    quantity: 2,
    unitPrice: 1_234_567,
    amount: 2_469_134,
  },
  {
    name: '프론트엔드 개발',
    quantity: 1.5,
    unitPrice: 2_000_000,
    amount: 3_000_000,
  },
  { name: '무상 점검', quantity: 1, unitPrice: 0, amount: 0 },
]

function makeQuote(token: string, overrides: Partial<Quote> = {}): Quote {
  return {
    token,
    quoteNumber: `Q-2026-${token.slice(6, 9).toUpperCase()}`,
    clientName: '주식회사 예시',
    contactName: '홍길동',
    issuedAt: kstDate(-7),
    expiresAt: kstDate(23),
    items: baseItems,
    memo: '부가세 별도입니다.',
    ...overrides,
  }
}

// 픽스처는 호출 시점에 만들어 날짜가 항상 오늘 기준이 되게 한다
const fixtures: Record<string, () => unknown> = {
  'dummy-valid': () => makeQuote('dummy-valid'),
  'dummy-expired': () => makeQuote('dummy-expired', { expiresAt: kstDate(-1) }),
  'dummy-expires-today': () =>
    makeQuote('dummy-expires-today', { expiresAt: kstDate(0) }),
  'dummy-no-expiry': () => makeQuote('dummy-no-expiry', { expiresAt: null }),
  'dummy-no-memo': () =>
    makeQuote('dummy-no-memo', { memo: null, contactName: null }),
  'dummy-many-items': () =>
    makeQuote('dummy-many-items', { items: makeItems(20) }),
  'dummy-long-text': () =>
    makeQuote('dummy-long-text', {
      clientName: '매우긴이름의주식회사'.repeat(8),
      memo: '긴 비고 문장입니다. '.repeat(40),
      items: [
        {
          name: 'ThisIsAVeryLongUnbrokenItemNameWithoutAnySpaces'.repeat(4),
          quantity: 1,
          unitPrice: 9_999_999_999,
          amount: 9_999_999_999,
        },
      ],
    }),
  // 스키마 위반: quoteNumber 빈 값 + 품목 수량 음수
  'dummy-broken': () =>
    makeQuote('dummy-broken', {
      quoteNumber: '',
      items: [{ name: '', quantity: -1, unitPrice: 0, amount: 0 }],
    }),
}

// 더미 토큰이 아니거나 production이면 null → 호출부에서 notFound() 처리.
// dummy-broken은 parse가 던지는 ZodError로 error.tsx 경로를 재현한다 (F010)
export function getMockQuote(token: string): Quote | null {
  if (process.env.NODE_ENV === 'production') return null
  const build = fixtures[token]
  if (!build) return null
  return quoteSchema.parse(build())
}
