import { useCallback, useMemo, useState } from "react";
import { SessionContext } from "./SessionContext";

function SessionProvider({ children }) {
  const [facialSamples, setFacialSamples] = useState([]);
  const [textEntries, setTextEntries] = useState([]);

  const addFacialSample = useCallback((sample) => {
    // Keep the latest 60 samples (about two minutes at one sample per 2s).
    setFacialSamples((current) => [...current, sample].slice(-60));
  }, []);

  const addTextEntry = useCallback((entry) => {
    setTextEntries((current) => [...current, entry]);
  }, []);

  const resetSession = useCallback(() => {
    setFacialSamples([]);
    setTextEntries([]);
  }, []);

  const value = useMemo(
    () => ({
      facialSamples,
      textEntries,
      addFacialSample,
      addTextEntry,
      resetSession,
    }),
    [facialSamples, textEntries, addFacialSample, addTextEntry, resetSession],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export default SessionProvider;
