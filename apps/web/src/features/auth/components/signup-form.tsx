"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

import { PasswordInput } from "@/components/common/password-input";
import { PasswordRuleList } from "@/components/common/password-rule-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthField } from "./auth-field";
import { AuthFooterLink } from "./auth-footer-link";

export function SignupForm() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  return (
    <form className="space-y-6">
      <div>
        <h1 className="text-balance text-2xl font-bold text-foreground">
          관리자 계정 만들기
        </h1>
        <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
          조직의 스케줄과 급여를 관리할 계정을 만들어요.
        </p>
      </div>

      <div className="space-y-5">
        <AuthField id="name" label="이름">
          <Input
            id="name"
            name="name"
            placeholder="홍길동"
            autoComplete="name"
          />
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
              autoComplete="email"
              className="pl-9"
            />
          </div>
        </AuthField>

        <AuthField id="password" label="비밀번호">
          <PasswordInput
            id="password"
            name="password"
            placeholder="8자 이상 입력"
            value={password}
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
          />
          <PasswordRuleList password={password} />
        </AuthField>

        <AuthField
          id="password-confirm"
          label="비밀번호 확인"
          description="한 번 더 입력해 일치하는지 확인해요."
        >
          <PasswordInput
            id="password-confirm"
            name="passwordConfirm"
            placeholder="비밀번호 재입력"
            value={passwordConfirm}
            autoComplete="new-password"
            onChange={(event) => setPasswordConfirm(event.target.value)}
          />
        </AuthField>
      </div>

      <Button type="submit" size="lg" className="h-12 w-full text-base">
        계정 만들기
      </Button>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        가입하면{" "}
        <Link href="#" className="underline underline-offset-2">
          이용약관
        </Link>
        및{" "}
        <Link href="#" className="underline underline-offset-2">
          개인정보처리방침
        </Link>
        에 동의하게 됩니다.
      </p>

      <div className="border-t border-border pt-6">
        <AuthFooterLink
          label="이미 계정이 있으신가요?"
          href="/login"
          linkText="로그인"
        />
      </div>
    </form>
  );
}
