"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Mail, UserCircle, UserX } from "lucide-react";

import { PasswordInput } from "@/components/common/password-input";
import { PasswordRuleList } from "@/components/common/password-rule-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const account = {
  name: "관리자",
  email: "admin@ilgam.co.kr",
};

export function AccountInfoPage() {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const resetPasswordForm = () => {
    setNewPassword("");
    setNewPasswordConfirm("");
  };

  const handleChangePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const toggleChangePasswordForm = () => {
    setChangePasswordOpen((open) => {
      if (open) resetPasswordForm();
      return !open;
    });
  };

  return (
    <main className="min-h-full px-6 py-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-foreground">계정 설정</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            관리자 개인 계정의 기본 정보와 보안 설정을 관리해요.
          </p>
        </header>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-lg font-bold text-foreground">기본 정보</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <ReadonlyAccountField
                id="account-name"
                label="이름"
                value={account.name}
                icon={UserCircle}
              />
              <ReadonlyAccountField
                id="account-email"
                label="이메일"
                value={account.email}
                icon={Mail}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">계정 보안</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  비밀번호를 변경하려면 현재 비밀번호 확인이 필요해요.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={toggleChangePasswordForm}
                aria-expanded={changePasswordOpen}
              >
                <KeyRound className="size-4" aria-hidden="true" />
                비밀번호 변경
              </Button>
            </div>

            {changePasswordOpen ? (
              <form
                className="mt-7 border-t border-border pt-6"
                onSubmit={handleChangePasswordSubmit}
              >
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">현재 비밀번호</Label>
                    <PasswordInput
                      id="current-password"
                      name="currentPassword"
                      placeholder="현재 비밀번호 입력"
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">새 비밀번호</Label>
                    <PasswordInput
                      id="new-password"
                      name="newPassword"
                      placeholder="8자 이상 입력"
                      value={newPassword}
                      autoComplete="new-password"
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                    <PasswordRuleList password={newPassword} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password-confirm">새 비밀번호 확인</Label>
                    <PasswordInput
                      id="new-password-confirm"
                      name="newPasswordConfirm"
                      placeholder="비밀번호 재입력"
                      value={newPasswordConfirm}
                      autoComplete="new-password"
                      onChange={(event) => setNewPasswordConfirm(event.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetPasswordForm();
                      setChangePasswordOpen(false);
                    }}
                  >
                    취소
                  </Button>
                  <Button type="submit">변경</Button>
                </div>
              </form>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardContent className="flex flex-col gap-5 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-destructive">계정 탈퇴</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                소속 조직이 있는 경우 탈퇴할 수 없습니다. 조직을 먼저 삭제해 주세요.
              </p>
            </div>
            <Button variant="destructive" className="w-full sm:w-auto">
              <UserX className="size-4" aria-hidden="true" />
              탈퇴
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

type ReadonlyAccountFieldProps = {
  id: string;
  label: string;
  value: string;
  icon: typeof UserCircle;
};

function ReadonlyAccountField({
  id,
  label,
  value,
  icon: Icon,
}: ReadonlyAccountFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input id={id} readOnly value={value} className="bg-surface-secondary pl-9" />
      </div>
    </div>
  );
}
