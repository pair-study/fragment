"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authLoginRequestSchema, type AuthLoginRequest } from "@fragment/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@moyeorak/design-system";
import { useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import { PasswordInput } from "@/components/common/password-input";
import { Input } from "@/components/ui/input";
import { login } from "@/features/auth/api";
import {
  authMeQueryKey,
  createOrganizationlessAuthMeFromSession,
} from "@/features/auth/queries/auth-session";
import { getAuthErrorMessage } from "@/features/auth/utils/auth-error-message";
import { setAccessToken } from "@/lib/access-token";

import { AuthField } from "./auth-field";
import { AuthFooterLink } from "./auth-footer-link";

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState("");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<AuthLoginRequest>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(authLoginRequestSchema),
  });

  async function onSubmit(values: AuthLoginRequest) {
    setFormError("");

    try {
      const session = await login(values);

      setAccessToken(session.accessToken);

      if (session.hasOrganization) {
        queryClient.removeQueries({ queryKey: authMeQueryKey });
        router.push("/dashboard");
        return;
      }

      queryClient.setQueryData(authMeQueryKey, createOrganizationlessAuthMeFromSession(session));
      router.push("/organization/new");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <h1 className="text-balance text-2xl font-bold text-foreground">로그인</h1>
        <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
          가입한 계정으로 근무 스케줄 관리 대시보드에 접속합니다.
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
            placeholder="비밀번호 입력"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </AuthField>
      </div>

      <Button type="submit" variant="brand" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "로그인 중" : "로그인"}
      </Button>

      <div className="border-t border-border pt-6">
        <AuthFooterLink label="아직 계정이 없으신가요?" href="/signup" linkText="회원가입" />
      </div>
    </form>
  );
}
