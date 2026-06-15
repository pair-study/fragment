# apps/api — CLAUDE.md (백엔드 API 서버)

## 역할 및 범위

**NestJS 기반 REST API 서버**입니다.
인증, 조직 관리, 스케줄 엔진, 근태 처리, 급여 계산, Push 알림 발송을 담당합니다.
모든 비즈니스 로직의 원천이며, 웹·앱 양쪽에서 소비합니다.

## 기술 스택

| 항목           | 기술                                | 버전                                                  |
| -------------- | ----------------------------------- | ----------------------------------------------------- |
| Framework      | NestJS                              | 11.x                                                  |
| Language       | TypeScript                          | 5.8.x                                                 |
| Runtime        | Node.js                             | 22.x LTS                                              |
| Database       | PostgreSQL                          | 17.x                                                  |
| ORM            | Prisma                              | 6.8.x (`packages/database`에서 관리)                  |
| Validation     | class-validator + class-transformer | 0.14.x / 0.5.x                                        |
| Auth           | @nestjs/jwt + @nestjs/passport      | 10.x / 10.x                                           |
| API Docs       | @nestjs/swagger                     | 11.x                                                  |
| Task Scheduler | @nestjs/schedule                    | 4.x                                                   |
| Queue (선택적) | @nestjs/bull + bull                 | 4.x / 4.x (급여 계산·알림 대량 발송 비동기화 시 도입) |
| Testing (Unit) | Jest                                | 29.x                                                  |
| Testing (E2E)  | Supertest                           | 7.x                                                   |

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
│   └── common/           # 공통 필터, 인터셉터, 데코레이터, 파이프
└── test/                 # E2E 테스트

# packages/database/       ← apps/api와 동일 레벨, 별도 패키지
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── prisma.service.ts
│   └── database.module.ts  # DatabaseModule로 export
└── package.json
```

## 주요 규칙

### 모듈 구조 (NestJS)

- **도메인 단위로 모듈을 분리**합니다. 하나의 모듈이 다른 모듈의 내부 서비스를 직접 import하지 않고, 필요한 경우 해당 모듈을 `exports`에 노출합니다.
- Controller → Service → PrismaService 계층을 엄격히 지킵니다. 별도 Repository 클래스를 두지 않으며, Service가 `PrismaService`를 직접 주입받아 쿼리를 작성합니다.
- Controller는 요청/응답 처리만 담당합니다. 비즈니스 로직은 Service에 작성합니다.

### Prisma 사용 규칙

- Prisma schema, migrations, `PrismaService`, `seed.ts`는 모두 **`packages/database`에서 관리**합니다. `apps/api`에 Prisma 관련 파일을 직접 두지 않습니다.
- `apps/api`에서는 `packages/database`가 export하는 `DatabaseModule`을 `AppModule`에 import해서 사용합니다.
- 쿼리 결과 타입은 Prisma가 생성하는 타입을 활용합니다. 별도로 타입을 재정의하지 않습니다.
- 마이그레이션은 `packages/database`에서 `prisma migrate dev`로 생성하고, 파일명에 목적을 명확히 기재합니다.
- **소프트 딜리트**(FR-1.5, FR-5.2)는 `deletedAt` 필드로 구현합니다. 모든 조회 쿼리에서 `deletedAt: null` 필터를 기본으로 포함합니다.

### 인증 및 인가

- **JWT Access Token** (유효기간 15분) + **Refresh Token** (7일, HTTP-only 쿠키) 방식을 사용합니다.
- 관리자 전용 엔드포인트에는 `@Roles('ADMIN')` 가드를 적용합니다.
- 근로자 전용 엔드포인트에는 `@Roles('WORKER')` 가드를 적용합니다.

### 유효성 검증

- 모든 DTO는 **class-validator + class-transformer**로 정의합니다.
- 전역 `ValidationPipe`를 `whitelist: true`, `forbidNonWhitelisted: true` 옵션으로 설정합니다.

### 급여 계산 엔진 (FR-4)

- 급여 계산 로직은 `payroll/` 모듈의 `PayrollCalculatorService`에 순수 함수로 구현합니다.
- 계산 결과는 항상 **감사 로그**(`PayrollAuditLog`)에 스냅샷(임금명세서 템플릿 포함)과 함께 저장합니다.
- 성능 목표: 1초 이하 응답 (FR-4.1). 계산이 복잡한 경우 Bull Queue로 비동기 처리합니다.

### 스케줄 자동화 (FR-2.2, FR-3.3)

- `@nestjs/schedule`의 `@Cron` 데코레이터로 주기 작업을 구현합니다.
- Cron 표현식은 상수로 분리하여 관리합니다.
- 퇴근 미처리 자동화 타임라인(예정 퇴근 +30분, +2시간, +12시간)은 `AttendanceScheduler`에서 처리합니다.

### API 문서화

- 모든 Controller와 DTO에 `@ApiTags`, `@ApiOperation`, `@ApiResponse` 데코레이터를 작성합니다.
- Swagger UI: `http://localhost:4000/api` (개발 환경만 활성화)

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
pnpm --filter @ilgam/api test         # 단위 테스트 (Jest)
pnpm --filter @ilgam/api test:e2e     # E2E 테스트 (Supertest)
pnpm --filter @ilgam/api test:cov     # 커버리지
```

- **Service 단위 테스트**: 의존성은 Jest mock으로 처리합니다. Prisma는 `mockDeep<PrismaClient>()`로 모킹합니다.
- **E2E 테스트**: 테스트 전용 PostgreSQL DB(`DATABASE_URL_TEST`)를 사용합니다. 각 테스트 전후로 DB를 초기화합니다.
- 커버리지 목표: Service 레이어 80% 이상.

## 개발 실행

```bash
pnpm --filter @ilgam/api start:dev   # http://localhost:4000 (watch 모드)
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
