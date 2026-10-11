# Notion API 데이터베이스 연동 분석 (invoice-web)

> `notion-db-expert` 에이전트 분석 결과 정리. 코드 수정 및 실제 Notion 호출은 수행하지 않았습니다(토큰 없음).
> 속성명/타입은 `docs/PRD@old.md`의 가정값이며 실제 노션 템플릿으로 검증되지 않았습니다.

## 0. 요약

- 현재 Notion 연동 코드가 없습니다. `src/lib/`에는 `env.ts`, `utils.ts`만 있고 `src/lib/notion.ts`, `src/lib/schemas/`, `src/app/quote/`는 없습니다. `@notionhq/client`도 `package.json`에 없습니다.
- `docs/PRD.md`는 없고 `docs/PRD@old.md`만 있습니다. CLAUDE.md는 `@/docs/PRD.md`를 가리키므로 경로가 어긋나 있습니다.
- `@notionhq/client` 최신은 v5.27.0 (Node >= 18)입니다. 기본 `Notion-Version`은 `2025-09-03`이며, DB 조회는 `databases.query`가 아니라 **`dataSources.query`** 를 사용합니다.
- 가장 큰 설계 쟁점은 품목(items)을 노션에서 어떻게 모델링할지입니다(PRD 미결 이슈).

## 1. 현재 문서/코드의 노션 연동 요구사항

### 1.1 결정 사항 (docs/PRD@old.md)

| 항목      | 결정                                                     |
| --------- | -------------------------------------------------------- |
| 연동 방식 | Notion API 공식 연동 (Integration Token)                 |
| 접근 방식 | 고유 토큰 링크, 비로그인 (`/quote/[token]`)              |
| PDF       | 브라우저 인쇄 (`@media print`, `print:hidden`)           |
| 범위      | 견적서 1건 = 링크 1개, 읽기 전용, 목록/대시보드 없음     |
| 캐싱      | MVP는 캐시 없이 매 요청 조회 (필요 시 `revalidate` 검토) |
| 동기화    | 웹훅 없음, fetch-on-view                                 |

### 1.2 속성 매핑 (PRD 7.3, 모두 가정)

| Notion 속성 | 타입                           | 앱 필드                           |
| ----------- | ------------------------------ | --------------------------------- |
| 토큰        | Text (고유값)                  | `token` (URL 매칭 키)             |
| 견적번호    | Text                           | `quoteNumber`                     |
| 고객사명    | Text                           | `clientName`                      |
| 담당자명    | Text                           | `contactName`                     |
| 발행일      | Date                           | `issuedAt`                        |
| 유효기간    | Date                           | `expiresAt`                       |
| 품목        | Relation 또는 하위 테이블 블록 | `items[]` (품목명/수량/단가/금액) |
| 비고        | Text                           | `memo`                            |

합계(소계/부가세/총액)는 화면 요구사항에는 있으나 속성표에는 없습니다. 노션 Formula/Rollup으로 계산할지, 앱에서 계산할지 미정입니다.

### 1.3 계획된 코드 위치 (PRD 8절)

- `src/lib/notion.ts`: 클라이언트 초기화, `getQuoteByToken(token)`
- `src/lib/schemas/quote.ts`: `quoteSchema` (Zod)
- `src/app/quote/[token]/page.tsx`: Server Component
- `src/components/quote/`: 화면 컴포넌트
- 상태별 처리: 정상 / 토큰 없음(404) / 만료(안내 배너) / API 실패(재시도) / Zod 실패(일반 에러, 내부 구조 비노출)

### 1.4 기존 코드 컨벤션

- `src/lib/env.ts`는 Zod로 환경변수를 검증하고 `export const env`로 내보냅니다. `NOTION_API_KEY`, `NOTION_DATA_SOURCE_ID`는 여기에 서버 전용으로 추가하는 것이 일관적입니다.
- 현재 `env.ts`는 모듈 로드 시 `parse`하므로 클라이언트 번들에서 import하면 서버 변수가 노출될 수 있습니다. 서버 전용 파일로 분리하거나 `import 'server-only'`를 사용합니다(`server-only` 패키지는 미설치).
- 구조 규칙: kebab-case 파일명, named export, `@/` 별칭, 파일 300줄 이하.
- 스택: zod ^4.1.11 (v4 문법), Next 15.5.3, React 19.1.0.

## 2. @notionhq/client v5 기준 DB 사용법

### 2.1 설치/초기화

```bash
npm i @notionhq/client
```

```ts
import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  timeoutMs: 10_000, // 기본 60000, 고객 화면이라 짧게
  retry: { maxRetries: 3 }, // 429/5xx 자동 재시도 (기본 maxRetries 2)
})
```

- SDK가 429(`Retry-After`)와 서버 오류를 자동 재시도하므로 직접 백오프 루프를 만들 필요가 적습니다. `retry: false`로 끌 수 있습니다.
- 기본 `notionVersion`은 `2025-09-03`입니다. 명시적으로 고정하는 편이 안전합니다.
- SDK는 환경변수를 읽지 않으므로 `process.env`를 직접 넘깁니다.
- 브라우저에서 토큰을 쓰면 `BrowserTokenNotAllowedError`가 발생합니다. `dangerouslyAllowBrowser`는 켜지 않습니다.

### 2.2 인증과 공유 설정

- notion.so/profile/integrations에서 Internal Integration을 만들고 token(`ntn_...` 또는 `secret_...`)을 발급합니다. 권한은 "Read content"만 부여합니다(읽기 전용 요구사항).
- 대상 DB 페이지의 "..." → Connections → 해당 Integration을 추가해야 합니다. 누락하면 `object_not_found`(404)가 발생합니다.
- 품목을 하위 DB(Relation)로 둔다면 그 DB도 별도로 Connection을 추가합니다.

### 2.3 Data Source 모델 (2025-09-03 이후)

- 하나의 database가 여러 data source를 담는 컨테이너입니다. Database ID와 data source ID는 서로 다르며 호환되지 않습니다.
- 조회에는 `data_source_id`를 사용합니다. 얻는 방법:
  1. `notion.databases.retrieve({ database_id })` 응답의 `data_sources[]`에서 확인
  2. 노션 UI의 DB 설정(Manage data sources)에서 복사
- 단일 data source DB라면 한 번 확인한 ID를 환경변수로 고정합니다(매 요청 retrieve는 레이트 리밋 낭비).

### 2.4 조회, filter, sorts, 페이지네이션

```ts
const res = await notion.dataSources.query({
  data_source_id,
  filter: {
    and: [{ property: '토큰', rich_text: { equals: token } }],
  },
  sorts: [{ timestamp: 'created_time', direction: 'descending' }],
  page_size: 1,
})
// res.results[]: PageObjectResponse | PartialPageObjectResponse
// res.has_more / res.next_cursor
```

- Body 파라미터: `filter`(property/timestamp filter, `and`/`or` 복합), `sorts`(`property` 또는 `timestamp`), `start_cursor`, `page_size`(최대 100), `in_trash`, `result_type`.
- 속성 타입별 filter 키: `title`/`rich_text`(equals, contains…), `number`, `date`(on_or_before…), `select`, `status`, `checkbox`, `relation`(contains) 등.
- 전체 조회 헬퍼:
  - `collectPaginatedAPI(notion.dataSources.query, {...})`: 전체 배열
  - `iteratePaginatedAPI(...)`: async iterator
  - `iterateAllDataSourceRows`: 약 10,000행 제한 초과 시
- `request_status.incomplete_reason === 'query_result_limit_reached'`는 약 10k행 제한 도달을 뜻합니다(견적서 1건 조회에는 해당 없음).
- 결과는 `PageObjectResponse`/`PartialPageObjectResponse`가 섞여 있으므로 `isFullPage()`로 좁힙니다.

### 2.5 속성 타입별 응답 구조 (`page.properties[이름]`)

| 타입                   | 응답 구조                                                                                   | 빈 값        |
| ---------------------- | ------------------------------------------------------------------------------------------- | ------------ |
| title                  | `{ type:'title', title: RichText[] }`                                                       | `[]`         |
| rich_text              | `{ rich_text: RichText[] }` (각 항목 `plain_text`)                                          | `[]`         |
| number                 | `{ number: number \| null }`                                                                | null         |
| select                 | `{ select: {id,name,color} \| null }`                                                       | null         |
| multi_select           | `{ multi_select: {id,name,color}[] }`                                                       | `[]`         |
| status                 | `{ status: {id,name,color} \| null }`                                                       | null         |
| date                   | `{ date: {start,end,time_zone} \| null }`                                                   | null         |
| checkbox               | `{ checkbox: boolean }`                                                                     | -            |
| url/email/phone_number | `{ url: string \| null }` 등                                                                | null         |
| people                 | `{ people: User[] }`                                                                        | `[]`         |
| relation               | `{ relation: {id}[], has_more }` (페이지 응답 25개 제한)                                    | `[]`         |
| rollup                 | `{ rollup: { type:'number'\|'date'\|'array', ... } }`                                       | 타입별 분기  |
| formula                | `{ formula: { type:'string'\|'number'\|'boolean'\|'date', ... } }`                          | 값 null 가능 |
| files                  | `{ files: ({type:'file', file:{url,expiry_time}} \| {type:'external', external:{url}})[] }` | `[]`         |
| created_time           | `{ created_time: ISO string }`                                                              | -            |

- `title`/`rich_text` 인라인 멘션이 25개를 넘거나 relation이 25개를 넘으면 페이지 응답에서 생략됩니다. 완전한 값은 `pages.properties.retrieve`(`GET /v1/pages/{page_id}/properties/{property_id}`)로 `next_cursor`를 돌며 읽습니다.
- 품목 수가 25개를 넘길 가능성이 있다면 relation 방식은 이 제한을 반드시 고려해야 합니다.

### 2.6 블록(본문) 조회

```ts
import { collectPaginatedAPI, isFullBlock } from '@notionhq/client'

const blocks = await collectPaginatedAPI(notion.blocks.children.list, {
  block_id: pageId, // 페이지 ID도 block_id로 사용
})
// table 블록: block.type === 'table', has_children === true
// 행: notion.blocks.children.list({ block_id: tableBlock.id }) → table_row.cells: RichText[][]
```

- `has_children`이 true인 블록은 재귀 조회가 필요하고, 호출마다 레이트 리밋을 소비합니다. 응답은 100개 단위 페이지네이션입니다.
- 표 블록은 `table.has_column_header` 여부와 열 순서에 의존하므로 속성 이름 기반 매핑보다 취약합니다.

### 2.7 에러 처리

```ts
import {
  APIErrorCode,
  ClientErrorCode,
  isNotionClientError,
} from '@notionhq/client'

if (isNotionClientError(e)) {
  switch (e.code) {
    case APIErrorCode.ObjectNotFound: // 404: DB 미공유 또는 잘못된 ID
    case APIErrorCode.Unauthorized: // 401: 토큰 오류
    case APIErrorCode.RateLimited: // 429 (SDK 재시도 소진 후)
    case ClientErrorCode.RequestTimeout:
  }
}
```

레이트 리밋은 평균 3 req/s입니다.

## 3. 이 프로젝트에 적용할 권장 구조

### 3.1 파일 구성

```
src/lib/env.ts                 # NOTION_API_KEY, NOTION_DATA_SOURCE_ID 추가 (서버 전용, NEXT_PUBLIC_ 금지)
src/lib/notion.ts              # 클라이언트 + getQuoteByToken (server-only)
src/lib/notion-mappers.ts      # 속성 타입별 헬퍼 (300줄 규칙 대응, 필요 시)
src/lib/schemas/quote.ts       # quoteSchema, QuoteItem, Quote
src/app/quote/[token]/page.tsx # Server Component
src/app/quote/[token]/error.tsx
src/app/quote/[token]/not-found.tsx
```

### 3.2 Zod 스키마 (zod v4)

```ts
// src/lib/schemas/quote.ts
import { z } from 'zod'

export const quoteItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  amount: z.number().nonnegative(),
})

export const quoteSchema = z.object({
  token: z.string().min(1),
  quoteNumber: z.string().min(1),
  clientName: z.string().min(1),
  contactName: z.string().nullable(),
  issuedAt: z.string().nullable(), // ISO
  expiresAt: z.string().nullable(),
  items: z.array(quoteItemSchema),
  memo: z.string().nullable(),
})
export type Quote = z.infer<typeof quoteSchema>
```

### 3.3 조회 함수

```ts
// src/lib/notion.ts
import 'server-only'
import {
  Client,
  isFullPage,
  isNotionClientError,
  APIErrorCode,
} from '@notionhq/client'
import { quoteSchema, type Quote } from '@/lib/schemas/quote'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  timeoutMs: 10_000,
  retry: { maxRetries: 3 },
})

const plain = (rt: { plain_text: string }[]) =>
  rt.map(t => t.plain_text).join('')

export async function getQuoteByToken(token: string): Promise<Quote | null> {
  // 사전 방어: 비정상 토큰은 노션을 호출하지 않고 즉시 null
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return null
  try {
    const res = await notion.dataSources.query({
      data_source_id: process.env.NOTION_DATA_SOURCE_ID!,
      filter: { property: '토큰', rich_text: { equals: token } },
      page_size: 1,
    })
    const page = res.results.find(isFullPage)
    if (!page) return null
    const p = page.properties
    // 속성명/타입은 가정. 실제 템플릿 확인 후 확정 필요
    const raw = {
      token,
      quoteNumber:
        p['견적번호']?.type === 'rich_text'
          ? plain(p['견적번호'].rich_text)
          : '',
      // ...나머지 속성, items는 3.5 참고
    }
    return quoteSchema.parse(raw) // 실패 시 ZodError → 서버 로그, 화면은 일반 에러
  } catch (e) {
    if (isNotionClientError(e) && e.code === APIErrorCode.ObjectNotFound) {
      // 공유 누락 등 설정 문제: 로그만 남기고 고객에게는 일반 오류
    }
    throw e
  }
}
```

### 3.4 페이지

```tsx
// src/app/quote/[token]/page.tsx
export default async function QuotePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params // Next 15: params는 Promise
  const quote = await getQuoteByToken(token)
  if (!quote) notFound()
  return <QuoteView quote={quote} />
}
```

### 3.5 품목 모델링 옵션 (PRD 오픈 이슈)

| 방식                       | 장점                                                             | 단점                                                                   |
| -------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A. 품목 별도 DB + Relation | 속성 타입이 명확하고 Zod 검증이 쉬움, 금액을 Formula로 계산 가능 | 호출 수 증가(견적 1 + 품목 N), relation 25개 제한, 품목 DB도 공유 필요 |
| B. 페이지 본문의 표 블록   | 운영자가 입력하기 쉬움                                           | `blocks.children.list` 재귀 + 열 순서 의존, 타입 보장 없음             |
| C. JSON 문자열 속성        | 호출 1회                                                         | 운영자 입력 오류 가능성이 높고 UX가 나쁨                               |

**권장은 A**: 품목 DB에 `견적서(relation)`, `품목명(title)`, `수량(number)`, `단가(number)`, `금액(formula)` 구조를 두고, 품목 DB를 `relation contains page_id` 필터로 `dataSources.query`하면 25개 제한과 N+1 조회를 피할 수 있습니다(견적 페이지 조회 후 품목 DB 1회 쿼리).

### 3.6 캐싱/revalidate

- Notion SDK는 내부적으로 `fetch`를 쓰지만 Next가 캐시한다고 가정하지 않는 편이 안전합니다.
  - MVP: `export const dynamic = 'force-dynamic'`로 매 요청 조회(PRD 결정과 일치)
  - 트래픽 증가 시 `unstable_cache(getQuoteByToken, ['quote'], { revalidate: 60, tags: ['quote'] })`. 토큰을 캐시 키에 포함하고, 파일 URL 만료(약 1시간)보다 짧게 유지합니다.
- 즉시 반영이 필요하면 `revalidateTag`를 호출하는 Route Handler를 두는 방안이 있습니다(웹훅은 Non-Goal이므로 후순위).

### 3.7 에러 매핑 (PRD 7.2 대응)

| 상황                                | 처리                                          |
| ----------------------------------- | --------------------------------------------- |
| 결과 없음 / 토큰 형식 불량          | `notFound()` (동일 응답으로 존재 여부 비노출) |
| 만료(`expiresAt` < 오늘)            | 페이지에서 배너 표시 (조회는 허용)            |
| 429/5xx/타임아웃                    | `error.tsx` "잠시 후 다시 시도" + reset 버튼  |
| 401/403/object_not_found(설정 문제) | 서버 로그만, 고객에게는 일반 오류             |
| ZodError                            | 서버 로그 후 일반 오류 (내부 구조 비노출)     |

## 4. 주의사항

1. **품목 모델링**: 3.5 참고. 속성은 flat 구조라 "행 안의 여러 줄"을 직접 표현할 수 없습니다.
2. **파일 URL 만료**: `files`/내부 이미지의 `file.url`은 `expiry_time` 기준 약 1시간 후 만료됩니다. 로고는 PRD대로 `public/` 정적 자산으로 두고, 노션 파일은 저장하거나 장시간 캐시하지 않습니다. 인쇄/PDF 저장 직전 만료될 수 있음에 유의합니다.
3. **토큰 보안**: `NOTION_API_KEY`는 서버 전용(`NEXT_PUBLIC_` 금지), `.env.local` 커밋 금지, `import 'server-only'`로 클라이언트 번들 유입 차단, 에러 응답/로그에 토큰과 원본 에러 body 비노출.
4. **링크 토큰 강도**: 수동 입력 토큰은 추측 가능성이 있습니다. 16~32자 이상 랜덤 문자열을 쓰도록 운영 가이드가 필요하고, 유출 시 폐기(토큰 교체) 방법도 고지해야 합니다.
5. **대량 조회**: `rich_text equals`는 정확 일치라 인젝션 위험은 낮지만, 길이/문자 제한으로 불필요한 호출을 차단합니다. `/quote/[token]` 대량 시도(토큰 열거)는 레이트 리밋 소진으로 이어질 수 있으므로 미들웨어 등 보호 장치를 후속 검토합니다.
6. **토큰 속성 고유성**: 노션 DB에는 unique 제약이 없어 중복이 가능합니다. `page_size: 2`로 조회해 중복을 감지하는 방안을 권장합니다.
7. **속성명 의존**: 속성 이름 변경은 곧바로 장애입니다. 속성명을 상수 한 곳에 모으고 Zod 실패를 로깅합니다. 속성 ID 기반 접근도 선택지입니다.
8. **통화/숫자**: KRW 단일 통화이므로 number를 그대로 쓰되, 노션 Formula 값과 앱 계산 값 중 어느 쪽이 원본인지 결정합니다(PRD 성공 지표 "100% 일치").
9. **버전 고정**: `notionVersion`을 코드에 명시하고, SDK 업그레이드 시 변경 로그를 확인합니다(v5에서 `databases.query` 제거, `archived`→`in_trash` 등).

## 5. 노션 설정 체크리스트

- [ ] https://www.notion.so/profile/integrations 에서 Internal Integration 생성 (권한: Read content만)
- [ ] 발급된 token을 `.env.local`의 `NOTION_API_KEY`로 저장 (커밋 금지, `NEXT_PUBLIC_` 금지)
- [ ] 견적서 DB 페이지에서 Connections로 Integration 추가 (품목 DB를 쓰면 그 DB도 추가)
- [ ] 견적서 DB의 data source ID 확인 후 `NOTION_DATA_SOURCE_ID`로 저장 (품목 DB용 ID도 별도 필요)
- [ ] 속성명과 타입을 PRD 7.3과 일치: `토큰`(Text), `견적번호`(Text), `고객사명`(Text), `담당자명`(Text), `발행일`(Date), `유효기간`(Date), `비고`(Text)
- [ ] 품목 모델링 방식 확정 (권장: 별도 DB + Relation, 품목명 title / 수량 number / 단가 number / 금액 formula)
- [ ] 합계(소계/부가세/총액)를 노션 Formula/Rollup으로 둘지, 앱에서 계산할지 결정
- [ ] 토큰 생성 규칙 수립 (충분히 긴 랜덤 문자열, 중복 금지)
- [ ] 테스트용 견적서 1건 작성 후 링크 접속 확인 (미공유 시 404 발생 여부 확인)

## 6. 남은 위험·가정·후속 작업

- 속성명/타입은 PRD 가정값이며 실제 노션 템플릿으로 확인되지 않았습니다. 구현 전 사용자 확인이 필요합니다.
- 실제 Notion 호출 검증은 토큰이 없어 수행하지 못했습니다.
- `docs/PRD.md` 경로 불일치(현재 `PRD@old.md`)는 문서 정리가 필요합니다.
- 구현 시 `@notionhq/client`, `server-only` 설치가 필요하며, 변경 후 `npm run check-all`과 `npm run build`로 검증합니다.
- 만료 견적서 정책(금액 비노출 여부), 토큰 열거 공격 대응, 캐시 도입 시점은 후속 결정 사항입니다.
