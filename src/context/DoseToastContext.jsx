import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DoseToast } from "../components/DoseToast.jsx";

const DoseToastContext = createContext(/** @type {((msg: string) => void) | null} */ (null));

export function DoseToastProvider({ children }) {
  const [message, setMessage] = useState(null);
  const clear = useCallback(() => setMessage(null), []);
  const showDoseToast = useCallback((msg) => {
    if (typeof msg === "string" && msg.trim()) setMessage(msg.trim());
  }, []);

  const value = useMemo(() => showDoseToast, [showDoseToast]);

  return (
    <DoseToastContext.Provider value={value}>
      {children}
      <DoseToast message={message} onDismiss={clear} />
    </DoseToastContext.Provider>
  );
}

/** No-op when used outside provider (e.g. tests). */
export function useShowDoseToast() {
  return useContext(DoseToastContext) ?? (() => {});
}
