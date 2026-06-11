"use client";

import { useState } from "react";

import { PasswordInput } from "@/components/common/password-input";
import { PasswordRuleList } from "@/components/common/password-rule-list";
import { Button } from "@/components/ui/button";

import { AuthField } from "./auth-field";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  return (
    <form className="space-y-6">
      <div>
        <h1 className="text-balance text-2xl font-bold text-foreground">
          새 비밀번호 설정
        </h1>
        <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
          <strong className="font-semibold text-text-body">
            seongmin@cafe.kr
          </strong>{" "}
          계정의
          <br />새 비밀번호를 입력해 주세요.
        </p>
      </div>

      <div className="space-y-5">
        <AuthField id="password" label="새 비밀번호">
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
          label="새 비밀번호 확인"
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
        비밀번호 변경
      </Button>
    </form>
  );
}
