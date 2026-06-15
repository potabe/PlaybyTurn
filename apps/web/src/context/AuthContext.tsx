import { createContext, useContext, ReactNode } from "react";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}

export function useAuth(): any {
  return { user: {} as any, session: {} as any, profile: {} as any, isLoading: false, signOut: async () => {} };
}
