import 'server-only'

import { Client, isFullPage, type PageObjectResponse } from '@notionhq/client'

import { env } from '@/lib/env'
import {
  QuoteUnavailableError,
  toQuoteUnavailableError,
} from '@/lib/notion-errors'
import {
  getRichText,
  ITEM_PROPS,
  mapItemPage,
  mapQuotePage,
  NotionMappingError,
  QUOTE_PROPS,
} from '@/lib/notion-mappers'
import {
  quoteSchema,
  sumItemAmounts,
  tokenSchema,
  type Quote,
} from '@/lib/schemas/quote'

// 노션 API 버전을 명시해 SDK 업그레이드로 동작이 바뀌지 않게 한다 (F001)
export const NOTION_VERSION = '2025-09-03'

// 노션 호출은 이 파일에서만 한다. 다른 파일에서 이 클라이언트를 직접 import하지 않는다.
// 고객 화면이라 오래 기다리게 하지 않는다 (Task 016에서 실측해 정함).
// - timeoutMs: 정상 호출은 약 0.5초라 8초면 충분하다. 타임아웃은 SDK가 재시도하지 않는다
// - 재시도는 429(rate_limited)만 대상이다. SDK 기본 대기 상한이 60초라 노션이 큰 Retry-After를 주면
//   정상 사용자가 빈 화면을 최대 수 분 보게 되므로, 대기를 2초로 제한하고 실패하면 오류 화면(다시 시도)으로 넘긴다
const notion = new Client({
  auth: env.NOTION_API_KEY,
  notionVersion: NOTION_VERSION,
  timeoutMs: 8_000,
  retry: { maxRetries: 2, initialRetryDelayMs: 500, maxRetryDelayMs: 2_000 },
})

// data source ID는 화면과 응답에 노출하지 않는다
const QUOTES_DATA_SOURCE_ID = env.NOTION_QUOTES_DATA_SOURCE_ID
const ITEMS_DATA_SOURCE_ID = env.NOTION_ITEMS_DATA_SOURCE_ID

// 서버 로그에는 토큰 원문을 남기지 않는다(앞 4자만)
const maskToken = (token: string): string => `${token.slice(0, 4)}…`

// 노션 호출 횟수를 서버 로그로 확인하기 위한 한 줄 로그(토큰 미포함)
const logCall = (label: string): void => {
  if (env.NODE_ENV !== 'production') console.info(`[notion] 호출: ${label}`)
}

// 한 번에 가져올 품목 수(노션 최대값). 넘으면 next_cursor로 이어서 조회한다
const ITEMS_PAGE_SIZE = 100

// 견적서 쪽 '항목' relation에 연결된 품목 ID를 연결한 순서대로 가져온다.
// 노션 created_time은 분 단위로 잘려 같은 분에 입력한 품목의 순서를 보장하지 못하지만,
// relation 목록은 연결 순서를 유지한다. 페이지 응답은 25개까지만 주므로 넘으면 속성 API로 이어서 읽는다
async function getItemOrder(quotePage: PageObjectResponse): Promise<string[]> {
  const prop = quotePage.properties[QUOTE_PROPS.items]
  if (!prop || prop.type !== 'relation') {
    throw new NotionMappingError(
      QUOTE_PROPS.items,
      '속성이 없거나 relation이 아님'
    )
  }
  // has_more는 실제 응답에는 있지만 SDK 타입에는 선언되어 있지 않다
  const hasMore = 'has_more' in prop && prop.has_more === true
  if (!hasMore) return prop.relation.map(r => r.id)

  const ids: string[] = []
  let cursor: string | undefined
  do {
    logCall('품목 순서 조회')
    const res = await notion.pages.properties.retrieve({
      page_id: quotePage.id,
      property_id: prop.id,
      page_size: ITEMS_PAGE_SIZE,
      start_cursor: cursor,
    })
    if (res.object !== 'list') break
    for (const item of res.results) {
      if (item.type === 'relation') ids.push(item.relation.id)
    }
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined
  } while (cursor)
  return ids
}

// 견적서에 속한 품목을 모두 조회한다 (F001, F002).
// 정렬 기준은 견적서 relation의 연결 순서(노션에 입력한 순서), relation에 없는 품목은 뒤로 보낸다.
// 품목 DB 설정 오류·미공유는 예외로 전체 오류가 된다
async function getQuoteItems(quotePage: PageObjectResponse) {
  const pages: PageObjectResponse[] = []
  let cursor: string | undefined

  do {
    logCall('품목 조회')
    const res = await notion.dataSources.query({
      data_source_id: ITEMS_DATA_SOURCE_ID,
      filter: {
        property: ITEM_PROPS.quote,
        relation: { contains: quotePage.id },
      },
      sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
      page_size: ITEMS_PAGE_SIZE,
      start_cursor: cursor,
    })
    pages.push(...res.results.filter(isFullPage))
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined
  } while (cursor)

  // 정렬 기준이 필요 없는 0~1건은 relation 순서 조회를 생략한다
  if (pages.length > 1) {
    const order = new Map(
      (await getItemOrder(quotePage)).map((id, i) => [id, i])
    )
    // Array.sort는 안정 정렬이라 순서 정보가 없는 품목은 생성 시각 순서를 유지한다
    pages.sort(
      (a, b) =>
        (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    )
  }

  return pages.map(mapItemPage)
}

// 토큰으로 견적서 1건과 품목을 조회한다 (F001).
// 형식 불량·결과 없음은 null(호출부가 notFound 처리).
// 그 밖의 모든 실패(노션 오류, 검증 실패, 중복 토큰)는 서버 로그에만 상세를 남기고
// QuoteUnavailableError(일반 메시지)로 던져 error.tsx가 일반 오류 화면을 보여주게 한다 (F004, F010)
export async function getQuoteByToken(token: string): Promise<Quote | null> {
  // 형식이 맞지 않으면 노션을 호출하지 않는다(토큰 열거·불필요한 호출 차단)
  if (!tokenSchema.safeParse(token).success) return null

  try {
    return await fetchQuote(token)
  } catch (error) {
    throw toQuoteUnavailableError(error, maskToken(token))
  }
}

async function fetchQuote(token: string): Promise<Quote | null> {
  logCall('견적서 조회')
  const res = await notion.dataSources.query({
    data_source_id: QUOTES_DATA_SOURCE_ID,
    filter: { property: QUOTE_PROPS.token, rich_text: { equals: token } },
    page_size: 2,
  })

  // 노션 equals 필터는 대소문자를 구분하지 않으므로, 토큰이 정확히 같은 행만 남긴다
  const pages = res.results
    .filter(isFullPage)
    .filter(p => getRichText(p.properties, QUOTE_PROPS.token) === token)
  if (pages.length === 0) return null
  if (pages.length > 1) {
    console.error(
      `[notion] 중복 토큰 ${pages.length}건 (token=${maskToken(token)})`
    )
    throw new QuoteUnavailableError('중복 토큰')
  }

  const items = await getQuoteItems(pages[0])

  // 매핑 결과는 반드시 검증한 뒤 화면에 전달한다 (F010)
  const quote = quoteSchema.parse({ ...mapQuotePage(pages[0]), items })

  // 합계 원본은 노션 '총 금액'이다. 품목 합과 다르면 서버 로그에만 남기고 화면은 total을 표시한다
  const itemsSum = sumItemAmounts(quote.items)
  if (itemsSum !== quote.total) {
    console.warn(
      `[notion] 합계 불일치: 총 금액 ${quote.total} / 품목 합 ${itemsSum} (token=${maskToken(token)})`
    )
  }

  return quote
}
