# invoice-web

노션에 작성한 견적서를 클라이언트가 전용 링크로 웹에서 확인하고 PDF로 저장할 수 있는 견적서 웹 뷰어(MVP)입니다.

## 주요 기능

- **토큰 기반 견적서 조회 (F001)**: `/quote/[token]` 링크로 노션 DB의 견적서와 품목을 서버에서 조회 (비로그인)
- **견적서 상세 표시 (F002)**: 견적번호, 발행일, 유효기간, 고객 정보, 품목 표, 합계, 비고
- **PDF 다운로드 (F003)**: 브라우저 인쇄(`window.print()` + `@media print`)
- **접근 오류/만료 안내 (F004)**: 유효하지 않은 링크, 조회 실패, 만료 배너
- **노션 데이터 검증 (F010)**: Zod로 응답 검증 후 화면 모델로 변환

자세한 내용은 [`docs/PRD.md`](docs/PRD.md)를 참고하세요.

## 기술 스택

Next.js 15.5.3 (App Router, Turbopack) · React 19 · TypeScript 5 · TailwindCSS v4 · shadcn/ui · Zod 4 · Notion API (`@notionhq/client` v5)

## 시작하기

```bash
npm install
cp .env.example .env.local   # 노션 키 입력
npm run dev                  # http://localhost:3000
```

| 환경변수                       | 설명                               |
| ------------------------------ | ---------------------------------- |
| `NOTION_API_KEY`               | 노션 Integration Token (읽기 권한) |
| `NOTION_QUOTES_DATA_SOURCE_ID` | 견적서 DB data source ID           |
| `NOTION_ITEMS_DATA_SOURCE_ID`  | 견적 품목 DB data source ID        |

## 명령어

```bash
npm run dev         # 개발 서버
npm run build       # 프로덕션 빌드
npm run check-all   # typecheck + lint + format:check
```
