import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // 서버 전용 필수값: 노션 Integration Token / 견적서·품목 데이터 소스 ID (NEXT_PUBLIC_ 금지)
  NOTION_API_KEY: z.string().min(1),
  NOTION_QUOTES_DATA_SOURCE_ID: z.string().min(1),
  NOTION_ITEMS_DATA_SOURCE_ID: z.string().min(1),
})

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NOTION_API_KEY: process.env.NOTION_API_KEY,
  NOTION_QUOTES_DATA_SOURCE_ID: process.env.NOTION_QUOTES_DATA_SOURCE_ID,
  NOTION_ITEMS_DATA_SOURCE_ID: process.env.NOTION_ITEMS_DATA_SOURCE_ID,
})

// 값은 출력하지 않고 누락·잘못된 변수 이름만 알린다
if (!parsed.success) {
  const names = [...new Set(parsed.error.issues.map(i => String(i.path[0])))]
  throw new Error(
    `환경변수 설정 오류: ${names.join(', ')} 값을 .env.local에 설정해 주세요`
  )
}

export const env = parsed.data

export type Env = z.infer<typeof envSchema>
