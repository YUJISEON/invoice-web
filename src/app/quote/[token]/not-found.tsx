import { QuoteErrorLayout } from '@/components/quote/quote-error-layout'

// 토큰 없음/형식 불량/존재하지 않음 모두 같은 문구. 견적서 존재 여부는 노출하지 않는다 (F004)
export default function QuoteNotFound() {
  return (
    <QuoteErrorLayout
      title="유효하지 않은 링크입니다"
      description="링크를 다시 확인하시거나 발급받은 담당자에게 문의해 주세요."
    />
  )
}
