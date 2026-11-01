import { TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// 유효기간 만료 안내 배너 (F004). 조회는 허용하며 인쇄에도 포함한다
export function ExpiredBanner() {
  return (
    <Alert variant="destructive">
      <TriangleAlert aria-hidden="true" />
      <AlertTitle>유효기간이 지난 견적서입니다</AlertTitle>
      <AlertDescription>
        견적 내용이 현재와 다를 수 있으니 발행처에 확인해 주세요.
      </AlertDescription>
    </Alert>
  )
}
