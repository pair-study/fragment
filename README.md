# 프래그먼트(Fragment)

단일 조직의 인력 정보, 가능 시간, 최소 인원 조건을 기반으로 근무 스케줄 초안을 생성하고 확정 스케줄을 관리하는 운영 웹 서비스입니다.

## 프로젝트 소개

프래그먼트는 소규모 조직의 근무 스케줄 편성 과정을 줄이기 위한 스케줄 관리 도구입니다.
메신저, 스프레드시트, 수기 메모로 흩어져 관리하던 인력 정보와 가능 시간을 한 곳에 모으고, 요일·시간대별 최소 인원 조건을 기준으로 스케줄 초안을 추천합니다.

MVP에서는 회원가입, 로그인, 조직 생성, 인력 관리, 가능 시간 입력, 최소 인원 조건 관리, 스케줄 추천, 확정 스케줄 조회 흐름을 반응형 웹에서 제공합니다.

## 배포 링크

<!-- - 서비스: 추가 예정
- GitHub: 추가 예정
- 시연 영상: 추가 예정 -->

## 주요 기능

- 회원가입, 로그인, JWT 기반 인증
- 단일 조직 생성 및 요일별 운영 시간 관리
- 인력 등록, 수정, 삭제 및 자동 사번 관리
- 인력별 날짜·시간대 가능 시간 입력
- 요일·시간대별 최소 인원 조건 관리
- 조건 기반 DRAFT 스케줄 생성 및 CONFIRMED 스케줄 조회

## 기술 스택

| 구분       | 기술                                                         |
| ---------- | ------------------------------------------------------------ |
| Monorepo   | pnpm Workspaces                                              |
| Frontend   | Next.js, React, TypeScript                                   |
| Styling    | Tailwind CSS, `@moyeorak/design-system`, shadcn/ui, Radix UI |
| State/Form | TanStack Query, React Hook Form, Zod                         |
| Backend    | Express, TypeScript                                          |
| Database   | PostgreSQL, Prisma                                           |
| Auth       | JWT, Cookie 기반 인증                                        |
| Test       | Vitest, React Testing Library, Jest, Supertest               |
| Deploy     | Vercel, Railway                                              |

## 담당 역할

<!-- - 운영 웹 주요 페이지 UI 구현
- 인증, 온보딩, 관리자 화면 라우팅 흐름 구성
- 인력, 가능 시간, 최소 인원 조건 API 연동
- TanStack Query 기반 서버 상태 관리 및 mutation 처리
- Zod schema를 활용한 프론트엔드·백엔드 요청 검증 구조 구성
- Express API, Prisma schema, 테스트 코드 작성 및 유지보수
- 모바일과 데스크톱 환경을 고려한 반응형 레이아웃 구현 -->

## 주요 작업

<!-- ### 운영 관리 흐름 구현

회원가입 또는 로그인 후 조직 존재 여부에 따라 온보딩 화면과 관리자 화면으로 분기되는 흐름을 구성했습니다. 조직 생성 이후에는 대시보드, 인력 관리, 가능 시간, 최소 인원 조건, 스케줄 화면으로 이어지는 운영자 중심의 사용 흐름을 설계했습니다.

### 공유 스키마 기반 API 계약 관리

`packages/shared`에 공통 타입과 Zod schema를 분리해 프론트엔드와 백엔드가 같은 요청·응답 구조를 기준으로 동작하도록 구성했습니다. 이를 통해 입력 검증 규칙과 API 계약이 화면과 서버에서 어긋나지 않도록 관리했습니다.

### 서버 상태와 사용자 피드백 처리

TanStack Query를 사용해 목록 조회, 상세 조회, 생성, 수정, 삭제 요청을 관리했습니다. API 요청 상태를 로딩, 성공, 실패로 나누고, 실패 시 사용자에게 이해 가능한 메시지를 보여줄 수 있도록 에러 메시지 처리 유틸을 분리했습니다.

### 도메인 단위 테스트 작성

인력, 가능 시간, 최소 인원 조건, 조직, 인증 흐름을 API route test와 service test로 검증했습니다. 주요 도메인 로직은 fake Prisma helper와 fixture를 활용해 데이터 조건별 동작을 확인할 수 있도록 구성했습니다. -->

## 폴더 구조

```bash
apps
├── api
└── web
packages
├── database
└── shared
docs
```

| 폴더                | 설명                                               |
| ------------------- | -------------------------------------------------- |
| `apps/web`          | Next.js 기반 운영 웹 애플리케이션                  |
| `apps/api`          | Express 기반 HTTP API 서버                         |
| `packages/database` | Prisma schema, migration, seed, Prisma client 관리 |
| `packages/shared`   | 공통 타입, Zod schema, 유틸 관리                   |
| `docs`              | PRD, 기능 명세, API 문서, ERD, 기술 스택 문서      |

## 실행 방법

<!-- ```bash
git clone https://github.com/your-org/fragment.git
cd fragment
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm dev:all
```

웹 애플리케이션은 기본적으로 `http://localhost:3000`에서 실행됩니다.
API 서버와 데이터베이스 연결 정보는 `.env`의 `DATABASE_URL`, `WEB_APP_ORIGIN`, `JWT_ACCESS_SECRET`, `NEXT_PUBLIC_API_BASE_URL` 값을 환경에 맞게 수정해 사용합니다. -->

## 테스트

```bash
pnpm test
pnpm test:web
pnpm test:api
```

## 관련 문서

- [PRD](docs/PRD.md)
- [기능 명세서](docs/SPEC.md)
- [API 문서](docs/API.md)
- [ERD](docs/ERD.md)
- [기술 스택 정의서](docs/stack.md)

## 배운 점

<!-- 이번 프로젝트를 통해 단순히 화면을 구현하는 것뿐만 아니라, 조직 설정부터 스케줄 추천까지 이어지는 데이터 흐름을 기준으로 UI와 API를 함께 설계하는 경험을 할 수 있었습니다.
또한 프론트엔드와 백엔드가 공유하는 schema를 분리하고, 서버 상태와 폼 상태를 구분해 관리하면서 유지보수하기 쉬운 구조의 중요성을 배웠습니다. -->
