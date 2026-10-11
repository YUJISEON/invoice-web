import { Container } from '@/components/layout/container'
import { ThemeToggle } from '@/components/theme-toggle'

interface QuotePageProps {
  params: Promise<{ token: string }>
}

// TODO(F001, F002, F010): 토큰으로 노션 견적서 조회 → Zod 검증 → 화면 표시
export default async function QuotePage({ params }: QuotePageProps) {
  const { token } = await params

  return (
    <main className="py-10">
      <Container size="md">
        <div className="flex justify-end print:hidden">
          <ThemeToggle />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">견적서</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          토큰: {token.slice(0, 4)}…
        </p>
      </Container>
    </main>
  )
}
