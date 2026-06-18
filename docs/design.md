# 일감 디자인 컨벤션

이 문서는 일감 관리자 웹(`apps/web`)을 먼저 구현하기 위한 1차 디자인 컨벤션이다. 웹 UI는 **shadcn/ui + Tailwind CSS** 조합을 기준으로 한다. shadcn/ui를 그대로 나열하는 문서가 아니라, 프로젝트에서 shadcn/ui primitive를 Tailwind CSS 유틸리티와 함께 어떤 기준으로 조합하고 도메인 컴포넌트로 감쌀지 정한다.

## 구현 스택

| 플랫폼 | 컴포넌트 | 스타일링 | 역할 |
| --- | --- | --- | --- |
| 관리자 웹 | shadcn/ui | Tailwind CSS | Radix 기반 접근성 primitive를 Tailwind 유틸리티로 조합 |

웹에서 shadcn/ui는 `Button`, `Input`, `Dialog` 같은 컴포넌트의 구조와 접근성 동작을 맡고, Tailwind CSS는 배치, 간격, 색상, 반응형 스타일을 표현한다.

## 역할

- `docs/design.md`: 디자인 의사결정과 사용 규칙을 기록한다.
- `apps/web/src/components/ui`: shadcn/ui primitive를 둔다.
- `apps/web/src/components`: 레이아웃, 공통 폼, 공통 표시 컴포넌트를 둔다.
- `apps/web/src/features`: 조직, 스케줄, 급여처럼 도메인 의미가 있는 컴포넌트를 둔다.

새 화면을 만들 때는 페이지에서 shadcn/ui를 직접 길게 조합하지 않는다. 먼저 재사용 가능한 단위로 감싸고, 페이지는 그 컴포넌트를 배치하는 역할만 맡긴다.

```txt
shadcn/ui primitive
-> 공통 컴포넌트
-> 도메인 컴포넌트
-> 페이지
```

## 제품 톤

일감은 스케줄 편성, 근태 관리, 급여 정산을 다루는 운영 도구다. 화면은 마케팅 페이지처럼 보이면 안 된다. 정보가 빠르게 읽히고, 저장/삭제/발급 같은 운영 액션이 명확해야 한다.

- 과한 hero, 장식용 gradient, glow, decorative card layout은 사용하지 않는다.
- 메인 화면은 넓은 작업 공간과 명확한 섹션으로 구성한다.
- 카드 안에 또 다른 카드를 넣지 않는다. 반복 항목, 모달, 독립 도구에만 카드를 쓴다.
- 숫자, 상태, 처리 필요 항목이 먼저 읽히게 한다.
- 인터랙션은 조용하게 만든다. 애니메이션은 필요한 경우에만 200ms 이하로 사용한다.

## 디자인 토큰

초기 토큰은 클로드가 생성한 `colors.css`, `typography.css`, `spacing.css`, `fonts.css`를 기준으로 삼는다. 실제 구현 시에는 Tailwind v4 theme token과 shadcn CSS variable에 맞춰 옮긴다.

### 색상

브랜드 색상은 파란색 하나를 중심으로 한다.

| 용도 | 토큰 | 값 | 사용 |
| --- | --- | --- | --- |
| Primary | `--color-primary` | `#2563EB` | 주요 버튼, 링크, 활성 상태 |
| Primary hover | `--color-primary-hover` | `#1D4ED8` | hover, press |
| Primary subtle | `--color-primary-subtle` | `#DBEAFE` | 선택 카드, 보조 강조 배경 |
| Focus ring | `--focus-ring` | `#BFDBFE` | input, button focus |

상태 색상은 도메인 전체에서 같은 의미로 쓴다.

| 상태 | 색상 | 의미 |
| --- | --- | --- |
| Confirmed | Green | 확정, 승인, 발급 완료, 정상 |
| Pending | Amber | 검토 필요, 대기, 지각/연장 주의 |
| Cancelled | Red | 취소, 거절, 오류, 위험 작업 |
| Draft | Purple | 초안, 생성 중, 발급 전 계산 단계 |
| Unprocessed | Gray | 미처리, 비활성, 데이터 없음 |

주의:
- 색상만으로 상태를 전달하지 않는다. 배지 텍스트를 함께 쓴다.
- 한 화면의 주요 강조색은 Primary Blue 하나로 제한한다.
- 위험 작업은 Red를 쓰되, 평소 화면에서는 과하게 노출하지 않는다.

### 서피스

| 토큰 | 값 | 사용 |
| --- | --- | --- |
| `--surface-canvas` | `#FFFFFF` | 카드, 모달, 메인 패널 |
| `--surface-secondary` | `#F9FAFB` | 페이지 배경, 테이블 헤더, 빈 상태 배경 |
| `--surface-tertiary` | `#F3F4F6` | 보조 패널, disabled 배경 |
| `--surface-sidebar` | `#111827` | 관리자 사이드바 |

관리자 웹은 기본적으로 밝은 작업 화면을 사용한다. 다크 영역은 사이드바처럼 내비게이션 구획을 명확히 나눌 때만 쓴다.

### 타이포그래피

폰트는 Pretendard를 사용한다.

- weight는 `400`, `500`, `600`, `700`만 사용한다.
- 본문과 버튼에는 과한 자간 조정을 하지 않는다.
- 금액, 시간, 인원 수는 `tabular-nums`를 사용한다.
- 페이지 제목에는 `text-balance`, 설명 문장에는 `text-pretty`를 우선 적용한다.

관리자 웹 타입 기준:

| 역할 | 크기 | 굵기 | 사용 |
| --- | --- | --- | --- |
| Page title | 24px | 700 | 페이지 제목 |
| Section title | 18px | 600 | 큰 섹션 제목 |
| Card title | 15px | 600 | 카드, 폼 패널 제목 |
| Body | 14px | 400 | 일반 텍스트, 테이블 셀 |
| Body strong | 14px | 600 | 라벨, 강조 셀 |
| Caption | 12px | 400/600 | 보조 설명, 배지, 메타 정보 |
| Numeric display | 28px | 700 | 금액, 통계 숫자 |

### 간격과 Radius

간격은 8px 기반으로 맞춘다.

| 토큰 | 값 | 사용 |
| --- | --- | --- |
| `xs` | 8px | 아이콘-텍스트 간격, 작은 내부 간격 |
| `sm` | 12px | 필드 내부 보조 간격 |
| `md` | 16px | 카드 내부 기본 간격 |
| `xl` | 24px | 페이지 패딩, 섹션 간격 |
| `xxl` | 32px | 큰 레이아웃 간격 |
| `section` | 40px | 큰 섹션 사이 |

Radius:

| 토큰 | 값 | 사용 |
| --- | --- | --- |
| `sm` | 6px | 작은 버튼, 요일 칩 |
| `md` | 8px | 기본 버튼, input, nav item |
| `lg` | 12px | 카드, 테이블 컨테이너 |
| `xl` | 16px | Dialog, 큰 패널 |
| `pill` | 9999px | Badge, status pill |

shadcn 기본 radius와 충돌하지 않도록 실제 구현에서는 CSS variable `--radius`를 기준으로 조정한다.

## shadcn/ui 사용 원칙

### 기본 규칙

- shadcn/ui는 primitive로 사용하고, 도메인 의미가 있는 컴포넌트로 한 번 감싼다.
- keyboard, focus, dialog, dropdown 동작은 직접 만들지 않는다.
- 아이콘은 lucide-react를 사용한다.
- 아이콘만 있는 버튼에는 반드시 `aria-label`을 넣는다.
- destructive action은 반드시 `AlertDialog`를 사용한다.
- loading은 `Skeleton`을 먼저 고려한다.
- error는 액션이 발생한 위치 가까이에 표시한다.

### 우선 설치/사용할 shadcn 컴포넌트

관리자 웹 1차 구현에 필요한 primitive:

- `Button`
- `Input`
- `Label`
- `Form`
- `Select`
- `Checkbox`
- `Switch`
- `Slider`
- `Card`
- `Badge`
- `Separator`
- `Tabs`
- `Dialog`
- `AlertDialog`
- `DropdownMenu`
- `Popover`
- `Command`
- `Table`
- `Tooltip`
- `ScrollArea`
- `Skeleton`
- `Calendar`

## 레이아웃 규칙

### Tailwind 값 사용

Tailwind 기본 scale과 `globals.css`의 theme token을 우선 사용한다. `max-w-[440px]`, `h-[52px]`, `px-[18px]`처럼 픽셀 값을 arbitrary value로 직접 넣지 않는다.

예외는 다음 경우로 제한한다.

- 외부 API나 캔버스처럼 고정 픽셀 계약이 있는 경우
- 디자인 토큰으로 아직 승격하기 전의 임시 실험 코드
- 한 번 쓰고 끝나는 실제 이미지/미디어의 고유 크기

반복될 가능성이 있거나 컴포넌트 규칙이 되는 값은 Tailwind scale(`max-w-md`, `h-12`, `px-4`)을 먼저 쓰고, scale로 표현하기 어렵다면 `globals.css`의 CSS 변수와 `@theme` token으로 추가한다.

### 관리자 Shell

관리자 화면은 기본적으로 다음 구조를 쓴다.

```txt
AdminShell
├─ SidebarNav
└─ Main
   ├─ Topbar
   └─ PageContent
```

- 사이드바 폭은 240px 기준으로 한다.
- 상단바 높이는 56px 기준으로 한다.
- 페이지 좌우 패딩은 24px 또는 32px 범위에서 화면 밀도에 맞춘다.
- 콘텐츠 최대 폭은 화면 성격에 따라 정한다.
  - 인증 카드: 480px 안팎
  - 폼 중심 화면: 960px 안팎
  - 운영 대시보드/목록: 1200px 이상 가능

### 빈 상태

빈 상태는 한 가지 주요 행동만 제공한다.

예:
- 조직이 없음 -> `조직 등록하기`
- 급여 명세가 없음 -> `급여 계산 시작`
- 스케줄 조건 없음 -> `시간대 조건 추가`

빈 상태에 긴 설명을 넣지 않는다. 제목, 1-2줄 설명, 주요 버튼, 보조 안내 정도로 끝낸다.

## 폼 규칙

폼은 React Hook Form + Zod + shadcn `Form`을 사용한다.

필드 구성 순서:

```txt
FormItem
├─ FormLabel
├─ FormControl
├─ FormDescription
└─ FormMessage
```

규칙:

- 필수값은 label 옆에 `*`로 표시한다.
- placeholder는 예시 또는 입력 형식을 알려줄 때만 쓴다.
- 설명 문구는 저장 후 어디에 쓰이는지 알려줄 때 사용한다.
- 에러 메시지는 필드 바로 아래에 표시한다.
- readonly 필드는 disabled와 구분한다. 읽을 수는 있지만 수정할 수 없는 정보는 readonly를 쓴다.
- 사업자 등록번호처럼 검증이 필요한 필드는 입력과 검증 버튼을 같은 행에 둔다.

공통 폼 컴포넌트 후보:

- `PasswordInput`
- `BusinessNumberField`
- `AddressSearchField`
- `AddressSearchDialog`
- `AttendanceRadiusField`
- `FormActions`

## 버튼 규칙

shadcn `Button` variant 사용 기준:

| variant | 사용 |
| --- | --- |
| `default` | 저장, 생성, 등록 완료, 로그인 같은 주요 액션 |
| `outline` | 취소, 이전, 주소 검색, 보조 액션 |
| `secondary` | 낮은 강조의 보조 선택 |
| `ghost` | 링크성 버튼, 사이드바 안 보조 액션 |
| `destructive` | 삭제, 취소 불가 작업 |

규칙:

- 한 섹션 안 주요 버튼은 하나만 둔다.
- 폼 하단에서는 보조 액션을 왼쪽, 주요 액션을 오른쪽에 둔다.
- 버튼 안 아이콘은 가능하면 왼쪽에 둔다.
- destructive 버튼을 바로 실행하지 않는다. `AlertDialog`에서 최종 확인한다.

## Dialog 규칙

`Dialog` 사용:

- 주소 검색
- 조직 추가
- 상세 정보 보기
- 되돌릴 수 있는 단기 작업

`AlertDialog` 사용:

- 조직 삭제
- 급여 발급 취소
- 데이터 영구 삭제
- 되돌릴 수 없는 작업

Dialog 구성:

```txt
DialogHeader
DialogTitle
DialogDescription
본문
DialogFooter
```

긴 폼 Dialog는 내부에 `ScrollArea`를 사용한다.

## 상태 Badge 규칙

상태는 `Badge`를 감싼 `StatusBadge` 컴포넌트로 통일한다.

```ts
type StatusTone =
  | "confirmed"
  | "pending"
  | "cancelled"
  | "draft"
  | "unprocessed";
```

예:

| tone | 표시 예시 |
| --- | --- |
| `confirmed` | 확정, 승인됨, 발급 완료 |
| `pending` | 검토 필요, 대기 중 |
| `cancelled` | 취소됨, 거절됨, 오류 |
| `draft` | 초안, 계산 중 |
| `unprocessed` | 미처리, 비활성 |

Badge는 상태를 보조하는 요소다. 중요한 상태는 제목, 버튼, 안내 문구에서도 한 번 더 명확히 설명한다.

## 도메인 컴포넌트 구성

### 인증

사용 primitive:

- `Card`
- `Form`
- `Input`
- `Button`
- `Checkbox`
- `Separator`

컴포넌트:

- `AuthLayout`
- `AuthCard`
- `AuthBrand`
- `PasswordInput`
- `PasswordRuleList`
- `SignupForm`
- `LoginForm`
- `ForgotPasswordForm`
- `ResetPasswordForm`

### 온보딩/조직 등록

사용 primitive:

- `Card`
- `Form`
- `Input`
- `Button`
- `Dialog`
- `Slider`
- `Badge`

컴포넌트:

- `EmptyStoreState`
- `StoreCreateForm`
- `BusinessNumberField`
- `AddressSearchDialog`
- `AttendanceRadiusField`
- `RadiusPreviewMap`
- `OnboardingCompleteDialog`

### 스케줄 정책

사용 primitive:

- `Card`
- `Form`
- `RadioGroup`
- `Switch`
- `Select`
- `Input`
- `Button`
- `Separator`

컴포넌트:

- `SchedulePolicyForm`
- `WorkTypeSelector`
- `ScheduleCycleFields`
- `RequestPeriodFields`
- `AdjustmentPeriodFields`
- `MinStaffRuleList`
- `MinStaffRuleItem`
- `DayOfWeekToggleGroup`
- `ClosureRuleList`
- `ClosureRuleItem`

`MinStaffRuleList`와 `ClosureRuleList`는 React Hook Form `useFieldArray`를 기준으로 설계한다.

### 조직 관리

사용 primitive:

- `Card`
- `Button`
- `DropdownMenu`
- `Dialog`
- `Switch`
- `Select`
- `Badge`
- `Skeleton`
- `Tooltip`

컴포넌트:

- `StoreSwitcher`
- `StoreSummaryStrip`
- `StoreGrid`
- `StoreCard`
- `StoreAddDialog`
- `StorePolicyCopyField`
- `StoreStatsItem`

### 조직 설정

사용 primitive:

- `Tabs`
- `Card`
- `Form`
- `Input`
- `Button`
- `Slider`
- `Badge`
- `AlertDialog`
- `Separator`

컴포넌트:

- `StoreSettingsTabs`
- `StoreInfoForm`
- `ReadonlyBusinessNumberField`
- `SchedulePolicyForm`
- `DangerZone`
- `DeleteStoreAlertDialog`

### 급여 명세

사용 primitive:

- `Card`
- `Badge`
- `Button`
- `Table`
- `Alert`
- `Separator`
- `Tooltip`

컴포넌트:

- `PayslipDetailHeader`
- `PayslipStatusBadge`
- `PayslipActionButtons`
- `NetPayBanner`
- `PayslipAmountSection`
- `PayslipAmountRow`
- `PayslipAttendanceGrid`
- `PayslipFormulaList`
- `PayslipNotice`

금액과 시간은 항상 `tabular-nums`를 적용한다.

## 데이터 상태 규칙

프로젝트 상태 분류 원칙을 따른다.

- 서버 데이터: TanStack Query
- UI 전역 상태: Zustand
- 폼 상태: React Hook Form
- 컴포넌트 로컬 상태: `useState`

예:

- 조직 목록, 급여 명세, 스케줄 정책 조회: TanStack Query
- 현재 선택 조직, 사이드바 접힘 여부: Zustand
- 조직 등록, 스케줄 정책 저장: React Hook Form
- Dialog open 상태, password visible 상태: local state

## 접근성 규칙

- 모든 input은 label과 연결한다.
- 아이콘 버튼은 `aria-label`을 가진다.
- Dialog는 제목과 설명을 가진다.
- 색상만으로 상태를 표현하지 않는다.
- 키보드 포커스는 shadcn/Radix 기본 동작을 유지한다.
- focus ring을 제거하지 않는다.
- disabled와 readonly를 구분한다.

## 문구 규칙

운영 도구 문구는 짧고 직접적으로 쓴다.

- 버튼: 명령형 명사/동사 조합을 사용한다. 예: `조직 등록 완료`, `저장하고 시작하기`, `주소 검색`
- 설명: 사용자가 왜 입력해야 하는지 알려준다.
- 에러: 무엇을 고쳐야 하는지 말한다.
- 위험 작업: 삭제되는 데이터와 되돌릴 수 없음을 명확히 말한다.
