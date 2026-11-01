import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatKRW } from '@/lib/format'
import type { QuoteItem } from '@/lib/schemas/quote'

interface QuoteItemsTableProps {
  items: QuoteItem[]
}

// 견적 품목 (F002). 모바일(sm 미만)은 카드 리스트, sm 이상과 인쇄는 표로 표시한다
export function QuoteItemsTable({ items }: QuoteItemsTableProps) {
  return (
    <>
      {/* 모바일 리스트: 가로 스크롤 없이 금액까지 보이도록 한다. 인쇄에서는 숨김 */}
      <div className="sm:hidden print:hidden">
        {items.length === 0 ? (
          <p className="text-muted-foreground rounded-md border py-8 text-center text-sm">
            등록된 품목이 없습니다.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {items.map((item, index) => (
              <li key={index} className="space-y-1 px-4 py-3">
                <p className="text-sm font-medium break-words">{item.name}</p>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {item.quantity.toLocaleString('ko-KR')} ×{' '}
                    {formatKRW(item.unitPrice)}
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatKRW(item.amount)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 표: sm 이상과 인쇄에서 표시. 좁은 폭에서는 표 컨테이너만 가로 스크롤 */}
      <div className="hidden overflow-x-auto rounded-md border sm:block print:block">
        <Table className="min-w-[32rem]">
          <TableHeader className="print:table-header-group">
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col">품목명</TableHead>
              <TableHead scope="col" className="text-right">
                수량
              </TableHead>
              <TableHead scope="col" className="text-right">
                단가
              </TableHead>
              <TableHead scope="col" className="text-right">
                금액
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              // 품목 0건 안내 행
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-8 text-center"
                >
                  등록된 품목이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={index} className="print:break-inside-avoid">
                  <TableCell className="max-w-[16rem] break-words whitespace-normal">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.quantity.toLocaleString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatKRW(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatKRW(item.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
