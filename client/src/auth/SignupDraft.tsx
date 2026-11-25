import { createContext, useContext, useState, type ReactNode } from "react";
import type { CreateAccountDetails } from "../api/auth";

// The Create Account details carried from step 1 to Choose Username (D-011).
// Held in React memory ONLY: it contains the password, so it never goes into
// localStorage, sessionStorage or the router's history state. A refresh clears it.

interface SignupDraftValue {
  draft: CreateAccountDetails | null;
  setDraft: (draft: CreateAccountDetails | null) => void;
}

const SignupDraftContext = createContext<SignupDraftValue | null>(null);

export function SignupDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CreateAccountDetails | null>(null);
  return <SignupDraftContext.Provider value={{ draft, setDraft }}>{children}</SignupDraftContext.Provider>;
}

export function useSignupDraft() {
  const value = useContext(SignupDraftContext);
  if (!value) throw new Error("useSignupDraft must be used inside <SignupDraftProvider>");
  return value;
}
