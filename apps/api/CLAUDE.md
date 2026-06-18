# apps/api — CLAUDE.md (백엔드 API 서버)

## 역할 및 범위

**Express 기반 REST API 서버**입니다.
인증, 조직 관리, 스케줄 엔진, 근태 처리, 급여 계산, Push 알림 발송을 담당합니다.
모든 비즈니스 로직의 원천이며, 웹·앱 양쪽에서 소비합니다.

## 기술 스택

| 항목           | 기술                  | 버전                                      |
| -------------- | --------------------- | ----------------------------------------- |
| Framework      | Express               | 5.x                                       |
| Language       | TypeScript            | 5.8.x                                     |
| Runtime        | Node.js               | 22.x LTS                                  |
| Database       | PostgreSQL            | 17.x                                      |
| ORM            | Prisma                | 6.8.x (`packages/database`에서 관리)      |
| Validation     | Zod                   | 3.24.x (`packages/shared` 우선 활용)      |
| Auth           | JWT                   | jsonwebtoken 또는 jose                    |
| API Docs       | OpenAPI 또는 Notion   | MVP 단계에서는 계약 문서 우선             |
| Task Scheduler | node-cron 또는 worker | cron 기반 자동화 도입 시 선택             |
| Queue (선택적) | BullMQ 또는 bull      | 급여 계산·알림 대량 발송 비동기화 시 도입 |
| Testing (Unit) | Jest                  | 29.x                                      |
| Testing (E2E)  | Supertest             | 7.x                                       |

## 디렉터리 구조

```
# apps/api/
├── src/
│   ├── auth/             # JWT 발급, 소셜 OAuth, 가드
│   ├── organizations/    # 조직 CRUD (FR-1.3~1.6)
│   ├── members/          # 근로자 초대·등록·퇴사 (FR-5)
│   ├── schedules/        # 스케줄 생성·확정·교환 (FR-2)
│   ├── attendance/       # 출퇴근 체크, 근태 수정 (FR-3)
│   ├── payroll/          # 급여 계산 엔진, 명세서 발급 (FR-4)
│   ├── notifications/    # Expo Push 알림 발송
│   └── common/           # 공통 미들웨어, 에러 핸들러, 유틸
└── test/                 # E2E 테스트

# packages/database/       ← apps/api와 동일 레벨, 별도 패키지
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── prisma.ts
│   └── index.ts
└── package.json
```

## 주요 규칙

### 라우터 구조 (Express)

- **도메인 단위로 라우터를 분리**합니다. 라우터는 HTTP 요청/응답 처리만 담당하고, 비즈니스 로직은 service 함수에 작성합니다.
- Router → Service → Prisma 계층을 기본으로 합니다. 별도 Repository 추상화는 중복이 명확해질 때만 도입합니다.
- 공통 미들웨어와 에러 핸들러는 `common/` 아래에 모아 라우터에서 재사용합니다.

### Prisma 사용 규칙

- Prisma schema, migrations, client helper, `seed.ts`는 모두 **`packages/database`에서 관리**합니다. `apps/api`에 Prisma 관련 파일을 직접 두지 않습니다.
- `apps/api`에서는 `packages/database`가 export하는 `prisma` 또는 `createPrismaClient`를 사용합니다.
- 쿼리 결과 타입은 Prisma가 생성하는 타입을 활용합니다. 별도로 타입을 재정의하지 않습니다.
- 마이그레이션은 `packages/database`에서 `prisma migrate dev`로 생성하고, 파일명에 목적을 명확히 기재합니다.
- **소프트 딜리트**(FR-1.5, FR-5.2)는 `deletedAt` 필드로 구현합니다. 모든 조회 쿼리에서 `deletedAt: null` 필터를 기본으로 포함합니다.

### 인증 및 인가

- **JWT Access Token** (유효기간 15분) + **Refresh Token** (7일, HTTP-only 쿠키) 방식을 사용합니다.
- 관리자 전용 엔드포인트에는 role 확인 미들웨어를 적용합니다.
- 근로자 전용 엔드포인트에는 role 확인 미들웨어를 적용합니다.

### 유효성 검증

- 요청 body, params, query는 **Zod schema**로 검증합니다.
- 공유 가능한 입력/응답 스키마는 `packages/shared`에 정의하고 API와 클라이언트에서 함께 사용합니다.

### 급여 계산 엔진 (FR-4)

- 급여 계산 로직은 `payroll/` 도메인의 service 함수에 순수 함수로 구현합니다.
- 계산 결과는 항상 **감사 로그**(`PayrollAuditLog`)에 스냅샷(임금명세서 템플릿 포함)과 함께 저장합니다.
- 성능 목표: 1초 이하 응답 (FR-4.1). 계산이 복잡한 경우 Bull Queue로 비동기 처리합니다.

### 스케줄 자동화 (FR-2.2, FR-3.3)

- cron 기반 작업은 node-cron 또는 별도 worker 프로세스로 구현합니다.
- Cron 표현식은 상수로 분리하여 관리합니다.
- 퇴근 미처리 자동화 타임라인(예정 퇴근 +30분, +2시간, +12시간)은 attendance 도메인의 scheduler/worker에서 처리합니다.

### API 문서화

- 엔드포인트별 요청/응답 계약을 OpenAPI 문서 또는 Notion에 기록합니다.
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

### 데이터 보존 정책

- 근태·급여 이력은 **3년 보존** (근로기준법 제42조)합니다. 실제 삭제 로직을 구현하지 않습니다.
- 탈퇴 근로자 데이터는 익명화(`anonymize()`) 처리 후 보존합니다.

## 테스트

```bash
pnpm --filter @ilgam/api test        # 단위 테스트 (Jest)
pnpm --filter @ilgam/api test:e2e    # E2E 테스트 (Supertest)
pnpm --filter @ilgam/api test:cov    # 커버리지
```

- **Service 단위 테스트**: 의존성은 Jest mock으로 처리합니다. Prisma는 필요 시 `mockDeep<PrismaClient>()`로 모킹합니다.
- **E2E 테스트**: 테스트 전용 PostgreSQL DB(`DATABASE_URL_TEST`)를 사용합니다. 각 테스트 전후로 DB를 초기화합니다.
- 커버리지 목표: 핵심 service 레이어 80% 이상.

## 개발 실행

```bash
pnpm --filter @ilgam/api start:dev   # http://localhost:3001 (watch 모드)
pnpm --filter @ilgam/api build
pnpm --filter @ilgam/api lint

# Prisma (packages/database에서 실행)
pnpm --filter @ilgam/database db:migrate  # prisma migrate dev
pnpm --filter @ilgam/database db:studio   # Prisma Studio (DB GUI)
pnpm --filter @ilgam/database db:seed     # 시드 데이터 삽입
```

## 환경 변수 (.env.example)

`DATABASE_URL`, `DATABASE_URL_TEST`는 `packages/database/.env`에서 관리합니다.
나머지 변수는 `apps/api/.env`에서 관리합니다.

```
# packages/database/.env
DATABASE_URL=postgresql://user:password@localhost:5432/ilgam
DATABASE_URL_TEST=postgresql://user:password@localhost:5432/ilgam_test

# apps/api/.env
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
KAKAO_CLIENT_ID=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
EXPO_ACCESS_TOKEN=           # Expo Push 알림 발송용
```
