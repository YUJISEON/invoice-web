import { Card, CardContent } from '@/components/ui/card'
import { ExpiredBanner } from '@/components/quote/expired-banner'
import { PrintButton } from '@/components/quote/print-button'
import { QuoteItemsTable } from '@/components/quote/quote-items-table'
import { formatDate, formatKRW } from '@/lib/format'
import { isExpired } from '@/lib/quote-status'
import type { Quote } from '@/lib/schemas/quote'

interface QuoteViewProps {
  quote: Quote
}

// 견적서 상세 본문 (F002). 표시 전용 Server Component이며 토큰은 표시하지 않는다
export function QuoteView({ quote }: QuoteViewProps) {
  return (
    <article className="space-y-8 break-words">
      {/* 만료 안내: 조회는 허용하고 배너만 표시한다 (F004) */}
      {isExpired(quote.expiresAt, new Date()) && <ExpiredBanner />}

      {/* 헤더: 제목, 견적번호, 발행일·유효기간 */}
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">견적서</h1>
          <PrintButton />
        </div>
        {/* 요약 영역: 견적번호·발행일·유효기간을 한눈에 보여준다 */}
        <Card className="bg-muted/50 gap-0 py-0 shadow-none">
          <CardContent className="px-4 py-4 sm:px-6">
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div className="min-w-0">
                <dt className="text-muted-foreground">견적번호</dt>
                <dd className="mt-1 text-base font-semibold">
                  {quote.quoteNumber}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">발행일</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(quote.issuedAt)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">유효기간</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(quote.expiresAt)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </header>

      {/* 고객 정보 */}
      <section aria-labelledby="quote-client-heading" className="space-y-3">
        <h2 id="quote-client-heading" className="text-lg font-semibold">
          고객 정보
        </h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-muted-foreground">고객사</dt>
            <dd className="mt-1 font-medium">{quote.clientName}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted-foreground">담당자</dt>
            <dd className="mt-1 font-medium">{quote.contactName ?? '-'}</dd>
          </div>
        </dl>
      </section>

      {/* 품목 표 */}
      <section aria-labelledby="quote-items-heading" className="space-y-3">
        <h2 id="quote-items-heading" className="text-lg font-semibold">
          견적 품목
        </h2>
        <QuoteItemsTable items={quote.items} />
      </section>

      {/* 합계: 노션 '총 금액' 값을 그대로 표시한다 (화면에서 계산하지 않음) */}
      <section aria-labelledby="quote-total-heading">
        <h2 id="quote-total-heading" className="sr-only">
          합계
        </h2>
        <div className="bg-muted/50 flex items-center justify-between gap-4 rounded-md border px-4 py-4 sm:px-6">
          <span className="font-medium">총 금액</span>
          <span className="text-2xl font-bold tabular-nums">
            {formatKRW(quote.total)}
          </span>
        </div>
      </section>

      {/* 비고: 값이 없으면 섹션 자체를 렌더하지 않는다 */}
      {quote.memo !== null && (
        <section aria-labelledby="quote-memo-heading" className="space-y-3">
          <h2 id="quote-memo-heading" className="text-lg font-semibold">
            비고
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {quote.memo}
          </p>
        </section>
      )}
    </article>
  )
}
