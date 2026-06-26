import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { translations } from "../translations";
import {
  initDatabase,
  getUncheckedPlayers,
  getNotificationLog,
  getSettings,
} from "../state";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [language, setLanguage] = useState("ar");
  const [role, setRole] = useState("admin");
  const [syncTick, setSyncTick] = useState(0);
  const [toastStack, setToastStack] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [uncheckedCount, setUncheckedCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const start = async () => {
      try {
        await initDatabase();
        setIsLoading(false);
      } catch (error) {
        setIsOnline(false);
        setIsLoading(false);
      }
    };

    start();
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";

    const updateBadges = () => {
      setUncheckedCount(getUncheckedPlayers().length);
      setNotifCount(getNotificationLog().length);
    };
    updateBadges();
    const interval = setInterval(updateBadges, 4000);

    const handleStateUpdate = () => {
      setSyncTick((tick) => tick + 1);
      updateBadges();
      setIsOnline(true);
    };

    window.addEventListener("state-updated", handleStateUpdate);
    window.addEventListener("offline", () => setIsOnline(false));
    window.addEventListener("online", () => setIsOnline(true));

    return () => {
      clearInterval(interval);
      window.removeEventListener("state-updated", handleStateUpdate);
      window.removeEventListener("offline", () => setIsOnline(false));
      window.removeEventListener("online", () => setIsOnline(true));
    };
  }, []);

  const t = (key) => {
    if (!translations[language]) return key;
    return translations[language][key] || translations.en[key] || key;
  };

  const toast = (message, type = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToastStack((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToastStack((current) => current.filter((item) => item.id !== id));
    }, 4000);
  };

  const confirm = (message, onConfirm, options = {}) => {
    setConfirmState({ message, onConfirm, options });
  };

  const closeConfirm = () => setConfirmState(null);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      role,
      setRole,
      t,
      syncTick,
      toast,
      confirm,
      closeConfirm,
      confirmState,
      isLoading,
      isOnline,
      uncheckedCount,
      notifCount,
      settings: getSettings(),
    }),
    [
      language,
      role,
      syncTick,
      toastStack,
      confirmState,
      isLoading,
      isOnline,
      uncheckedCount,
      notifCount,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
