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

## 운영 가이드

상세 구조와 오류 처리는 [`docs/guides/notion-api-database.md`](docs/guides/notion-api-database.md)를 참고하세요.

### 노션 설정 체크리스트

- [ ] Notion Integration을 만들고 **읽기 권한(Read content)만** 부여, token을 `NOTION_API_KEY`에 저장
- [ ] 견적서 DB와 품목 DB **둘 다**에서 Connections로 Integration 추가 (빠뜨리면 오류 화면)
- [ ] 각 DB의 data source ID를 환경변수에 저장 (Database ID가 아님)
- [ ] 속성 이름·타입을 가이드 2절과 동일하게 구성. 견적서의 `항목`과 품목의 `Invoices`는 양방향 relation
- [ ] `토큰` 속성은 **text(rich_text) 타입 유지** (select 등으로 바꾸면 오류)
- [ ] 견적서마다 서로 다른 토큰 입력 후 링크로 접속해 확인

### 토큰 발급·교체

토큰은 32자 무작위 문자열(허용 문자 `A-Za-z0-9_-`, 16~128자)이며 견적서마다 달라야 합니다. 대소문자를 구분합니다.

```powershell
# PowerShell
[Convert]::ToBase64String((1..24 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ })).Replace('+','-').Replace('/','_')
```

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

- 발급한 토큰을 노션 견적서의 `토큰`에 붙여 넣고, 링크는 `https://<배포 도메인>/quote/<토큰>` 입니다
- **교체(유출 시 폐기)**: `토큰` 값을 새 값으로 덮어쓰면 이전 링크는 즉시 404, 새 링크는 정상 표시됩니다
- 같은 토큰이 2건 이상이면 오류 화면이 납니다

### 인쇄(PDF) 시 주의

브라우저 인쇄 대화상자의 **"머리글 및 바닥글"** 옵션이 켜져 있으면 PDF에 URL(토큰 포함)이 찍힙니다. PDF를 타인에게 전달하기 전에 이 옵션을 끄세요.

### 운영상 한계

- 품목 순서는 견적서에 품목을 **연결한 순서**입니다
- `총 금액`은 직접 입력하는 값이며 품목 합과 달라도 `총 금액`을 표시합니다(서버 로그에 경고)
- 유효기간이 지나도 배너만 표시하고 금액은 노출합니다(결정 필요 항목)
- 매 요청 노션을 조회하므로 수정이 즉시 반영됩니다. 정상 응답은 약 0.6초입니다
- 노션에 상시 테스트 데이터를 두지 않고, 검증 때마다 `TEMP-` 견적서를 만들었다가 삭제합니다

### 배포(Vercel) 개요

1. GitHub 저장소를 Vercel 프로젝트로 연결
2. 환경변수 3종을 Production에 등록 (Preview에는 실제 데이터 접근이 가능하므로 등록 여부를 신중히 결정)
3. 배포 후 테스트 견적서 링크, 404, PDF 저장을 확인

## 명령어

```bash
npm run dev         # 개발 서버
npm run build       # 프로덕션 빌드
npm run check-all   # typecheck + lint + format:check
```
