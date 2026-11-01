import 'server-only'

import type { PageObjectResponse } from '@notionhq/client'

type PageProperties = PageObjectResponse['properties']

// 노션 속성명은 이 두 상수에만 둔다. 노션에서 속성 이름을 바꾸면 여기만 고친다 (F010)
export const QUOTE_PROPS = {
  quoteNumber: '견적서 번호',
  clientName: '클라이언트명',
  contactName: '담당자명',
  token: '토큰',
  memo: '비고',
  issuedAt: '발행일',
  expiresAt: '유효기간',
  total: '총 금액',
  status: '상태',
  items: '항목',
} as const

export const ITEM_PROPS = {
  name: '항목명',
  quantity: '수량',
  unitPrice: '단가',
  amount: '금액',
  quote: 'Invoices',
} as const

// 속성이 없거나 타입이 다를 때 던진다. 서버 로그 전용이며 화면에는 일반 오류만 보여준다
export class NotionMappingError extends Error {
  readonly property: string

  constructor(property: string, detail: string) {
    super(`노션 속성 "${property}" 매핑 실패: ${detail}`)
    this.name = 'NotionMappingError'
    this.property = property
  }
}

// 빈 문자열은 값이 없는 것으로 본다(노션 text 속성은 비어 있어도 빈 배열로 온다)
export const emptyToNull = (value: string): string | null =>
  value === '' ? null : value

function getProperty<T extends PageProperties[string]['type']>(
  props: PageProperties,
  name: string,
  type: T
): Extract<PageProperties[string], { type: T }> {
  const prop = props[name]
  if (!prop) throw new NotionMappingError(name, '속성이 없음')
  if (prop.type !== type) {
    throw new NotionMappingError(
      name,
      `타입 불일치(기대 ${type}, 실제 ${prop.type})`
    )
  }
  return prop as Extract<PageProperties[string], { type: T }>
}

const joinPlainText = (texts: { plain_text: string }[]): string =>
  texts.map(t => t.plain_text).join('')

export function getTitle(props: PageProperties, name: string): string {
  return joinPlainText(getProperty(props, name, 'title').title)
}

export function getRichText(props: PageProperties, name: string): string {
  return joinPlainText(getProperty(props, name, 'rich_text').rich_text)
}

export function getNumber(props: PageProperties, name: string): number | null {
  return getProperty(props, name, 'number').number
}

// 날짜는 YYYY-MM-DD로 정규화한다(시간이 포함돼도 날짜 부분만 사용)
export function getDate(props: PageProperties, name: string): string | null {
  const date = getProperty(props, name, 'date').date
  return date ? date.start.slice(0, 10) : null
}

export function getStatus(props: PageProperties, name: string): string | null {
  return getProperty(props, name, 'status').status?.name ?? null
}

// 견적서 행을 Quote 원본 객체로 매핑한다. 검증은 호출부의 quoteSchema.parse가 맡는다 (F010).
// 품목(items)은 별도 DB라 호출부에서 채운다
export function mapQuotePage(page: PageObjectResponse) {
  const props = page.properties
  return {
    quoteNumber: getTitle(props, QUOTE_PROPS.quoteNumber),
    clientName: getRichText(props, QUOTE_PROPS.clientName),
    contactName: emptyToNull(getRichText(props, QUOTE_PROPS.contactName)),
    issuedAt: getDate(props, QUOTE_PROPS.issuedAt),
    expiresAt: getDate(props, QUOTE_PROPS.expiresAt),
    status: getStatus(props, QUOTE_PROPS.status),
    total: getNumber(props, QUOTE_PROPS.total),
    memo: emptyToNull(getRichText(props, QUOTE_PROPS.memo)),
  }
}

// 품목 행을 QuoteItem 원본 객체로 매핑한다. 비어 있는 값(null)은 그대로 두어
// 호출부의 스키마 검증이 일반 오류로 처리하게 한다 (금액 formula가 비어 있는 행 포함) (F010)
export function mapItemPage(page: PageObjectResponse) {
  const props = page.properties
  return {
    name: getTitle(props, ITEM_PROPS.name),
    quantity: getNumber(props, ITEM_PROPS.quantity),
    unitPrice: getNumber(props, ITEM_PROPS.unitPrice),
    amount: getFormulaNumber(props, ITEM_PROPS.amount),
  }
}

export function getFormulaNumber(
  props: PageProperties,
  name: string
): number | null {
  const formula = getProperty(props, name, 'formula').formula
  if (formula.type !== 'number') {
    throw new NotionMappingError(
      name,
      `formula 결과 타입 불일치(기대 number, 실제 ${formula.type})`
    )
  }
  return formula.number
}
