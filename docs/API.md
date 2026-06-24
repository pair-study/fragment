# API Contract

이 문서는 프래그먼트 MVP 운영 웹이 사용하는 REST API 계약입니다. 상세 구현 전 프론트엔드와 백엔드가 공유하는 기준으로 사용합니다.

## Common

### Base Path

```txt
/api
```

### Authentication

- Access token은 짧은 만료 시간을 가진 JWT입니다.
- Refresh token은 HTTP-only cookie로 전달합니다.
- 서버는 refresh token 원문을 저장하지 않고 `token_hash`만 저장합니다.
- 인증이 필요한 API는 로그인된 사용자와 단일 조직 범위를 기준으로 동작합니다.

### ID Format

DB의 PK는 `bigint`이지만 JSON 응답에서는 모든 ID를 문자열로 전달합니다.

```json
{
  "id": "1"
}
```

### Error Response

```json
{
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "요청 값이 올바르지 않습니다"
}
```

대표 errorCode:

- `VALIDATION_ERROR`
- `INTERNAL_SERVER_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `DUPLICATE_EMAIL`
- `ORGANIZATION_REQUIRED`
- `ORGANIZATION_ALREADY_EXISTS`
- `WORKER_NOT_FOUND`
- `SCHEDULE_NOT_FOUND`
- `DRAFT_ALREADY_EXISTS`
- `NO_ACTIVE_PLANNING_PERIOD`
- `INVALID_TIME_RANGE`
- `CLOSED_DAY`

## Auth

### POST /auth/signup

**Auth:** None

회원가입 후 로그인 상태로 전환합니다.

Request:

```json
{
  "name": "홍길동",
  "email": "owner@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

Response `201`:

```json
{
  "accessToken": "eyJhbGciOi...",
  "user": {
    "id": "1",
    "email": "owner@example.com",
    "name": "홍길동"
  },
  "hasOrganization": false
}
```

### POST /auth/login

**Auth:** None

Request:

```json
{
  "email": "owner@example.com",
  "password": "password123"
}
```

Response `200`:

```json
{
  "accessToken": "eyJhbGciOi...",
  "user": {
    "id": "1",
    "email": "owner@example.com",
    "name": "홍길동"
  },
  "hasOrganization": true
}
```

### POST /auth/logout

**Auth:** Refresh cookie

현재 refresh token을 폐기합니다.

Response `204`: body 없음

### POST /auth/refresh

**Auth:** Refresh cookie

Refresh token cookie로 access token과 refresh token을 갱신합니다.

Response `200`:

```json
{
  "accessToken": "eyJhbGciOi...",
  "user": {
    "id": "1",
    "email": "owner@example.com",
    "name": "홍길동"
  },
  "hasOrganization": true
}
```

### GET /auth/me

**Auth:** Bearer token

Response `200`:

```json
{
  "user": {
    "id": "1",
    "email": "owner@example.com",
    "name": "홍길동"
  },
  "organization": {
    "id": "1",
    "name": "프래그먼트 카페"
  }
}
```

## Organization

### POST /organization

**Auth:** Bearer token

단일 조직을 생성합니다. 이미 조직이 있으면 `ORGANIZATION_ALREADY_EXISTS`를 반환합니다.

Request:

```json
{
  "name": "프래그먼트 카페",
  "businessHours": [
    {
      "dayOfWeek": "MON",
      "isClosed": false,
      "openTime": "09:00",
      "closeTime": "18:00",
      "closesNextDay": false
    }
  ]
}
```

Response `201`: `OrganizationDetail`

### GET /organization

**Auth:** Bearer token

Response `200`: `OrganizationDetail`

### PATCH /organization

**Auth:** Bearer token

Request:

```json
{
  "name": "프래그먼트 본점",
  "businessHours": [
    {
      "dayOfWeek": "MON",
      "isClosed": false,
      "openTime": "10:00",
      "closeTime": "19:00",
      "closesNextDay": false
    }
  ]
}
```

Response `200`: `OrganizationDetail`

## Active Schedule Planning Period

### GET /organization/active-schedule-planning-period

**Auth:** Bearer token

현재 진행 중인 스케줄링 기간을 조회합니다.

Response `200`:

```json
{
  "period": {
    "id": "1",
    "startDate": "2026-07-01",
    "endDate": "2026-07-31"
  }
}
```

기간이 없으면 `period`는 `null`입니다.

### PUT /organization/active-schedule-planning-period

**Auth:** Bearer token

조직의 현재 진행 중인 스케줄링 기간을 생성하거나 교체합니다.

Request:

```json
{
  "startDate": "2026-07-01",
  "endDate": "2026-07-31"
}
```

Response `200`: `ActiveSchedulePlanningPeriod`

### DELETE /organization/active-schedule-planning-period

**Auth:** Bearer token

Response `204`: body 없음

## Workers

### GET /workers

**Auth:** Bearer token

Response `200`:

```json
{
  "items": [
    {
      "id": "1",
      "employeeCode": "W-0001",
      "name": "김민수",
      "weeklyContractHours": 40
    }
  ]
}
```

### POST /workers

**Auth:** Bearer token

사번은 서버가 자동 생성합니다.

Request:

```json
{
  "name": "김민수",
  "weeklyContractHours": 40
}
```

Response `201`: `Worker`

### PATCH /workers/:workerId

**Auth:** Bearer token

Request:

```json
{
  "name": "김민준",
  "weeklyContractHours": 32
}
```

Response `200`: `Worker`

### DELETE /workers/:workerId

**Auth:** Bearer token

인력을 삭제합니다. 과거 스케줄 배정 기록의 `worker_id`는 `null`로 처리되며 배정 기록 자체는 보존됩니다.

Response `204`: body 없음

## Availability

### GET /availability

**Auth:** Bearer token

Query:

```txt
workerId=1&startDate=2026-07-01&endDate=2026-07-31
```

Response `200`:

```json
{
  "items": [
    {
      "id": "1",
      "workerId": "1",
      "availableDate": "2026-07-01",
      "startsAt": "2026-07-01T10:00:00.000Z",
      "endsAt": "2026-07-01T14:00:00.000Z"
    }
  ]
}
```

### PUT /availability/bulk

**Auth:** Bearer token

선택 범위의 특정 인력 가능 시간을 전체 교체합니다.

Request:

```json
{
  "workerId": "1",
  "startDate": "2026-07-01",
  "endDate": "2026-07-31",
  "items": [
    {
      "availableDate": "2026-07-01",
      "startsAt": "2026-07-01T10:00:00.000Z",
      "endsAt": "2026-07-01T14:00:00.000Z"
    }
  ]
}
```

Response `200`:

```json
{
  "items": []
}
```

## Minimum Staffing Rules

### GET /staffing-rules

**Auth:** Bearer token

Response `200`:

```json
{
  "items": [
    {
      "id": "1",
      "dayOfWeek": "MON",
      "startTime": "10:00",
      "endTime": "14:00",
      "endsNextDay": false,
      "requiredCount": 2
    }
  ]
}
```

### POST /staffing-rules

**Auth:** Bearer token

Request:

```json
{
  "dayOfWeek": "MON",
  "startTime": "10:00",
  "endTime": "14:00",
  "endsNextDay": false,
  "requiredCount": 2
}
```

Response `201`: `MinimumStaffingRule`

### PATCH /staffing-rules/:ruleId

**Auth:** Bearer token

Response `200`: `MinimumStaffingRule`

### DELETE /staffing-rules/:ruleId

**Auth:** Bearer token

Response `204`: body 없음

## Schedules

### POST /schedules/recommend

**Auth:** Bearer token

현재 active planning period, 인력, 가능 시간, 최소 인원 조건을 기준으로 DRAFT 스케줄을 생성합니다. 같은 입력 조건의 DRAFT가 있으면 `DRAFT_ALREADY_EXISTS`를 반환합니다.

Request:

```json
{
  "startDate": "2026-07-01",
  "endDate": "2026-07-31"
}
```

Response `201`: `ScheduleDetail`

### GET /schedules/draft

**Auth:** Bearer token

Query:

```txt
startDate=2026-07-01&endDate=2026-07-31
```

Response `200`:

```json
{
  "schedule": null
}
```

스케줄이 있으면 `schedule`은 `ScheduleDetail`입니다.

### POST /schedules/:scheduleId/assignments

**Auth:** Bearer token

Request:

```json
{
  "workerId": "1",
  "workDate": "2026-07-01",
  "startsAt": "2026-07-01T10:00:00.000Z",
  "endsAt": "2026-07-01T14:00:00.000Z"
}
```

Response `201`: `ScheduleAssignment`

### PATCH /schedules/:scheduleId/assignments/:assignmentId

**Auth:** Bearer token

Request: assignment 생성과 동일한 필드의 부분 업데이트

Response `200`: `ScheduleAssignment`

### DELETE /schedules/:scheduleId/assignments/:assignmentId

**Auth:** Bearer token

Response `204`: body 없음

### POST /schedules/:scheduleId/confirm

**Auth:** Bearer token

DRAFT 스케줄을 CONFIRMED로 변경합니다.

Response `200`: `ScheduleDetail`

## Schedule History

### GET /schedule-history

**Auth:** Bearer token

Query:

```txt
year=2026&month=7
```

`month`가 없으면 해당 연도의 확정 이력을 조회합니다.

Response `200`:

```json
{
  "items": [
    {
      "id": "1",
      "startDate": "2026-07-01",
      "endDate": "2026-07-31",
      "confirmedAt": "2026-06-22T08:00:00.000Z"
    }
  ]
}
```

### GET /schedule-history/:scheduleId

**Auth:** Bearer token

Response `200`: `ScheduleHistoryDetailResponse`

### GET /schedule-history/:scheduleId/export.csv

**Auth:** Bearer token

Response `200`: `text/csv`

## Dashboard

### GET /dashboard

**Auth:** Bearer token

Response `200`:

```json
{
  "organization": {
    "id": "1",
    "name": "프래그먼트 카페"
  },
  "latestConfirmedSchedule": null
}
```

### GET /dashboard/latest-confirmed-schedule/export.csv

**Auth:** Bearer token

Response `200`: `text/csv`
