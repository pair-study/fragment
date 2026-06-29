import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <AuthPageShell>
      <AuthCard>
        <LoginForm />
      </AuthCard>
    </AuthPageShell>
  );
}
