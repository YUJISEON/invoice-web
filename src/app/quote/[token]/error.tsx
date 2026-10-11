'use client'

import { Button } from '@/components/ui/button'

// 노션 조회/검증 실패 시 표시. 내부 구조는 노출하지 않는다 (F004, F010)
export default function QuoteError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">견적서를 불러오지 못했습니다</h1>
      <p className="text-muted-foreground text-sm">
        일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.
      </p>
      <Button onClick={reset}>다시 시도</Button>
    </main>
  )
}
