'use client'

import { Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'

// PDF 다운로드 (F003). 브라우저 인쇄 대화상자에서 PDF로 저장한다. 인쇄물에는 나오지 않는다
export function PrintButton() {
  return (
    <Button
      type="button"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer aria-hidden="true" />
      PDF 다운로드
    </Button>
  )
}
