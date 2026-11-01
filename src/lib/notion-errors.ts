import 'server-only'

import {
  APIErrorCode,
  ClientErrorCode,
  isNotionClientError,
} from '@notionhq/client'
import { ZodError } from 'zod'

import { NotionMappingError } from '@/lib/notion-mappers'

// 화면(error.tsx)으로 전달되는 유일한 오류. 메시지에는 내부 정보를 담지 않는다 (F004, F010).
// 상세 원인은 서버 로그에만 남기고 reason은 로그·분류용이다
export class QuoteUnavailableError extends Error {
  readonly reason: string

  constructor(reason: string) {
    super('QUOTE_UNAVAILABLE')
    this.name = 'QuoteUnavailableError'
    this.reason = reason
  }
}

// 일시적 오류: 429, 5xx, 타임아웃. 잠시 후 다시 시도하면 복구될 수 있다
const TRANSIENT_CODES: string[] = [
  APIErrorCode.RateLimited,
  APIErrorCode.InternalServerError,
  APIErrorCode.ServiceUnavailable,
  APIErrorCode.ConflictError,
  ClientErrorCode.RequestTimeout,
]

type Classified = { kind: string; detail: string }

// 오류 종류를 나눈다. 노션 오류 메시지는 ID 등이 섞일 수 있어 로그에도 코드와 상태만 쓴다
function classify(error: unknown): Classified {
  if (error instanceof QuoteUnavailableError) {
    return { kind: error.reason, detail: '' }
  }
  if (error instanceof ZodError) {
    // 검증 실패: 어떤 필드가 문제인지만 기록한다(값은 기록하지 않음)
    const detail = error.issues
      .map(i => `${i.path.join('.') || '(root)'}: ${i.code}`)
      .join(', ')
    return { kind: '데이터 검증 실패', detail }
  }
  if (error instanceof NotionMappingError) {
    return { kind: '노션 속성 매핑 실패', detail: error.message }
  }
  if (isNotionClientError(error)) {
    const status = 'status' in error ? Number(error.status) : undefined
    const transient =
      TRANSIENT_CODES.includes(error.code) ||
      status === 429 ||
      (status !== undefined && status >= 500)
    return {
      // 401, 403, 404(object_not_found) 등은 설정 문제라 재시도해도 복구되지 않는다
      kind: transient ? '노션 일시 오류' : '노션 설정·권한 오류',
      detail: `code=${error.code} status=${status ?? '-'}`,
    }
  }
  return {
    kind: '알 수 없는 오류',
    detail: error instanceof Error ? error.name : typeof error,
  }
}

// 조회 중 발생한 모든 오류를 서버 로그에 남기고 일반 오류로 바꿔 던진다.
// 결과 없음·토큰 형식 불량은 오류가 아니라 null로 처리되므로 여기 오지 않는다(호출부가 notFound)
export function toQuoteUnavailableError(
  error: unknown,
  maskedToken: string
): QuoteUnavailableError {
  if (error instanceof QuoteUnavailableError) return error

  const { kind, detail } = classify(error)
  console.error(
    `[notion] 오류(${kind})${detail ? `: ${detail}` : ''} (token=${maskedToken})`
  )
  return new QuoteUnavailableError(kind)
}
