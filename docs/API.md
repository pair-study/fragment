# API 명세서 (초안)

> 기준 문서: `docs/SPEC.md`, `erd.sql`, `apps/api/CLAUDE.md`
> 작성 범위: **FR-1 (계정 및 조직 관리)**. 다른 FR은 이 슬라이스 검토 후 같은 형식으로 이어서 작성한다.
> 상태: 초안 — 구현 전 웹·앱·API 간 계약 조율용. 실제 구현 시 Swagger(`@nestjs/swagger`)가 최종 소스가 된다.

---

## 확정 사항

1. ✅ **근무자 계정 생성 시점** — 사번은 관리자만 발급할 수 있으므로(FR-5.1), 사번이 존재한다는 것 자체가 관리자가 미리 등록을 마쳤다는 뜻이다. 따라서 소셜 로그인은 새 계정을 만들지 않고, **관리자가 FR-5.1에서 미리 등록해 둔 row를 사번 연결 시점에 업데이트**하는 구조로 확정. (`docs/SPEC.md` FR-1.2 반영 완료)
2. ✅ **사번 입력 시 조직 식별 방법** — `organizations.org_code`를 추가해 `workers.employee_number`를 `{org_code}-{관리자 지정값}` 형식의 **전역 유니크** 값으로 저장하기로 확정. 조직마다 `org_code`가 달라 사번 문자열 자체가 전역적으로 겹치지 않으므로, 근무자는 조직을 따로 선택하지 않고 사번 하나만 입력하면 된다. (`erd.sql`, `docs/SPEC.md` FR-1.2/FR-5.1 반영 완료)

---

## 공통 규칙

| 항목      | 내용                                                                                 |
| --------- | ------------------------------------------------------------------------------------ |
| Base URL  | API 서버 루트 (예: `http://localhost:4000`). 별도 global prefix 없음                |
| 인증      | `Authorization: Bearer <accessToken>`. Access Token 15분, Refresh Token 7일(HTTP-only 쿠키) |
| 역할      | `ADMIN`(관리자) / `WORKER`(근무자) — 엔드포인트별 `권한` 항목에 표기                |
| 포맷      | Request/Response 본문은 JSON, 필드명은 camelCase                                    |
| 날짜·시간 | 날짜는 `YYYY-MM-DD`, 시간은 `HH:mm`, 타임스탬프는 ISO 8601 UTC                       |

**에러 응답 포맷** (`apps/api/CLAUDE.md` 기준, 전 엔드포인트 공통)

```json
{
  "statusCode": 400,
  "errorCode": "DUPLICATE_EMAIL",
  "message": "이미 사용 중인 이메일입니다"
}
```

---

## FR-1.1 관리자 계정

| Method | Path                              | 권한    | 설명                  |
| ------ | ---------------------------------- | ------- | --------------------- |
| POST   | `/auth/admin/signup`               | 비인증  | 회원가입               |
| POST   | `/auth/admin/login`                | 비인증  | 로그인                 |
| POST   | `/auth/refresh`                    | Refresh Token | Access Token 재발급 |
| POST   | `/auth/logout`                     | 인증됨  | 로그아웃 (Refresh 쿠키 제거) |
| POST   | `/auth/admin/password-reset/request` | 비인증  | 비밀번호 재설정 요청    |
| POST   | `/auth/admin/password-reset/confirm` | 비인증  | 비밀번호 재설정 확인    |
| DELETE | `/auth/admin/me`                   | ADMIN   | 탈퇴                   |

#### `POST /auth/admin/signup`

**Request**

```json
{ "name": "string", "email": "string", "password": "string" }
```

검증: `name` 1자 이상 · `email` 형식 · `password` 8~128자, 영문·숫자 각 1자 이상 포함

**Response 201**

```json
{
  "accessToken": "string",
  "admin": { "id": "uuid", "name": "string", "email": "string" }
}
```

(Refresh Token은 `Set-Cookie`로 별도 발급)

**에러**

| status | errorCode       | message                |
| ------ | --------------- | ----------------------- |
| 400    | DUPLICATE_EMAIL | 이미 사용 중인 이메일입니다 (활성 계정 기준) |
| 400    | VALIDATION_ERROR | 입력값을 확인해 주세요  |

#### `POST /auth/admin/login`

**Request**: `{ "email": "string", "password": "string" }`

**Response 200**: `{ "accessToken": "string", "admin": {...} }` + `Set-Cookie` Refresh Token

**에러**: `401 INVALID_CREDENTIALS` "이메일 또는 비밀번호가 올바르지 않습니다"

#### `POST /auth/refresh`

권한: Refresh Token 쿠키 필요

**Response 200**: `{ "accessToken": "string" }`

**에러**: `401 INVALID_REFRESH_TOKEN`

#### `POST /auth/logout`

권한: 인증됨 (ADMIN/WORKER 공통)

**Response**: `204` + Refresh Token 쿠키 삭제

#### `POST /auth/admin/password-reset/request`

**Request**: `{ "email": "string" }`

**Response**: `204` (가입 여부와 관계없이 항상 204 — 이메일 존재 여부 노출 방지). 가입된 이메일인 경우에만 내부적으로 재설정 링크 메일 발송.

#### `POST /auth/admin/password-reset/confirm`

**Request**: `{ "token": "string", "newPassword": "string" }`

**Response**: `204`

**에러**: `400 PASSWORD_RESET_TOKEN_EXPIRED` "만료된 링크입니다. 재설정을 다시 요청해 주세요" (발급 후 30분 초과)

#### `DELETE /auth/admin/me`

권한: ADMIN

**Response**: `204`

**에러**: `409 ORGANIZATIONS_EXIST` "조직을 먼저 삭제해 주세요" (소속 조직이 남아있는 경우)

---

## FR-1.2 근무자 계정

| Method | Path                                | 권한        | 설명                          |
| ------ | ------------------------------------ | ----------- | ----------------------------- |
| POST   | `/auth/worker/social-login`          | 비인증      | 카카오/네이버 소셜 로그인       |
| POST   | `/auth/worker/connect-employee-number` | Pending Token | 사번으로 조직 연결 (최초 1회) |
| DELETE | `/auth/worker/me`                    | WORKER      | 탈퇴                           |

#### `POST /auth/worker/social-login`

**Request**

```json
{ "provider": "kakao", "providerAccessToken": "string" }
```

처리: provider사에 토큰 검증 → `providerId` 추출 → `workers`에서 `(oauth_provider, oauth_provider_id)` 일치 row 조회

**Response 200 — 이미 연결된 계정**

```json
{ "linked": true, "accessToken": "string", "worker": { "id": "uuid", "name": "string", "organizationId": "uuid" } }
```

**Response 200 — 미연결 (최초 로그인 또는 사번 미입력 상태)**

```json
{ "linked": false, "pendingToken": "string" }
```

`pendingToken`: `provider`/`providerId` 클레임만 담은 단기 토큰. `connect-employee-number` 호출에만 사용, DB에는 아직 반영되지 않음.

**에러**: `401 SOCIAL_LOGIN_FAILED` "소셜 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요"

#### `POST /auth/worker/connect-employee-number`

권한: `pendingToken` (위 단계에서 발급)

**Request**

```json
{ "employeeNumber": "string" }
```

처리: `employeeNumber`(전역 유니크, `{org_code}-{관리자 지정값}` 형식)로 `oauth_provider IS NULL`인 `workers` row 조회 → 있으면 `oauth_provider`/`oauth_provider_id`를 `pendingToken`의 값으로 채움 → 정식 Access/Refresh Token 발급

**Response 200**

```json
{ "accessToken": "string", "worker": { "id": "uuid", "name": "string", "organizationId": "uuid" } }
```

**에러**: `400 INVALID_EMPLOYEE_NUMBER` "유효하지 않은 사번입니다. 관리자에게 확인해 주세요" (사번 없음 / 이미 다른 계정과 연결됨)

#### `DELETE /auth/worker/me`

권한: WORKER

**Response**: `204`

**에러**: `409 UNSETTLED_PAYROLL_EXISTS` "정산이 완료되지 않은 급여가 있어 탈퇴할 수 없습니다"

---

## FR-1.3 ~ FR-1.6 조직

| Method | Path                                        | 권한               | 설명                          |
| ------ | -------------------------------------------- | ------------------ | ----------------------------- |
| POST   | `/organizations/business-number/verify`     | ADMIN               | 사업자등록번호 진위확인 (생성 전 단독 검증) |
| POST   | `/organizations`                             | ADMIN               | 조직 생성                      |
| GET    | `/organizations`                             | ADMIN               | 내 조직 목록 (FR-1.6 카드 정보 포함) |
| GET    | `/organizations/:id`                         | ADMIN (소속)        | 조직 상세                      |
| PATCH  | `/organizations/:id`                         | ADMIN (소속)        | 조직 수정                      |
| DELETE | `/organizations/:id`                         | ADMIN (소속)        | 조직 삭제                      |
| POST   | `/organizations/:id/closures`                | ADMIN (소속)        | 조직 휴무일 추가                |
| PATCH  | `/organizations/:id/closures/:closureId`     | ADMIN (소속)        | 조직 휴무일 수정                |
| DELETE | `/organizations/:id/closures/:closureId`     | ADMIN (소속)        | 조직 휴무일 삭제                |

#### `POST /organizations/business-number/verify`

**Request**: `{ "businessNumber": "string" }`

**Response 200**: `{ "valid": true }`

**에러**

| status | errorCode                              | message                                    |
| ------ | --------------------------------------- | -------------------------------------------- |
| 400    | INVALID_BUSINESS_NUMBER                 | 유효하지 않은 사업자등록번호입니다           |
| 409    | DUPLICATE_BUSINESS_NUMBER               | 이미 등록된 사업자등록번호입니다             |
| 503    | BUSINESS_NUMBER_VERIFICATION_UNAVAILABLE | 국세청 확인에 실패했습니다. 잠시 후 다시 시도해 주세요 (서버가 내부 3회 재시도 후에도 실패한 경우) |

#### `POST /organizations`

**Request**

```json
{
  "name": "string",
  "businessNumber": "string",
  "address": "string",
  "latitude": 37.5,
  "longitude": 127.0,
  "gpsRadiusMeters": 100,
  "workType": "FIXED",
  "closures": [
    { "label": "string", "closureType": "weekly", "dayOfWeeks": [0, 6] }
  ]
}
```

`closures`는 선택, 생성과 동시에 등록할 항목만 포함 (이후 별도 추가/수정 가능). `orgCode`는 시스템이 자동 발급하므로 요청 바디에 포함하지 않는다.

**Response 201**: 생성된 조직 전체 필드(`orgCode` 포함) + `closures` 배열

**에러**: `400 INVALID_BUSINESS_NUMBER`, `409 DUPLICATE_BUSINESS_NUMBER`, `400 INVALID_GPS_RADIUS`("GPS 허용 반경은 50m~300m 사이여야 합니다"), `400 VALIDATION_ERROR`

#### `GET /organizations`

**Response 200**

```json
[
  {
    "id": "uuid",
    "name": "string",
    "address": "string",
    "activeWorkerCount": 8,
    "currentlyWorkingCount": 3,
    "pendingActionCount": 2
  }
]
```

> `pendingActionCount`는 미처리 근태·승인 대기 요청·인원 미충족 슬롯·확정 대기 스케줄의 합산값. 항목별 세부 분해는 FR-6 대시보드 작업 시 별도 엔드포인트로 다룰 예정.

#### `GET /organizations/:id`

**Response 200**: 조직 전체 필드 + `closures` 배열

#### `PATCH /organizations/:id`

**Request**: 생성 필드 중 `businessNumber` 제외 부분 업데이트 (closures는 별도 엔드포인트로 관리)

**에러**: `400 INVALID_GPS_RADIUS`

#### `DELETE /organizations/:id`

**Response**: `204`

**에러**: `409 ACTIVE_WORKERS_EXIST` "재직 중인 근무자 {count}명이 있습니다. 먼저 퇴사 처리 후 삭제해 주세요" (message에 실제 인원수 삽입)

#### `POST /organizations/:id/closures` / `PATCH .../closures/:closureId`

**Request**

```json
{
  "label": "string",
  "closureType": "biweekly",
  "dayOfWeeks": [0],
  "anchorDate": "2026-06-21"
}
```

| closureType | 필수 필드                  |
| ----------- | --------------------------- |
| `weekly`    | `dayOfWeeks`                |
| `biweekly`  | `dayOfWeeks` + `anchorDate` |
| `specific`  | `closureDate`                |

#### `DELETE /organizations/:id/closures/:closureId`

**Response**: `204`

---

## 다음 단계

- [ ] FR-2 (스케줄 관리) API 작성
- [ ] FR-3 (근태 관리) API 작성
- [ ] FR-4 (급여 계산 엔진) API 작성
- [ ] FR-5 (인력 관리) API 작성
