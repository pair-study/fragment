# apps/mobile — CLAUDE.md (근무자 모바일 앱)

## 역할 및 범위

**근무자 전용 모바일 애플리케이션**입니다.
희망 근무 신청, 확정 스케줄 조회, 출퇴근 GPS 체크, 근태 서명, 급여 명세서 확인을 담당합니다.
대응 FR: FR-1.2(근무자 계정), FR-2.1(희망 근무 신청), FR-2.4/2.5(스케줄 조회·교환), FR-3.1/3.4/3.6(근태), FR-4.3(명세서), FR-5.4(다중 조직)

## 기술 스택

| 항목            | 기술               | 버전        |
| --------------- | ------------------ | ----------- |
| Framework       | React Native       | 0.79.x      |
| Build Toolchain | Expo SDK           | 53.x        |
| Language        | TypeScript         | 5.8.x       |
| Navigation      | Expo Router        | 5.x         |
| Global State    | Zustand            | 5.0.x       |
| Server State    | TanStack Query     | 5.74.x      |
| Form            | React Hook Form    | 7.54.x      |
| Validation      | Zod                | 3.24.x      |
| Styling         | NativeWind         | 4.x         |
| UI Components   | Gluestack UI       | v2.x        |
| Push 알림       | Expo Notifications | SDK 53 내장 |
| 위치 정보       | Expo Location      | SDK 53 내장 |

## 디렉터리 구조

```
apps/mobile/
├── app/                  # Expo Router 파일 기반 라우팅
│   ├── (auth)/           # 소셜 로그인 화면
│   ├── (tabs)/           # 인증 후 탭 네비게이션
│   │   ├── schedule/     # 스케줄 조회·신청 (FR-2)
│   │   ├── attendance/   # 출퇴근 체크·근태 서명 (FR-3)
│   │   └── payroll/      # 급여 명세서 (FR-4)
│   └── _layout.tsx
├── components/
│   ├── ui/               # 재사용 범용 컴포넌트
│   └── features/         # 도메인별 컴포넌트
├── hooks/                # 커스텀 훅 (useGPS, useAttendance 등)
├── lib/
│   ├── api/              # API 클라이언트
│   └── utils/
└── stores/               # Zustand 스토어 (선택된 조직 등)
```

## 주요 규칙

### 스타일링

- **NativeWind 4.x**를 사용합니다. React Native의 `StyleSheet`을 직접 작성하지 않습니다.
- 웹(`apps/web`)과 동일한 Tailwind 클래스 문법을 사용하지만, NativeWind는 지원 클래스 범위가 다릅니다. 레이아웃(`flex`, `gap`, `p-`, `m-`)·타이포그래피·색상 클래스를 우선 사용하고, 웹 전용 클래스(`hover:`, `group-`, CSS Grid 등)는 사용하지 않습니다.
- 디자인 토큰(색상, 폰트 크기 등)은 루트 `tailwind.config.ts`의 `theme.extend`에서 앱·웹이 공유합니다.
- Gluestack UI 컴포넌트는 내부적으로 NativeWind 클래스를 사용합니다. 커스터마이징은 `className` prop으로 처리합니다.
- 클래스 조건부 결합은 `clsx` + `tailwind-merge`로 만든 `cn()` 유틸(`lib/utils.ts`)을 사용합니다. 문자열 직접 연결로 클래스를 조합하지 않습니다.

### UI 컴포넌트

- **Gluestack UI v2**를 기본 컴포넌트 라이브러리로 사용합니다.
- Button, Input, Modal, Toast 등 기본 UI는 Gluestack 컴포넌트를 사용하고, `components/ui/`에서 re-export하여 import 경로를 통일합니다.
- Gluestack 컴포넌트를 직접 수정하지 않습니다. 커스터마이징이 필요하면 `components/ui/`에 래핑 컴포넌트를 만듭니다.
- Gluestack에 없는 도메인 특화 컴포넌트(출퇴근 버튼, GPS 상태 인디케이터 등)는 `components/features/`에 직접 구현합니다.

### 공유 패키지

- **Zod 스키마**는 `packages/shared`에서 가져옵니다. 앱에서 별도로 정의하지 않습니다.
- **GPS 반경 판정 유틸**(`packages/shared/src/utils/gps.ts`)을 사용합니다. 앱에 동일 로직을 중복 구현하지 않습니다.
- **API 요청·응답 타입**은 `packages/shared/src/types/api/`에서 가져옵니다.

### 네비게이션

- **Expo Router(파일 기반 라우팅)**를 사용합니다. `react-navigation` API를 직접 사용하지 않습니다.
- 인증 흐름은 `app/(auth)/` 그룹, 메인 앱은 `app/(tabs)/` 그룹으로 분리합니다.
- 딥링크·초대 링크 처리는 Expo Router의 `Linking` 설정으로 구현합니다.

### GPS 및 권한

- **Expo Location**으로 현재 위치를 가져옵니다. 출근 체크 전 반드시 권한을 확인합니다.
- 권한 거부 시 기능 명세서(FR-3.1)에 명시된 안내 문구를 표시합니다.
- 위치 정확도: `Accuracy.Balanced` 이상을 사용합니다. 배터리 절약을 위해 백그라운드 추적을 하지 않습니다.
- 조직 반경 판정은 `packages/shared/src/utils/gps.ts`의 유틸을 호출합니다. 앱에 동일 로직을 직접 구현하지 않습니다.

### Push 알림

- **Expo Notifications**를 사용합니다. 디바이스 토큰은 로그인 시 API 서버에 등록합니다.
- 앱이 Foreground 상태일 때와 Background/Kill 상태일 때의 핸들러를 각각 분리합니다.
- 알림 수신 후 해당 화면으로 이동하는 딥링크를 설정합니다.

### 소셜 로그인

- 카카오·네이버 OAuth는 각 SDK의 Expo 모듈을 사용합니다.
- 로그인 성공 후 JWT는 **Expo SecureStore**에 저장합니다. `AsyncStorage`에 저장하지 마십시오.

### 상태 관리

- **Zustand**: 현재 선택된 조직 ID, 모달 상태 등 UI 전역 상태.
- **TanStack Query**: 서버 데이터 (스케줄 목록, 근태 목록, 명세서 등). 오프라인 대응을 위해 `gcTime`을 충분히 설정합니다.

### 네이티브 모듈

- EAS Build를 통해 빌드합니다. 네이티브 코드 변경이 필요한 경우 팀에 공유 후 진행합니다.
- `expo-dev-client`를 사용하여 개발 빌드를 실행합니다.

### 에러 처리 및 UX

- 네트워크 오류 시 사용자 친화적인 토스트/모달 메시지를 표시합니다.
- 기능 명세서의 각 "예외 처리" 항목에 명시된 문구를 그대로 사용합니다.

## 테스트

```bash
pnpm --filter @ilgam/mobile test    # 단위 테스트 (Vitest)
```

- **Vitest + React Testing Library** (React Native용)을 사용합니다.
- 테스트 파일은 별도 `test/` 디렉터리 없이 대상 파일 옆에 코로케이션합니다. (`useAttendance.ts` → `useAttendance.test.ts`)
- 네이티브 API(Expo Location, Notifications) 모킹 설정은 `apps/mobile/__mocks__/`에 둡니다.
- GPS 권한, 위치 계산, 출근 판정 로직은 반드시 단위 테스트를 작성합니다.

## 개발 실행

```bash
pnpm --filter @ilgam/mobile start       # Expo Metro 번들러 시작
pnpm --filter @ilgam/mobile ios         # iOS 시뮬레이터
pnpm --filter @ilgam/mobile android     # Android 에뮬레이터
pnpm --filter @ilgam/mobile lint
```
