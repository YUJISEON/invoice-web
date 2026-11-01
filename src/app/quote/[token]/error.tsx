'use client'

import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

import { QuoteErrorLayout } from '@/components/quote/quote-error-layout'
import { Button } from '@/components/ui/button'

// 노션 조회/검증 실패 시 표시. 오류 메시지·digest 등 내부 정보는 노출하지 않는다 (F004, F010)
export default function QuoteError({ reset }: { reset: () => void }) {
  const router = useRouter()

  // 서버에서 다시 조회한 뒤 오류 경계를 초기화한다
  function handleRetry() {
    startTransition(() => {
      router.refresh()
      reset()
    })
  }

  return (
    <QuoteErrorLayout
      title="견적서를 불러오지 못했습니다"
      description="일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요."
    >
      <Button onClick={handleRetry}>다시 시도</Button>
    </QuoteErrorLayout>
  )
}
