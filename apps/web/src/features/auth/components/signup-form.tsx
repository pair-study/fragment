"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authSignupRequestSchema, type AuthSignupRequest } from "@fragment/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@moyeorak/design-system";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import { PasswordInput } from "@/components/common/password-input";
import { Input } from "@/components/ui/input";
import { signup } from "@/features/auth/api";
import { getAuthErrorMessage } from "@/features/auth/utils/auth-error-message";

import { AuthField } from "./auth-field";
import { AuthFooterLink } from "./auth-footer-link";

export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<AuthSignupRequest>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
      passwordConfirm: "",
    },
    resolver: zodResolver(authSignupRequestSchema),
  });

  async function onSubmit(values: AuthSignupRequest) {
    setFormError("");

    try {
      const session = await signup(values);

      router.push(session.hasOrganization ? "/dashboard" : "/organization/new");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <h1 className="text-balance text-2xl font-bold text-foreground">회원가입</h1>
        <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
          근무 스케줄 관리 대시보드를 사용할 계정을 만듭니다.
        </p>
      </div>

      <div className="space-y-5">
        {formError ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </p>
        ) : null}

        <AuthField id="name" label="이름">
          <Input
            id="name"
            placeholder="홍길동"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </AuthField>

        <AuthField id="email" label="이메일">
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              autoComplete="email"
              className="pl-9"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </div>
          {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
        </AuthField>

        <AuthField id="password" label="비밀번호">
          <PasswordInput
            id="password"
            placeholder="8자 이상 입력"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </AuthField>

        <AuthField id="password-confirm" label="비밀번호 확인">
          <PasswordInput
            id="password-confirm"
            placeholder="비밀번호 재입력"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.passwordConfirm)}
            {...register("passwordConfirm")}
          />
          {errors.passwordConfirm ? (
            <p className="text-sm text-destructive">{errors.passwordConfirm.message}</p>
          ) : null}
        </AuthField>
      </div>

      <Button type="submit" variant="brand" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "가입 중" : "회원가입"}
      </Button>

      <div className="border-t border-border pt-6">
        <AuthFooterLink label="이미 계정이 있으신가요?" href="/login" linkText="로그인" />
      </div>
    </form>
  );
}
