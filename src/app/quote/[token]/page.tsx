import { notFound } from 'next/navigation'

import { Container } from '@/components/layout/container'
import { QuoteView } from '@/components/quote/quote-view'
import { ThemeToggle } from '@/components/theme-toggle'
import { getQuoteByToken } from '@/lib/notion'

// 노션 수정이 매 요청에 즉시 반영되도록 캐시하지 않는다 (F001)
export const dynamic = 'force-dynamic'

interface QuotePageProps {
  params: Promise<{ token: string }>
}

// 토큰으로 노션 견적서를 조회해 표시한다 (F001, F002, F010).
// 토큰 형식 불량·결과 없음은 notFound(), 조회·검증 실패는 error.tsx의 일반 오류 화면
export default async function QuotePage({ params }: QuotePageProps) {
  const { token } = await params

  const quote = await getQuoteByToken(token)
  if (!quote) notFound()

  return (
    <main className="py-10">
      <Container size="md">
        <div className="flex justify-end print:hidden">
          <ThemeToggle />
        </div>
        <div className="mt-6">
          <QuoteView quote={quote} />
        </div>
      </Container>
    </main>
  )
}
