"use client";

import type { AuthMeResponse, AuthSessionResponse } from "@fragment/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMe, logout } from "@/features/auth/api";
import { useAuth } from "@/features/auth/components/auth-provider";
import { authMeQueryKey } from "./auth-query-keys";

export { authMeQueryKey } from "./auth-query-keys";

type UseAuthMeQueryOptions = {
  redirectOnUnauthorized?: boolean;
};

export function createOrganizationlessAuthMeFromSession(
  session: AuthSessionResponse,
): AuthMeResponse {
  return {
    organization: null,
    user: session.user,
  };
}

export function useAuthMeQuery({ redirectOnUnauthorized = true }: UseAuthMeQueryOptions = {}) {
  const { accessToken, refreshAccessToken } = useAuth();

  return useQuery({
    queryFn: async () => {
      if (!accessToken) {
        await refreshAccessToken();
      }

      return getMe({ redirectOnUnauthorized });
    },
    queryKey: authMeQueryKey,
  });
}

export function useLogoutMutation() {
  const { clearSession } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearSession();
      queryClient.removeQueries({ queryKey: authMeQueryKey });
    },
  });
}
