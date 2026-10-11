import { Container } from '@/components/layout/container'

export default function Home() {
  return (
    <main className="flex min-h-screen items-center">
      <Container size="sm" className="text-center">
        <h1 className="text-2xl font-semibold">견적서 확인</h1>
        <p className="text-muted-foreground mt-3">
          전달받은 견적서 전용 링크로 접속해 주세요.
        </p>
      </Container>
    </main>
  )
}
