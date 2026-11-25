import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getMe, type User } from "../api/auth";

// Who is logged in, shared by every screen. Checked once with the server when the app opens.

type AuthState =
  | { status: "checking" }
  | { status: "ready"; user: User | null };

interface AuthContextValue {
  state: AuthState;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;
    getMe()
      .catch(() => null) // can't reach the server: treat as logged out
      .then((user) => {
        if (!cancelled) setState({ status: "ready", user: user ?? null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setUser = (user: User | null) => setState({ status: "ready", user });

  return <AuthContext.Provider value={{ state, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
