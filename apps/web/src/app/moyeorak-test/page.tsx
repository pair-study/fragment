import "@moyeorak/design-system/dist/style.css";
import { Badge, Button, Chip, Toast, version } from "@moyeorak/design-system";

export default function MoyeorakTestPage() {
  return (
    <div className="flex flex-col gap-6 p-10">
      <p>@moyeorak/design-system v{version}</p>

      <div className="flex gap-3">
        <Button variant="brand">기본 브랜드 버튼</Button>
        <Button variant="brand-weak">브랜드 weak 버튼</Button>
        <Button variant="outline">아웃라인 버튼</Button>
        <Button variant="ghost">고스트 버튼</Button>
      </div>

      <div className="flex gap-3">
        <Badge variant="brand-weak">brand-weak</Badge>
        <Badge variant="neutral-weak">neutral-weak</Badge>
      </div>

      <div className="flex gap-3">
        <Chip variant="brand">brand chip</Chip>
        <Chip variant="outlined-brand">outlined chip</Chip>
      </div>

      <Toast variant="positive" message="설치 및 렌더링 확인 완료" />
    </div>
  );
}
