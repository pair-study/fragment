# Mobile UI Wrappers

Gluestack UI v2는 필요한 컴포넌트를 프로젝트 내부로 가져와 `@/components/ui/*`에서 사용하는 방식을 기준으로 한다. 화면에서는 라이브러리 또는 내부 primitive를 직접 조합하지 말고 이 디렉터리의 공통 래퍼를 import한다.

```tsx
import { Alert, AlertText, Button, ButtonText, Card, Input, InputField } from "@/components/ui";

export function Example() {
  return (
    <Card>
      <Input isInvalid={false}>
        <InputField placeholder="사번을 입력하세요" />
      </Input>

      <Alert action="info">
        <AlertText>관리자에게 받은 사번을 입력해 주세요.</AlertText>
      </Alert>

      <Button action="primary">
        <ButtonText>확인</ButtonText>
      </Button>
    </Card>
  );
}
```

- 상태 prop은 Gluestack 문서의 `isDisabled`, `isInvalid`, `isLoading`, `action`, `variant`, `size` 이름을 우선 사용한다.
- 색상, radius, spacing, typography는 `tailwind.config.ts`와 `src/theme/*` 토큰을 기준으로 한다.
- 기존 인증/조직 연결 화면의 전체 전환은 후속 화면 작업에서 진행한다.
