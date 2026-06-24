import type {
  AuthLoginRequest,
  AuthMeResponse,
  AuthSessionResponse,
  AuthSignupRequest,
} from "@fragment/shared";

import { apiClient } from "@/lib/api-client";

export function signup(request: AuthSignupRequest) {
  return apiClient<AuthSessionResponse>("/auth/signup", {
    method: "POST",
    body: request,
  });
}

export function login(request: AuthLoginRequest) {
  return apiClient<AuthSessionResponse>("/auth/login", {
    method: "POST",
    body: request,
  });
}

export function logout() {
  return apiClient("/auth/logout", {
    method: "POST",
    responseType: "void",
  });
}

export function refreshSession() {
  return apiClient<AuthSessionResponse>("/auth/refresh", {
    method: "POST",
  });
}

export function getMe() {
  return apiClient<AuthMeResponse>("/auth/me", {
    method: "GET",
  });
}
