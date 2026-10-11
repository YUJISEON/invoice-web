// 토큰 없음/형식 불량. 견적서 존재 여부는 노출하지 않는다 (F004)
export default function QuoteNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-xl font-semibold">유효하지 않은 링크입니다</h1>
      <p className="text-muted-foreground text-sm">
        링크를 다시 확인하시거나 발급받은 담당자에게 문의해 주세요.
      </p>
    </main>
  )
}
