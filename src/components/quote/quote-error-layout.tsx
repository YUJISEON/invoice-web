import type { ReactNode } from 'react'

interface QuoteErrorLayoutProps {
  title: string
  description: string
  children?: ReactNode
}

// 견적서를 표시할 수 없을 때의 공통 안내 레이아웃 (F004)
export function QuoteErrorLayout({
  title,
  description,
  children,
}: QuoteErrorLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
      {children}
    </main>
  )
}
