"use client";

import type { AuthMeResponse, AuthSessionResponse } from "@fragment/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMe, logout, refreshSession } from "@/features/auth/api";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/access-token";

export const authMeQueryKey = ["auth", "me"] as const;

export function createOrganizationlessAuthMeFromSession(
  session: AuthSessionResponse,
): AuthMeResponse {
  return {
    organization: null,
    user: session.user,
  };
}

async function getCurrentAuthMe() {
  if (!getAccessToken()) {
    const session = await refreshSession();

    setAccessToken(session.accessToken);
  }

  return getMe();
}

export function useAuthMeQuery() {
  return useQuery({
    queryFn: getCurrentAuthMe,
    queryKey: authMeQueryKey,
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAccessToken();
      queryClient.removeQueries({ queryKey: authMeQueryKey });
    },
  });
}
