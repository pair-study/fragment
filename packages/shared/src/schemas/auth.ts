import { z } from "zod";
import { idSchema } from "./common";

export const userSchema = z.object({
  id: idSchema,
  email: z.string().email(),
  name: z.string().min(1),
});

const signupPasswordSchema = z
  .string()
  .min(1, "비밀번호를 입력하세요.")
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .regex(/[A-Za-z]/, "비밀번호에 영문을 포함해 주세요.")
  .regex(/[0-9]/, "비밀번호에 숫자를 포함해 주세요.");

export const authSignupRequestSchema = z
  .object({
    name: z.string().trim().min(1, "이름을 입력하세요."),
    email: z.string().trim().min(1, "이메일을 입력하세요.").email("이메일 형식으로 입력하세요."),
    password: signupPasswordSchema,
    passwordConfirm: z.string().min(1, "비밀번호 확인을 입력하세요."),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

export const authLoginRequestSchema = z.object({
  email: z.string().trim().min(1, "이메일을 입력하세요.").email("이메일 형식으로 입력하세요."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

export const authSessionResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: userSchema,
  hasOrganization: z.boolean(),
});

export const authMeResponseSchema = z.object({
  user: userSchema,
  organization: z
    .object({
      id: idSchema,
      name: z.string(),
    })
    .nullable(),
});
