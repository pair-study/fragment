# Swagger / OpenAPI Plan

이 문서는 프래그먼트 MVP의 Swagger UI 도입 범위와 작업 규칙을 정의합니다.

## Decision

- OpenAPI 명세는 정적 파일 `docs/openapi.yaml`로 관리합니다.
- Express route 파일에는 OpenAPI JSDoc을 작성하지 않습니다.
- `docs/API.md`는 사람이 읽는 API 계약서로 유지합니다.
- `docs/openapi.yaml`은 Swagger UI가 읽는 기계 문서로 유지합니다.

## Branch

Swagger UI 세팅 작업 브랜치:

```txt
feature/api-swagger-docs
```

이 브랜치는 `feature/api-erd-shared-contract`의 ERD/API/shared 계약을 기준으로 합니다.

## Scope

초기 작업에 포함합니다.

- `docs/openapi.yaml` 추가
- Swagger UI 라우트 추가
- `GET /api/docs` 제공
- 공통 metadata 작성
- 공통 security scheme 작성
- 공통 schema 작성
  - `ErrorResponse`
  - `User`
  - `OrganizationSummary`
  - `OrganizationBusinessHour`
  - `OrganizationDetail`
- 초기 endpoint 문서화
  - `POST /auth/signup`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `POST /auth/refresh`
  - `GET /auth/me`
  - `POST /organization`
  - `GET /organization`
  - `PATCH /organization`

초기 작업에 포함하지 않습니다.

- 실제 API 비즈니스 로직 구현
- 전체 endpoint 문서 완성
- Web 연결
- 테스트 코드 작성

## Packages

`apps/api`에 추가할 패키지:

```bash
pnpm --filter @fragment/api add swagger-ui-express yaml
pnpm --filter @fragment/api add -D @types/swagger-ui-express
```

역할:

- `swagger-ui-express`: Express에서 Swagger UI를 제공합니다.
- `yaml`: `docs/openapi.yaml`을 읽어 JS 객체로 파싱합니다.
- `@types/swagger-ui-express`: TypeScript 타입을 제공합니다.

## File Structure

```txt
docs/
  API.md
  ERD.md
  SWAGGER.md
  openapi.yaml

apps/api/src/
  docs/
    swagger.ts
```

## Implementation Notes

- Swagger UI 라우트는 `/api/docs`로 제공합니다.
- OpenAPI `servers[0].url`은 local 개발 기준 `http://localhost:3001/api`로 시작합니다.
- 운영 배포 후 production server URL을 추가합니다.
- 인증 API를 제외한 운영 API는 `bearerAuth` 기준으로 문서화합니다.
- Refresh token cookie는 `cookieAuth` security scheme으로 표현합니다.
- API endpoint 구현 PR은 해당 endpoint의 `docs/openapi.yaml`도 함께 갱신합니다.

## Done Criteria

- `http://localhost:3001/api/docs`에서 Swagger UI가 열립니다.
- `docs/openapi.yaml`이 YAML로 파싱됩니다.
- Auth/Organization endpoint가 Swagger UI에 표시됩니다.
- 공통 error response schema가 재사용됩니다.
