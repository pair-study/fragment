-- ============================================================
-- 일감 (근무 플랫폼) ERD — PostgreSQL DDL
-- 기준: docs/SPEC.md / drawdb > Import SQL (PostgreSQL) 로 임포트
-- ============================================================
-- [수정 이력]
--   - admins.email 인라인 UNIQUE 제거 → 부분 유니크 인덱스로 교체 (소프트 딜리트 재가입 대응)
--   - organization_closures: anchor_date 컬럼 추가 + CHECK 재구성 (biweekly 기준점 명시)
--   - fixed_schedule_patterns: ends_next_day 컬럼 추가 (schedules 표현 방식과 통일)
--   - minimum_staffing_rules: 자정 넘김 구간은 두 행 분리 방식 유지 (CHECK 그대로)
--   - day_of_weeks 배열 컬럼에 GIN 인덱스 추가 (organization_closures, minimum_staffing_rules)
--   - organizations.org_code 추가, workers.employee_number를 "{org_code}-{관리자 지정값}"
--     형식의 전역 유니크 값으로 변경 (소셜 로그인 시 조직 선택 없이 사번만으로 연결)
-- ============================================================


-- ============================================================
-- 1. 관리자 계정 (FR-1.1)
-- ============================================================
CREATE TABLE admins (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(50)  NOT NULL,
  -- [수정] 인라인 UNIQUE 제거 → 소프트 딜리트된 이메일로 재가입 허용
  --        활성 행에만 유니크 보장: uq_admins_email_active (하단 인덱스 참조)
  email         VARCHAR(255) NOT NULL,
  password_hash TEXT         NOT NULL,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. 조직 (매장) (FR-1.3)
--    사업자번호는 생성 후 변경 불가 (애플리케이션 레벨 처리)
--    work_type: FIXED(고정 근무) / FLEXIBLE(신청 근무) / BOTH(둘 다)
--    org_code: 가입 시 시스템이 자동 발급. 생성 후 변경 불가
--              (workers.employee_number 접두사로 쓰여 변경 시 기존 사번과 불일치 발생)
-- ============================================================
CREATE TABLE organizations (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id          UUID          NOT NULL,
  name              VARCHAR(50)   NOT NULL,
  business_number   CHAR(10)      NOT NULL UNIQUE,
  org_code          VARCHAR(10)   NOT NULL UNIQUE,
  address           TEXT          NOT NULL,
  latitude          DECIMAL(10,8) NOT NULL,
  longitude         DECIMAL(11,8) NOT NULL,
  gps_radius_meters INT           NOT NULL DEFAULT 100
                      CHECK (gps_radius_meters BETWEEN 50 AND 300),
  work_type         TEXT          NOT NULL
                      CHECK (work_type IN ('FIXED', 'FLEXIBLE', 'BOTH')),
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. 조직 휴무일 (FR-1.3)
--    매주(weekly)   : day_of_weeks 사용 (0=일 ~ 6=토), anchor_date NULL
--    격주(biweekly) : day_of_weeks + anchor_date 사용
--                     anchor_date = "이 날짜가 속한 주가 휴무 주"인 기준 날짜
--                     UI에서 "이번 주 / 다음 주" 선택 → 앱 레이어에서 해당 요일 날짜 계산 후 저장
--                     조회: FLOOR((target_date - anchor_date) / 7)::INT % 2 = 0 이면 휴무
--    특정일(specific): closure_date 사용, day_of_weeks/anchor_date NULL
-- ============================================================
CREATE TABLE organization_closures (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL,
  label           TEXT        NOT NULL,
  closure_type    TEXT        NOT NULL
                    CHECK (closure_type IN ('weekly', 'biweekly', 'specific')),
  day_of_weeks    SMALLINT[],
  closure_date    DATE,
  -- [추가] biweekly 격주 기준점 날짜. weekly/specific은 NULL
  anchor_date     DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- [수정] biweekly에 anchor_date 필수 조건 추가
  CHECK (
    (closure_type = 'weekly'
      AND day_of_weeks IS NOT NULL
      AND closure_date IS NULL
      AND anchor_date IS NULL)
    OR
    (closure_type = 'biweekly'
      AND day_of_weeks IS NOT NULL
      AND closure_date IS NULL
      AND anchor_date IS NOT NULL)
    OR
    (closure_type = 'specific'
      AND closure_date IS NOT NULL
      AND day_of_weeks IS NULL
      AND anchor_date IS NULL)
  )
);

-- ============================================================
-- 4. 시간대별 최소 인원 조건 (FR-2 조직 스케줄 설정)
--    day_of_weeks: 배열로 복수 요일 저장 (0=일 ~ 6=토)
--    자정을 넘기는 구간(예: 22:00~02:00)은 두 행으로 분리 입력
--      예) 22:00~24:00 / 00:00~02:00
--    UI에서 자동 분할 처리 권장
-- ============================================================
CREATE TABLE minimum_staffing_rules (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL,
  label           TEXT        NOT NULL,
  day_of_weeks    SMALLINT[]  NOT NULL,
  start_time      TIME        NOT NULL,
  end_time        TIME        NOT NULL,
  min_count       INT         NOT NULL CHECK (min_count >= 1),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- ============================================================
-- 5. 급여 정책 (FR-5.3)
--    pay_type에 따라 해당 금액 필드만 저장, 나머지는 NULL
--    period_start_day ~ pay_day: 매월 N일 (1~31) — Decision D
--    공휴일 수당은 MVP 제외
--    근무자에게 지정된 정책 삭제 시 소프트 딜리트
-- ============================================================
CREATE TABLE pay_policies (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID          NOT NULL,
  name              VARCHAR(100)  NOT NULL,
  pay_type          TEXT          NOT NULL
                      CHECK (pay_type IN ('hourly', 'daily', 'monthly')),
  hourly_rate       DECIMAL(12,2) CHECK (hourly_rate > 0),
  daily_rate        DECIMAL(12,2) CHECK (daily_rate > 0),
  monthly_rate      DECIMAL(12,2) CHECK (monthly_rate > 0),
  tax_type          TEXT          NOT NULL
                      CHECK (tax_type IN (
                        '3_3_percent',
                        '4_insurance',
                        '4_insurance_income',
                        'employment_only'
                      )),
  night_pay_rate    DECIMAL(4,2)  NOT NULL DEFAULT 1.5
                      CHECK (night_pay_rate >= 1.5),
  overtime_pay_rate DECIMAL(4,2)  NOT NULL DEFAULT 1.5
                      CHECK (overtime_pay_rate >= 1.5),
  period_start_day  INT           NOT NULL CHECK (period_start_day BETWEEN 1 AND 31),
  period_end_day    INT           NOT NULL CHECK (period_end_day BETWEEN 1 AND 31),
  pay_day           INT           NOT NULL CHECK (pay_day BETWEEN 1 AND 31),
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CHECK (
    (pay_type = 'hourly'  AND hourly_rate  IS NOT NULL
                          AND daily_rate   IS NULL
                          AND monthly_rate IS NULL)
    OR
    (pay_type = 'daily'   AND daily_rate   IS NOT NULL
                          AND hourly_rate  IS NULL
                          AND monthly_rate IS NULL)
    OR
    (pay_type = 'monthly' AND monthly_rate IS NOT NULL
                          AND hourly_rate  IS NULL
                          AND daily_rate   IS NULL)
  )
);

-- ============================================================
-- 6. 근무자 (FR-1.2, FR-5.1)
--    MVP: 근무자 1명 = 조직 1개 (Decision F)
--    관리자가 먼저 등록(oauth 필드 NULL) → 소셜 로그인 후 사번으로 연결
--    employee_number: "{organizations.org_code}-{관리자 지정값}" 형식으로 저장.
--      org_code는 조직마다 달라 전역 유일성이 자동 보장됨 — 소셜 로그인 후
--      조직 선택 없이 사번 하나만으로 worker row를 조회할 수 있다.
--      접두사 결합은 애플리케이션 레벨에서 처리 (다른 테이블 컬럼이라 DB CHECK로 검증 불가).
--    resigned_at: 퇴사 처리 시 기록
--    deleted_at: 계정 탈퇴 시 소프트 딜리트
-- ============================================================
CREATE TABLE workers (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID         NOT NULL,
  pay_policy_id     UUID,
  name              VARCHAR(50)  NOT NULL,
  employee_number   VARCHAR(30)  NOT NULL UNIQUE,
  schedule_type     TEXT         NOT NULL
                      CHECK (schedule_type IN ('FIXED', 'FLEXIBLE')),
  phone             VARCHAR(20),
  joined_at         DATE         NOT NULL,
  resigned_at       DATE,
  oauth_provider    TEXT         CHECK (oauth_provider IN ('kakao', 'naver')),
  oauth_provider_id TEXT,
  push_token        TEXT         UNIQUE,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (oauth_provider, oauth_provider_id),
  CHECK (
    (oauth_provider IS NULL AND oauth_provider_id IS NULL)
    OR
    (oauth_provider IS NOT NULL AND oauth_provider_id IS NOT NULL)
  )
);

-- ============================================================
-- 7. FIXED 근무자 고정 스케줄 패턴 (FR-2.3, FR-5.1)
--    apply_from: 변경 반영 시점 (즉시/다음 주/다음 달/직접 입력)
--    동일 근무자·요일·apply_from 조합으로 변경 이력 관리
--    ends_next_day: schedules 테이블과 표현 방식 통일
--                   야간 고정조 패턴(예: 22:00~02:00)을 명확히 표현하기 위해 추가
-- ============================================================
CREATE TABLE fixed_schedule_patterns (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id     UUID        NOT NULL,
  day_of_week   SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME        NOT NULL,
  end_time      TIME        NOT NULL,
  -- [추가] 자정을 넘기는 야간 고정 패턴 표현. schedules.ends_next_day와 동일한 의미
  ends_next_day BOOLEAN     NOT NULL DEFAULT FALSE,
  break_start   TIME,
  break_end     TIME,
  apply_from    DATE        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (worker_id, day_of_week, apply_from),
  CHECK (
    (break_start IS NULL AND break_end IS NULL)
    OR
    (break_start IS NOT NULL AND break_end IS NOT NULL)
  )
);

-- ============================================================
-- 8. 스케줄 사이클 (FR-2 신청 근무 사이클 시작 — Decision A)
--    work_type이 FLEXIBLE 또는 BOTH인 조직에서만 사용
--    날짜 제약:
--      submit_end_date < work_start_date
--      confirm_end_date >= submit_end_date
--      confirm_end_date < work_start_date
-- ============================================================
CREATE TABLE schedule_cycles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID        NOT NULL,
  work_start_date   DATE        NOT NULL,
  work_end_date     DATE        NOT NULL,
  submit_start_date DATE        NOT NULL,
  submit_end_date   DATE        NOT NULL,
  confirm_end_date  DATE        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (work_end_date > work_start_date),
  CHECK (submit_end_date > submit_start_date),
  CHECK (submit_end_date < work_start_date),
  CHECK (confirm_end_date >= submit_end_date),
  CHECK (confirm_end_date < work_start_date)
);

-- ============================================================
-- 9. 스케줄 (FR-2.2, FR-2.3)
--     FIXED → 생성 즉시 PUBLISHED
--     FLEXIBLE → DRAFT(관리자 배치 작업 중, 근무자 비공개) → PUBLISHED
--     schedule_cycle_id: FLEXIBLE 스케줄에만 연결, FIXED는 NULL
--     ends_next_day: 야간 근무로 자정을 넘기는 경우 TRUE
-- ============================================================
CREATE TABLE schedules (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id         UUID        NOT NULL,
  organization_id   UUID        NOT NULL,
  schedule_cycle_id UUID,
  date              DATE        NOT NULL,
  start_time        TIME        NOT NULL,
  end_time          TIME        NOT NULL,
  ends_next_day     BOOLEAN     NOT NULL DEFAULT FALSE,
  break_start       TIME,
  break_end         TIME,
  status            TEXT        NOT NULL DEFAULT 'DRAFT'
                      CHECK (status IN ('DRAFT', 'PUBLISHED', 'CANCELLED')),
  published_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (break_start IS NULL AND break_end IS NULL)
    OR
    (break_start IS NOT NULL AND break_end IS NOT NULL)
  ),
  CHECK (
    (status = 'DRAFT'     AND published_at IS NULL     AND cancelled_at IS NULL)
    OR
    (status = 'PUBLISHED' AND published_at IS NOT NULL  AND cancelled_at IS NULL)
    OR
    (status = 'CANCELLED' AND cancelled_at IS NOT NULL)
  )
);

-- ============================================================
-- 10. 근무 불가 신청 (FR-2.1 — Decision B)
--     사이클 오픈 시 대상 기간 전 날짜를 AVAILABLE로 자동 생성
-- ============================================================
CREATE TABLE work_unavailability_requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id         UUID        NOT NULL,
  schedule_cycle_id UUID        NOT NULL,
  date              DATE        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'AVAILABLE'
                      CHECK (status IN ('AVAILABLE', 'UNAVAILABLE', 'TIME_RESTRICTED')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (worker_id, schedule_cycle_id, date)
);

-- ============================================================
-- 11. 시간대 불가 조건 (FR-2.1 — Decision B, 1:N)
--     TIME_RESTRICTED 상태의 work_unavailability_requests에 종속
-- ============================================================
CREATE TABLE unavailability_time_slots (
  id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_unavailability_request_id UUID NOT NULL,
  unavailable_start              TIME NOT NULL,
  unavailable_end                TIME NOT NULL,
  CHECK (unavailable_end > unavailable_start)
);

-- ============================================================
-- 12. 근태 레코드 (FR-3)
--     [생성] 스케줄 PUBLISHED 시 EXPECTED 상태로 자동 생성 (스케줄 1:1)
--
--     [상태 전이 — 앱 레이어 책임]
--     EXPECTED → PRESENT          : 출근 체크인 (checked_in_at 기록)
--     PRESENT  → COMPLETED        : 퇴근 체크아웃 (checked_out_at 기록)
--     EXPECTED → ABSENT           : 스케줄 종료 +12h까지 출근 기록 없음 (배치 전환)
--     PRESENT  → MISSING_CHECKOUT : 스케줄 종료 +12h까지 퇴근 기록 없음 (배치 전환)
--
--     [설계 의도]
--     EXPECTED/ABSENT, PRESENT/MISSING_CHECKOUT은 체크인·아웃 컬럼 조합이 동일하여
--     DB CHECK로 구분 불가. 상태 일관성은 전적으로 앱 레이어에서 보장.
-- ============================================================
CREATE TABLE attendances (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id                 UUID        NOT NULL UNIQUE,
  worker_id                   UUID        NOT NULL,
  status                      TEXT        NOT NULL DEFAULT 'EXPECTED'
                                CHECK (status IN (
                                  'EXPECTED', 'PRESENT', 'COMPLETED',
                                  'ABSENT', 'MISSING_CHECKOUT'
                                )),
  checked_in_at               TIMESTAMPTZ,
  checked_out_at              TIMESTAMPTZ,
  is_late                     BOOLEAN     NOT NULL DEFAULT FALSE,
  overtime_requested          BOOLEAN     NOT NULL DEFAULT FALSE,
  overtime_reason             TEXT,
  requested_overtime_start_at TIMESTAMPTZ,
  requested_overtime_end_at   TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 13. 근태 수정 요청 (FR-3.3)
--     reason_type=OTHER일 때 reason 필수는 애플리케이션 레벨 처리
-- ============================================================
CREATE TABLE attendance_correction_requests (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id          UUID        NOT NULL,
  worker_id              UUID        NOT NULL,
  reason_type            TEXT        NOT NULL
                           CHECK (reason_type IN (
                             'GPS_ERROR',
                             'MISSING_CHECKIN',
                             'MISSING_CHECKOUT',
                             'ABSENT_DISPUTE',
                             'OVERTIME_CORRECTION',
                             'OTHER'
                           )),
  requested_check_in_at  TIMESTAMPTZ,
  requested_check_out_at TIMESTAMPTZ,
  reason                 TEXT,
  status                 TEXT        NOT NULL DEFAULT 'PENDING'
                           CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  reviewed_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (status = 'PENDING'                 AND reviewed_at IS NULL)
    OR
    (status IN ('APPROVED', 'REJECTED') AND reviewed_at IS NOT NULL)
    OR
    (status = 'CANCELLED')
  )
);

-- 동일 근태에 PENDING 수정 요청이 하나만 존재하도록 제한
CREATE UNIQUE INDEX uq_correction_request_pending
  ON attendance_correction_requests (attendance_id)
  WHERE status = 'PENDING';

-- ============================================================
-- 14. 급여 명세서 (FR-4 — Decision C)
--     signed / signed_at: 근무자 서명 저장 (Decision C)
--     pay_policy_snapshot: 계산 시점 급여 정책 값 스냅샷
--     deduction 항목: tax_type에 따라 해당 항목만 채워짐
--     status: calculating(서명→계산중) → calculated → issued
-- ============================================================
CREATE TABLE payroll_statements (
  id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id                UUID          NOT NULL,
  organization_id          UUID          NOT NULL,
  pay_policy_snapshot      JSONB         NOT NULL,
  period_start             DATE          NOT NULL,
  period_end               DATE          NOT NULL,
  pay_date                 DATE          NOT NULL,
  status                   TEXT          NOT NULL DEFAULT 'calculating'
                             CHECK (status IN ('calculating', 'calculated', 'issued')),
  signed                   BOOLEAN       NOT NULL DEFAULT FALSE,
  signed_at                TIMESTAMPTZ,
  base_pay                 DECIMAL(12,2) NOT NULL DEFAULT 0,
  weekly_holiday_pay       DECIMAL(12,2) NOT NULL DEFAULT 0,
  night_shift_pay          DECIMAL(12,2) NOT NULL DEFAULT 0,
  overtime_pay             DECIMAL(12,2) NOT NULL DEFAULT 0,
  income_tax               DECIMAL(12,2) NOT NULL DEFAULT 0,
  local_income_tax         DECIMAL(12,2) NOT NULL DEFAULT 0,
  national_pension         DECIMAL(12,2) NOT NULL DEFAULT 0,
  health_insurance         DECIMAL(12,2) NOT NULL DEFAULT 0,
  long_term_care_insurance DECIMAL(12,2) NOT NULL DEFAULT 0,
  employment_insurance     DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_deduction          DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_pay                  DECIMAL(12,2) NOT NULL DEFAULT 0,
  issued_at                TIMESTAMPTZ,
  calculated_at            TIMESTAMPTZ,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (worker_id, period_start, period_end),
  CHECK (period_end > period_start),
  CHECK (
    (status IN ('calculating', 'calculated') AND issued_at IS NULL)
    OR
    (status = 'issued' AND issued_at IS NOT NULL)
  ),
  CHECK (
    (signed = FALSE AND signed_at IS NULL)
    OR
    (signed = TRUE  AND signed_at IS NOT NULL)
  )
);

-- ============================================================
-- 15. 추가 지급·공제 항목 (FR-4.3 — Decision E)
--     item_type: PAYMENT(지급) / DEDUCTION(공제)
--     amount: 항상 양수, 부호는 item_type으로 구분 (Decision E)
-- ============================================================
CREATE TABLE payroll_extra_items (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_statement_id UUID          NOT NULL,
  label                TEXT          NOT NULL,
  item_type            TEXT          NOT NULL
                         CHECK (item_type IN ('PAYMENT', 'DEDUCTION')),
  amount               DECIMAL(12,2) NOT NULL CHECK (amount > 0)
);

-- ============================================================
-- 16. 감사 로그 (FR-3.3, FR-3.4, FR-4.4 — Decision G)
--     actor_id: 관리자 직접 행위는 admins FK / 시스템 자동 처리는 NULL
--     payload: before_data / after_data / snapshot 등 용도별 저장
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT        NOT NULL
                CHECK (action_type IN (
                  'ATTENDANCE_MANUAL_INPUT',
                  'ATTENDANCE_CORRECTION_APPROVED',
                  'ATTENDANCE_CORRECTION_REJECTED',
                  'PAYROLL_CALCULATED',
                  'PAYROLL_RECALCULATED'
                )),
  actor_id    UUID,
  target_id   UUID        NOT NULL,
  target_type TEXT        NOT NULL CHECK (target_type IN ('attendance', 'payroll')),
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- FK 제약 (테이블 정의 완료 후 일괄 추가)
-- ============================================================

ALTER TABLE organizations
  ADD CONSTRAINT fk_org_admin
    FOREIGN KEY (admin_id) REFERENCES admins(id);

ALTER TABLE organization_closures
  ADD CONSTRAINT fk_closure_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

ALTER TABLE minimum_staffing_rules
  ADD CONSTRAINT fk_staffing_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

ALTER TABLE pay_policies
  ADD CONSTRAINT fk_pay_policy_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

ALTER TABLE workers
  ADD CONSTRAINT fk_worker_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
  ADD CONSTRAINT fk_worker_pay_policy
    FOREIGN KEY (pay_policy_id) REFERENCES pay_policies(id);

ALTER TABLE fixed_schedule_patterns
  ADD CONSTRAINT fk_fsp_worker
    FOREIGN KEY (worker_id) REFERENCES workers(id);

ALTER TABLE schedule_cycles
  ADD CONSTRAINT fk_cycle_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

ALTER TABLE schedules
  ADD CONSTRAINT fk_schedule_worker
    FOREIGN KEY (worker_id) REFERENCES workers(id),
  ADD CONSTRAINT fk_schedule_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
  ADD CONSTRAINT fk_schedule_cycle
    FOREIGN KEY (schedule_cycle_id) REFERENCES schedule_cycles(id);

ALTER TABLE work_unavailability_requests
  ADD CONSTRAINT fk_unavail_worker
    FOREIGN KEY (worker_id) REFERENCES workers(id),
  ADD CONSTRAINT fk_unavail_cycle
    FOREIGN KEY (schedule_cycle_id) REFERENCES schedule_cycles(id);

ALTER TABLE unavailability_time_slots
  ADD CONSTRAINT fk_time_slot_request
    FOREIGN KEY (work_unavailability_request_id) REFERENCES work_unavailability_requests(id)
    ON DELETE CASCADE;

ALTER TABLE attendances
  ADD CONSTRAINT fk_attendance_schedule
    FOREIGN KEY (schedule_id) REFERENCES schedules(id),
  ADD CONSTRAINT fk_attendance_worker
    FOREIGN KEY (worker_id) REFERENCES workers(id);

ALTER TABLE attendance_correction_requests
  ADD CONSTRAINT fk_acr_attendance
    FOREIGN KEY (attendance_id) REFERENCES attendances(id),
  ADD CONSTRAINT fk_acr_worker
    FOREIGN KEY (worker_id) REFERENCES workers(id);

ALTER TABLE payroll_statements
  ADD CONSTRAINT fk_payroll_worker
    FOREIGN KEY (worker_id) REFERENCES workers(id),
  ADD CONSTRAINT fk_payroll_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

ALTER TABLE payroll_extra_items
  ADD CONSTRAINT fk_extra_payroll
    FOREIGN KEY (payroll_statement_id) REFERENCES payroll_statements(id)
    ON DELETE CASCADE;

ALTER TABLE audit_logs
  ADD CONSTRAINT fk_audit_actor
    FOREIGN KEY (actor_id) REFERENCES admins(id);


-- ============================================================
-- 인덱스
-- ============================================================

-- [수정] admins.email: 소프트 딜리트된 행 제외하고 유니크 보장
CREATE UNIQUE INDEX uq_admins_email_active
  ON admins (email) WHERE deleted_at IS NULL;

-- [추가] day_of_weeks 배열 조회를 위한 GIN 인덱스
--        "특정 요일이 포함된 규칙"을 = ANY(day_of_weeks) 로 효율적으로 조회 가능
CREATE INDEX idx_org_closures_dow
  ON organization_closures USING GIN (day_of_weeks);

CREATE INDEX idx_staffing_dow
  ON minimum_staffing_rules USING GIN (day_of_weeks);
