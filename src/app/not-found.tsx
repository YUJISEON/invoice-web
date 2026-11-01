import { QuoteErrorLayout } from '@/components/quote/quote-error-layout'

// 루트 404: 경로 없음(`/quote` 등)도 링크 불량과 동일 문구로 안내해 존재 여부를 노출하지 않는다 (F004)
export default function RootNotFound() {
  return (
    <QuoteErrorLayout
      title="유효하지 않은 링크입니다"
      description="링크를 다시 확인하시거나 발급받은 담당자에게 문의해 주세요."
    />
  )
}
