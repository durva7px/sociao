import type { ReactNode } from "react";
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from "react-router";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { SignupDraftProvider } from "./auth/SignupDraft";
import { ChooseUsernameScreen } from "./screens/ChooseUsernameScreen";
import { CreateAccountScreen } from "./screens/CreateAccountScreen";
import { FeedScreen } from "./screens/FeedScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import styles from "./screens/Auth.module.css";

interface AppProps {
  /** Tests pass a starting path; the real app uses the browser's address bar. */
  initialEntries?: string[];
}

export function App({ initialEntries }: AppProps) {
  const routes = (
    <AuthProvider>
      <SignupDraftProvider>
        <AppRoutes />
      </SignupDraftProvider>
    </AuthProvider>
  );
  return initialEntries ? (
    <MemoryRouter initialEntries={initialEntries}>{routes}</MemoryRouter>
  ) : (
    <BrowserRouter>{routes}</BrowserRouter>
  );
}

function AppRoutes() {
  const { state } = useAuth();

  // Until the server says who is logged in, show neither side (no flash of the wrong screen).
  if (state.status === "checking") {
    return (
      <p role="status" className={styles.status}>
        Loading…
      </p>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoggedOutOnly><LoginScreen /></LoggedOutOnly>} />
      <Route path="/signup" element={<LoggedOutOnly><CreateAccountScreen /></LoggedOutOnly>} />
      <Route path="/signup/username" element={<LoggedOutOnly><ChooseUsernameScreen /></LoggedOutOnly>} />
      <Route path="/" element={<LoggedInOnly><FeedScreen /></LoggedInOnly>} />
      <Route path="/profile" element={<LoggedInOnly><ProfileScreen /></LoggedInOnly>} />
      <Route path="/u/:username" element={<LoggedInOnly><ProfileScreen /></LoggedInOnly>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** GEN-06: logged-out Users are sent to Log in. */
function LoggedInOnly({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  if (state.status === "ready" && !state.user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Log in and Sign up make no sense once logged in: go Home instead. */
function LoggedOutOnly({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  if (state.status === "ready" && state.user) return <Navigate to="/" replace />;
  return <>{children}</>;
}
