"use client";

import type { AuthSessionResponse } from "@fragment/shared";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { refreshSession } from "@/features/auth/api";
import { authMeQueryKey } from "@/features/auth/queries/auth-query-keys";
import { configureApiClientAuth, resetApiClientAuth } from "@/lib/api-client";

type AuthContextValue = {
  accessToken: string | null;
  clearSession: () => void;
  refreshAccessToken: () => Promise<string>;
  setSession: (session: AuthSessionResponse) => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const accessTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<string> | null>(null);

  const clearAccessToken = useCallback(() => {
    accessTokenRef.current = null;
    setAccessTokenState(null);
  }, []);

  const setAccessToken = useCallback((token: string) => {
    accessTokenRef.current = token;
    setAccessTokenState(token);
  }, []);

  const clearSession = useCallback(() => {
    clearAccessToken();
    queryClient.removeQueries({ queryKey: authMeQueryKey });
  }, [clearAccessToken, queryClient]);

  const redirectToLogin = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [clearSession, router]);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = refreshSession()
        .then((session) => {
          setAccessToken(session.accessToken);
          return session.accessToken;
        })
        .catch((error: unknown) => {
          clearAccessToken();
          throw error;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }

    return refreshPromiseRef.current;
  }, [clearAccessToken, setAccessToken]);

  useEffect(() => {
    configureApiClientAuth({
      getAccessToken: () => accessTokenRef.current,
      onUnauthorized: redirectToLogin,
      refreshAccessToken,
    });
    setConfigured(true);

    return () => {
      resetApiClientAuth();
    };
  }, [redirectToLogin, refreshAccessToken]);

  const setSession = useCallback(
    (session: AuthSessionResponse) => {
      setAccessToken(session.accessToken);
    },
    [setAccessToken],
  );

  const value = useMemo(
    () => ({
      accessToken,
      clearSession,
      refreshAccessToken,
      setSession,
    }),
    [accessToken, clearSession, refreshAccessToken, setSession],
  );

  if (!configured) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
