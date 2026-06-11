import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell>
      <AuthCard>
        <ForgotPasswordForm />
      </AuthCard>
    </AuthPageShell>
  );
}
