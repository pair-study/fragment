import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { SignupForm } from "@/features/auth/components/signup-form";

export default function SignupPage() {
  return (
    <AuthPageShell>
      <AuthCard>
        <SignupForm />
      </AuthCard>
    </AuthPageShell>
  );
}
