"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

import { PasswordInput } from "@/components/common/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import { AuthField } from "./auth-field";
import { AuthFooterLink } from "./auth-footer-link";

export function LoginForm() {
  return (
    <form className="space-y-6">
      <div>
        <h1 className="text-balance text-2xl font-bold text-foreground">
          다시 오신 걸 환영해요
        </h1>
        <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
          이메일과 비밀번호로 로그인하세요.
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
              autoComplete="email"
              className="pl-9"
            />
          </div>
        </AuthField>

        <AuthField id="password" label="비밀번호">
          <PasswordInput
            id="password"
            name="password"
            placeholder="비밀번호 입력"
            autoComplete="current-password"
          />
        </AuthField>
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Checkbox defaultChecked aria-label="로그인 상태 유지" />
          로그인 상태 유지
        </label>
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-primary hover:underline"
        >
          비밀번호를 잊으셨나요?
        </Link>
      </div>

      <Button type="submit" size="lg" className="h-12 w-full text-base">
        로그인
      </Button>

      <div className="border-t border-border pt-6">
        <AuthFooterLink
          label="아직 계정이 없으신가요?"
          href="/signup"
          linkText="회원가입"
        />
      </div>
    </form>
  );
}
