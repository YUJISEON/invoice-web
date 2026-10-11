import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // 서버 전용: 노션 Integration Token / 견적서·품목 데이터 소스 ID
  NOTION_API_KEY: z.string().min(1).optional(),
  NOTION_QUOTES_DATA_SOURCE_ID: z.string().min(1).optional(),
  NOTION_ITEMS_DATA_SOURCE_ID: z.string().min(1).optional(),
})

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NOTION_API_KEY: process.env.NOTION_API_KEY,
  NOTION_QUOTES_DATA_SOURCE_ID: process.env.NOTION_QUOTES_DATA_SOURCE_ID,
  NOTION_ITEMS_DATA_SOURCE_ID: process.env.NOTION_ITEMS_DATA_SOURCE_ID,
})

export type Env = z.infer<typeof envSchema>
