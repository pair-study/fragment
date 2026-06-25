# apps/api — CLAUDE.md (백엔드 API 서버)

## 역할 및 범위

**Express 기반 REST API 서버**입니다.
MVP에서는 운영 웹이 소비하는 인증, 단일 조직 관리, 인력 관리, 가능 시간 관리, 최소 인원 조건 관리, 스케줄 추천·조정·확정·보관함 조회 API를 담당합니다.

## 기술 스택

기술 스택과 버전은 루트 `docs/stack.md`를 단일 출처로 따른다. 이 문서에는 API 서버에서 사용하는 기술의 역할과 적용 규칙만 기록한다.

- Framework: Express
- Language: TypeScript
- Runtime: Node.js
- Database: PostgreSQL
- ORM: Prisma (`packages/database`에서 관리)
- Validation: Zod (`packages/shared` 우선 활용)
- Auth: JWT
- API Docs: Markdown API 명세 + OpenAPI
- Testing: Jest + Supertest

## 디렉터리 구조

```
# apps/api/
├── src/
│   ├── app.ts            # Express 앱 설정
│   ├── main.ts           # 서버 엔트리포인트
│   ├── routes/           # Express router 등록
│   ├── modules/          # 도메인별 handler/service
│   ├── middlewares/      # 공통 Express middleware
│   ├── errors/           # 공통 error class
│   ├── common/           # 공통 상수
│   ├── utils/            # API 내부 유틸
│   └── types/            # API 타입 확장

# packages/database/       ← apps/api와 동일 레벨, 별도 패키지
├── prisma/
│   └── schema.prisma
├── src/
│   ├── prisma.ts
│   └── index.ts
└── package.json
```

API 도메인 구현이 추가되면 `src/routes`와 `src/modules` 아래에 도메인 단위 파일/디렉터리를 생성합니다.

```txt
src/
├── routes/
│   ├── auth.routes.ts
│   ├── organization.routes.ts
│   └── staffing-rules.routes.ts
└── modules/
    ├── auth/
    │   ├── auth.handlers.ts
    │   └── auth.service.ts
    ├── organization/
    │   ├── organization.handlers.ts
    │   └── organization.service.ts
    └── staffing-rules/
        ├── staffing-rules.handlers.ts
        └── staffing-rules.service.ts
```

## 주요 규칙

### 라우터 구조 (Express)

- **도메인 단위로 라우터를 분리**합니다. 라우터는 HTTP 요청/응답 처리만 담당하고, 비즈니스 로직은 service 함수에 작성합니다.
- Router → Service → Prisma 계층을 기본으로 합니다. 별도 Repository 추상화는 중복이 명확해질 때만 도입합니다.
- 공통 미들웨어는 `middlewares/`, 공통 에러 클래스는 `errors/`, 공통 상수는 `common/` 아래에 둡니다.

### Prisma 사용 규칙

- Prisma schema, migrations, client helper, `seed.ts`는 모두 **`packages/database`에서 관리**합니다. `apps/api`에 Prisma 관련 파일을 직접 두지 않습니다.
- `apps/api`에서는 `packages/database`가 export하는 `createPrismaClient()`만 사용합니다.
- `prisma` singleton 직접 import/use는 금지합니다.
- 앱 시작점에서 `createPrismaClient()`로 Prisma client를 한 번 생성하고, `createApp({ prisma })` 형태로 app/router/service에 주입합니다.
- 테스트에서는 실제 client 대신 mock/fake Prisma client를 주입할 수 있게 구현합니다.
- 쿼리 결과 타입은 Prisma가 생성하는 타입을 활용합니다. 별도로 타입을 재정의하지 않습니다.
- 마이그레이션은 `packages/database`에서 `prisma migrate dev`로 생성하고, 파일명에 목적을 명확히 기재합니다.

### 인증 및 인가

- **JWT Access Token** (유효기간 15분) + **Refresh Token** (7일, HTTP-only 쿠키) 방식을 사용합니다.
- MVP에서는 단일 사용자 계정만 사용합니다.
- 운영 화면 엔드포인트에는 인증 확인 미들웨어를 적용합니다.
- 단일 조직 생성 전에는 조직 생성 API만 허용하고, 운영 화면 API는 조직 존재 여부를 확인합니다.

### 유효성 검증

- 요청 body, params, query는 **Zod schema**로 검증합니다.
- 공유 가능한 입력/응답 스키마는 `packages/shared`에 정의하고 API와 클라이언트에서 함께 사용합니다.

### 스케줄 추천 및 확정

- 추천 생성 API는 조직의 인력, 가능 시간, 최소 인원 조건, 근무 시작/종료 날짜를 기준으로 `DRAFT` 스케줄을 생성합니다.
- 같은 입력 조건의 DRAFT가 이미 있으면 중복 생성하지 않습니다.
- 사용자는 DRAFT 스케줄을 직접 추가·수정·삭제할 수 있습니다.
- 확정 API는 DRAFT를 `CONFIRMED`로 변경하고, 이후 보관함 조회/export 대상으로 사용합니다.
- 확정된 스케줄은 조회/export 대상으로 사용합니다.

### API 문서화

- 엔드포인트별 요청/응답 계약은 `docs/API.md`에 기록합니다.
- `docs/openapi.yaml`에 포함된 엔드포인트를 변경하는 경우 OpenAPI 문서도 함께 갱신합니다.
- Zod schema를 사용하는 경우 문서와 schema가 어긋나지 않도록 변경 시 함께 갱신합니다.

### 에러 응답 형식

모든 에러 응답은 다음 형식을 따릅니다:

```json
{
  "statusCode": 400,
  "errorCode": "DUPLICATE_EMAIL",
  "message": "이미 사용 중인 이메일입니다"
}
```

- `errorCode`는 `common/constants/error-codes.ts`에서 상수로 관리합니다.

## 테스트

API 테스트는 새로 만든 핵심 로직이 깨졌는지 확인하는 범위부터 작성합니다.

- **Service 단위 테스트**: `src/**/*.spec.ts`에 작성합니다. 권한, DB 접근 조건, 비즈니스 규칙을 Jest mock으로 검증합니다.
- **API 통합 테스트**: `test/**/*.test.ts`에 작성합니다. Supertest로 인증, 요청 검증, 성공 흐름 중 대표 케이스를 검증합니다.
- 버그 수정이나 리뷰 반영으로 검증 로직을 수정한 경우 재발 방지 테스트를 1개 이상 추가합니다.
- 테스트 전용 DB가 필요한 시점에 `DATABASE_URL_TEST`와 초기화 전략을 함께 정의합니다.

## 개발 실행

```bash
pnpm --filter @fragment/api start:dev   # http://localhost:3001 (watch 모드)
pnpm --filter @fragment/api build
pnpm --filter @fragment/api lint

# Prisma (packages/database에서 실행)
pnpm --filter @fragment/database db:migrate  # prisma migrate dev
pnpm --filter @fragment/database db:studio   # Prisma Studio (DB GUI)
pnpm --filter @fragment/database db:seed     # 시드 데이터 삽입
```

## 환경 변수 (.env.example)

`DATABASE_URL`은 `packages/database/.env`에서 관리합니다.
나머지 변수는 `apps/api/.env`에서 관리합니다.

```
# packages/database/.env
DATABASE_URL=postgresql://user:password@localhost:5432/fragment

# apps/api/.env
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
```
