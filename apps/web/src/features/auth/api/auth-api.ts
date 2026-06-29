import type {
  AuthLoginRequest,
  AuthMeResponse,
  AuthSessionResponse,
  AuthSignupRequest,
} from "@fragment/shared";

import { apiClient } from "@/lib/api-client";

type GetMeOptions = {
  redirectOnUnauthorized?: boolean;
};

export function signup(request: AuthSignupRequest) {
  return apiClient<AuthSessionResponse>("/auth/signup", {
    auth: false,
    method: "POST",
    body: request,
  });
}

export function login(request: AuthLoginRequest) {
  return apiClient<AuthSessionResponse>("/auth/login", {
    auth: false,
    method: "POST",
    body: request,
  });
}

export function logout() {
  return apiClient("/auth/logout", {
    auth: false,
    method: "POST",
    responseType: "void",
  });
}

export function refreshSession() {
  return apiClient<AuthSessionResponse>("/auth/refresh", {
    auth: false,
    method: "POST",
  });
}

export function getMe({ redirectOnUnauthorized }: GetMeOptions = {}) {
  return apiClient<AuthMeResponse>("/auth/me", {
    method: "GET",
    redirectOnUnauthorized,
  });
}
