"use client";

// Estado de login do app inteiro. Guarda o usuário e o token (localStorage) e expõe
// login / register / logout. Usa as rotas: POST /auth/login, GET /auth/me, POST /user.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, setUnauthorizedHandler, tokenStore, type User } from "./api";

type Status = "loading" | "authed" | "anon";

type AuthContextValue = {
  user: User | null;
  status: Status;
  login: (email: string, senha: string) => Promise<void>;
  register: (username: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const logout = useCallback(() => {
    tokenStore.clear();
    setUserState(null);
    setStatus("anon");
  }, []);

  // Ao abrir o app: se há token salvo, confirma com o back quem é o usuário.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    let cancelado = false;
    async function restaurar() {
      if (!tokenStore.get()) {
        setStatus("anon");
        return;
      }
      try {
        const me = await api<User>("/auth/me");
        if (cancelado) return;
        setUserState(me);
        setStatus("authed");
      } catch {
        if (cancelado) return;
        tokenStore.clear();
        setStatus("anon");
      }
    }
    void restaurar();
    return () => {
      cancelado = true;
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const login = useCallback(async (email: string, senha: string) => {
    const { access_token } = await api<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: { email, senha },
      auth: false,
    });
    tokenStore.set(access_token);
    const me = await api<User>("/auth/me");
    setUserState(me);
    setStatus("authed");
  }, []);

  const register = useCallback(
    async (username: string, email: string, senha: string) => {
      await api<User>("/user", {
        method: "POST",
        body: { username, email, senha },
        auth: false,
      });
      await login(email, senha); // o cadastro não devolve token: entra direto em seguida
    },
    [login],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout, setUser: setUserState }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
