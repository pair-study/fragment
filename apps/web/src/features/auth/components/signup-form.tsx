"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@moyeorak/design-system";
import { Mail } from "lucide-react";

import { PasswordInput } from "@/components/common/password-input";
import { Input } from "@/components/ui/input";

import { AuthField } from "./auth-field";
import { AuthFooterLink } from "./auth-footer-link";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = {
    name: !name.trim() ? "이름을 입력하세요." : "",
    email: !email.trim()
      ? "이메일을 입력하세요."
      : !email.includes("@")
        ? "이메일 형식으로 입력하세요."
        : "",
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
        router.push("/organizations/new");
      }}
    >
      <div>
        <h1 className="text-balance text-2xl font-bold text-foreground">회원가입</h1>
        <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
          스케줄 운영 대시보드를 사용할 관리자 계정을 만듭니다.
        </p>
      </div>

      <div className="space-y-5">
        <AuthField id="name" label="이름">
          <Input
            id="name"
            name="name"
            placeholder="홍길동"
            value={name}
            autoComplete="name"
            aria-invalid={submitted && Boolean(errors.name)}
            onChange={(event) => setName(event.target.value)}
          />
          {submitted && errors.name ? (
            <p className="text-sm text-destructive">{errors.name}</p>
          ) : null}
        </AuthField>

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
            placeholder="8자 이상 입력"
            value={password}
            autoComplete="new-password"
            aria-invalid={submitted && Boolean(errors.password)}
            onChange={(event) => setPassword(event.target.value)}
          />
          {submitted && errors.password ? (
            <p className="text-sm text-destructive">{errors.password}</p>
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
