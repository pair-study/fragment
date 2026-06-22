import { z } from "zod";
import { idSchema } from "./common";

export const userSchema = z.object({
  id: idSchema,
  email: z.string().email(),
  name: z.string().min(1),
});

export const authSignupRequestSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(1),
    passwordConfirm: z.string().min(1),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: "비밀번호 확인이 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

export const authLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authSessionResponseSchema = z.object({
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
