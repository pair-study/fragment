# Mobile UI Wrappers

Gluestack UI v3는 shadcn/ui 스타일의 소스 복사 방식을 기준으로 한다. 화면에서는 `@gluestack-ui/core`의 creator나 내부 primitive를 직접 조합하지 말고, `@/components/ui/*`의 공통 래퍼를 import해서 사용한다.

```tsx
import { Alert, AlertText, Button, ButtonText, Card, Input, InputField } from "@/components/ui";

export function Example() {
  return (
    <Card>
      <Input>
        <InputField placeholder="사번을 입력하세요" />
      </Input>

      <Alert>
        <AlertText>관리자에게 받은 사번을 입력해 주세요.</AlertText>
      </Alert>

      <Button variant="default">
        <ButtonText>확인</ButtonText>
      </Button>
    </Card>
  );
}
```

- 상태 prop은 Gluestack v3 문서의 `variant`, `size`, `isDisabled`, `isInvalid`, `isReadOnly` 이름을 우선 사용한다.
- `Button`은 `variant="default" | "destructive" | "outline" | "secondary" | "ghost" | "link"`를 사용한다.
- `Alert`는 `variant="default" | "destructive"`를 사용한다.
- 색상, radius, spacing, typography는 `tailwind.config.ts`와 `src/theme/*` 토큰을 기준으로 한다.
- 기존 인증/조직 연결 화면의 전체 전환은 후속 화면 작업에서 진행한다.
