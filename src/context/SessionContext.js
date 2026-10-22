import { createContext, useContext } from "react";

// Results of the current analysis session, shared between the Analysis,
// Results and Dashboard pages.
export const SessionContext = createContext(null);

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside <SessionProvider>.");
  }

  return context;
}
