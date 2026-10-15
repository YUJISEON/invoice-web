import { notFound } from 'next/navigation'

import { Container } from '@/components/layout/container'
import { ThemeToggle } from '@/components/theme-toggle'
import { getMockQuote } from '@/lib/mocks/quote'

interface QuotePageProps {
  params: Promise<{ token: string }>
}

// TODO(Task 004): QuoteView로 교체. Task 010: getQuoteByToken으로 교체 (F001, F002, F010)
export default async function QuotePage({ params }: QuotePageProps) {
  const { token } = await params

  const quote = getMockQuote(token)
  if (!quote) notFound()

  return (
    <main className="py-10">
      <Container size="md">
        <div className="flex justify-end print:hidden">
          <ThemeToggle />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">견적서</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {quote.quoteNumber}
        </p>
      </Container>
    </main>
  )
}
