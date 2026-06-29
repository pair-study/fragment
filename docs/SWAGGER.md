# OpenAPI / Swagger 관리 기준

이 문서는 프래그먼트 MVP의 Markdown API 명세와 OpenAPI 문서 관리 기준을 정의합니다.

## 문서 역할

- `docs/API.md`는 사람이 읽는 MVP REST API 계약서로 유지합니다.
- `docs/openapi.yaml`은 OpenAPI 형식이 필요한 endpoint부터 점진적으로 관리합니다.
- Express route 파일에는 OpenAPI JSDoc을 작성하지 않습니다.

## 현재 OpenAPI 문서화 범위

현재 `docs/openapi.yaml`은 구현된 API 중 아래 범위를 문서화합니다.

- 공통 metadata
- 공통 security scheme
  - `bearerAuth`
  - `cookieAuth`
- 공통 response
  - `ValidationError`
  - `Unauthorized`
  - `NotFound`
- Auth endpoint
  - `POST /auth/signup`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `POST /auth/refresh`
  - `GET /auth/me`
- Organization endpoint
  - `POST /organization`
  - `GET /organization`
  - `PATCH /organization`
- Active schedule planning period endpoint
  - `GET /organization/active-schedule-planning-period`
  - `PUT /organization/active-schedule-planning-period`
  - `DELETE /organization/active-schedule-planning-period`
- Availability endpoint
  - `GET /availability`
  - `PUT /availability/bulk`
- Workers endpoint
  - `GET /workers`
  - `POST /workers`
  - `PATCH /workers/{workerId}`
  - `DELETE /workers/{workerId}`
- Staffing Rules endpoint
  - `GET /staffing-rules`
  - `POST /staffing-rules`
  - `PATCH /staffing-rules/{ruleId}`
  - `DELETE /staffing-rules/{ruleId}`
- Schedules endpoint
  - `POST /schedules/recommend`
  - `GET /schedules/draft`
  - `POST /schedules/{scheduleId}/assignments`
  - `PATCH /schedules/{scheduleId}/assignments/{assignmentId}`
  - `DELETE /schedules/{scheduleId}/assignments/{assignmentId}`
  - `POST /schedules/{scheduleId}/confirm`

## 변경 기준

- API 계약이 변경되면 `docs/API.md`를 먼저 갱신합니다.
- `docs/openapi.yaml`에 포함된 endpoint를 변경하는 경우 OpenAPI 문서도 함께 갱신합니다.
- `docs/openapi.yaml`에 아직 포함되지 않은 endpoint는 해당 endpoint를 OpenAPI 문서화 범위에 추가하는 작업에서 갱신합니다.
- 인증 API를 제외한 운영 API는 `bearerAuth` 기준으로 문서화합니다.
- Refresh token cookie는 `cookieAuth` security scheme으로 표현합니다.

## Swagger UI 도입 시 기준

Swagger UI를 API 서버에서 제공하는 작업을 진행할 경우 아래 기준을 따릅니다.

- Swagger UI 라우트는 `/api/docs`로 제공합니다.
- 원본 OpenAPI JSON은 `/api/openapi.json`로 제공합니다.
- OpenAPI `servers[0].url`은 local 개발 기준 `http://localhost:3001/api`로 시작합니다.
- 운영 배포에서는 `API_PUBLIC_BASE_URL=https://<api-domain>/api`를 설정해 production server URL을 첫 번째 server로 제공합니다.
- `docs/openapi.yaml`이 YAML로 파싱되어야 합니다.
- Swagger UI에 `docs/openapi.yaml`의 endpoint와 공통 schema가 표시되어야 합니다.

## 외부 공유 기준

외부 공유용 Swagger는 아래 상태를 만족한 후 공유합니다.

- 공유 URL은 `https://<api-domain>/api/docs`입니다.
- `https://<api-domain>/api/openapi.json`에서 원본 OpenAPI 문서를 내려받을 수 있어야 합니다.
- Swagger UI의 server URL이 `localhost`가 아니라 운영 API URL이어야 합니다.
- 실제 구현되지 않은 endpoint는 OpenAPI에 포함하지 않습니다.
- 인증이 필요한 API는 `Authorize` 버튼에 로그인 API에서 받은 bearer token을 넣어 테스트합니다.

## Swagger UI 도입 시 추가 패키지

Swagger UI를 API 서버에서 제공하는 작업을 진행할 때 `apps/api`에 아래 패키지를 추가합니다.

```bash
pnpm --filter @fragment/api add swagger-ui-express yaml
pnpm --filter @fragment/api add -D @types/swagger-ui-express
```

역할:

- `swagger-ui-express`: Express에서 Swagger UI를 제공합니다.
- `yaml`: `docs/openapi.yaml`을 읽어 JS 객체로 파싱합니다.
- `@types/swagger-ui-express`: TypeScript 타입을 제공합니다.
