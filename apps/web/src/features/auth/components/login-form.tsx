"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@moyeorak/design-system";
import { Mail } from "lucide-react";

import { PasswordInput } from "@/components/common/password-input";
import { Input } from "@/components/ui/input";

import { AuthField } from "./auth-field";
import { AuthFooterLink } from "./auth-footer-link";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = {
    email: !email.trim() ? "이메일을 입력하세요." : "",
    password: !password ? "비밀번호를 입력하세요." : "",
  };
  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);

        if (hasErrors) {
          return;
        }

        setIsSubmitting(true);
        router.push("/dashboard");
      }}
    >
      <div>
        <h1 className="text-balance text-2xl font-bold text-foreground">로그인</h1>
        <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
          가입한 계정으로 스케줄 운영 대시보드에 접속합니다.
        </p>
      </div>

      <div className="space-y-5">
        <AuthField id="email" label="이메일">
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              autoComplete="email"
              className="pl-9"
              aria-invalid={submitted && Boolean(errors.email)}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          {submitted && errors.email ? (
            <p className="text-sm text-destructive">{errors.email}</p>
          ) : null}
        </AuthField>

        <AuthField id="password" label="비밀번호">
          <PasswordInput
            id="password"
            name="password"
            placeholder="비밀번호 입력"
            value={password}
            autoComplete="current-password"
            aria-invalid={submitted && Boolean(errors.password)}
            onChange={(event) => setPassword(event.target.value)}
          />
          {submitted && errors.password ? (
            <p className="text-sm text-destructive">{errors.password}</p>
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
