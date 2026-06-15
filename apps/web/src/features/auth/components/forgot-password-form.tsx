import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthField } from "./auth-field";

export function ForgotPasswordForm() {
  return (
    <form className="space-y-6">
      <div>
        <Link
          href="/login"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          로그인으로 돌아가기
        </Link>
        <h1 className="text-balance text-2xl font-bold text-foreground">비밀번호 재설정</h1>
        <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
          가입한 이메일을 입력하면 재설정 링크를 보내드려요.
        </p>
      </div>

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

      <Button type="submit" size="lg" className="h-12 w-full text-base">
        <Send className="size-4" aria-hidden="true" />
        재설정 링크 보내기
      </Button>
    </form>
  );
}
