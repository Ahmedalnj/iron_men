import React from "react";
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAppContext } from "./context/AppContext";
import { fetchAllFromSupabase } from "./state";
import LoadingScreen from "./components/LoadingScreen";
import Toast from "./components/Toast";
import ConfirmDialog from "./components/ConfirmDialog";

import {
  LayoutDashboard,
  Trophy,
  Monitor,
  Users,
  CheckSquare,
  Timer,
  FileSpreadsheet,
  UserPlus,
  Activity,
  RefreshCw,
  Bell,
  Settings as SettingsIcon,
  Globe,
  Wifi,
  WifiOff,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import CheckIn from "./pages/CheckIn";
import Timing from "./pages/Timing";
import Results from "./pages/Results";
import Leaderboard from "./pages/Leaderboard";
import PlayerRanking from "./pages/PlayerRanking";
import Incidents from "./pages/Incidents";
import Substitutions from "./pages/Substitutions";
import Notifications from "./pages/Notifications";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const {
    language,
    setLanguage,
    role,
    setRole,
    t,
    syncTick,
    confirmState,
    closeConfirm,
    confirm,
    isLoading,
    isOnline,
    uncheckedCount,
    notifCount,
    toastStack,
  } = useAppContext();

  const toggleLanguage = () => {
    const nextLang = language === "ar" ? "en" : "ar";
    setLanguage(nextLang);
    document.documentElement.lang = nextLang;
    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
  };

  const handleTabChange = (nextTab) => {
    const path = nextTab.startsWith("/") ? nextTab : tabToPath[nextTab] || "/";
    navigate(path);
    const content = document.querySelector(".page-content");
    if (content) content.scrollTop = 0;
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await fetchAllFromSupabase();
      toast("Data refreshed successfully", "success");
    } catch (error) {
      toast(error?.message || "Failed to refresh data", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      label: t("dashboard"),
      icon: <LayoutDashboard size={18} />,
      to: "/",
    },
    {
      id: "results",
      label: t("results"),
      icon: <Trophy size={18} />,
      to: "/results",
    },
    {
      id: "leaderboard",
      label: t("leaderboard"),
      icon: <Monitor size={18} />,
      to: "/leaderboard",
    },
    {
      id: "player_ranking",
      label: t("player_ranking"),
      icon: <Users size={18} />,
      to: "/player-ranking",
    },
    {
      id: "checkin",
      label: t("checkin"),
      icon: <CheckSquare size={18} />,
      to: "/checkin",
      badge: uncheckedCount,
    },
    {
      id: "timing",
      label: t("timing"),
      icon: <Timer size={18} />,
      to: "/timing",
    },
    {
      id: "teams",
      label: t("teams"),
      icon: <FileSpreadsheet size={18} />,
      to: "/teams",
    },
    {
      id: "players",
      label: t("players"),
      icon: <UserPlus size={18} />,
      to: "/players",
    },
    {
      id: "incidents",
      label: t("incidents"),
      icon: <Activity size={18} />,
      to: "/incidents",
    },
    {
      id: "substitutions",
      label: t("substitutions"),
      icon: <RefreshCw size={18} />,
      to: "/substitutions",
    },
    {
      id: "notifications",
      label: t("notifications"),
      icon: <Bell size={18} />,
      to: "/notifications",
      badge: notifCount,
    },
    {
      id: "settings",
      label: t("settings"),
      icon: <SettingsIcon size={18} />,
      to: "/settings",
    },
  ];

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="app-container">
      <nav className="navbar">
        <a
          href="/"
          className="navbar-brand"
          onClick={(event) => {
            event.preventDefault();
            handleTabChange("dashboard");
          }}
        >
          <div className="navbar-logo">🏋️‍♂️</div>
          <div className="navbar-title-container">
            <h1 className="navbar-title">
              {t("yes") === "نعم"
                ? "بطولة البطل الحديدي 2026"
                : "Iron Champion 2026"}
            </h1>
            <span className="navbar-subtitle">
              بطولة التتابع للموانع / Obstacle Relay Championship
            </span>
          </div>
        </a>

        <div className="navbar-actions">
          <div className="selector-group">
            <button
              className={`selector-btn ${role === "admin" ? "active" : ""}`}
              onClick={() => setRole("admin")}
              title={t("admin")}
            >
              {language === "ar" ? "مشرف" : "Admin"}
            </button>
            <button
              className={`selector-btn ${role === "timekeeper" ? "active" : ""}`}
              onClick={() => setRole("timekeeper")}
              title={t("timekeeper")}
            >
              {language === "ar" ? "حكم" : "Judge"}
            </button>
            <button
              className={`selector-btn ${role === "viewer" ? "active" : ""}`}
              onClick={() => setRole("viewer")}
              title={t("viewer")}
            >
              {language === "ar" ? "مشاهد" : "Spectator"}
            </button>
          </div>

          <span className={`role-badge ${role}`}>🛡️ {t(role)}</span>
          {<span
            className={`role-badge ${isOnline ? "admin" : "viewer"}`}
            style={{ padding: "0.35rem 0.6rem" }}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}{" "}
            {isOnline ? "Online" : "Offline"}
          </span>}

          <button
            className="btn btn-secondary"
            onClick={refreshData}
            disabled={isRefreshing}
            title="Refresh Data"
            style={{
              padding: "0.4rem 0.8rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <RefreshCw
              size={16}
              style={
                isRefreshing
                  ? { animation: "spin 1s linear infinite" }
                  : undefined
              }
            />
            {isRefreshing
              ? language === "ar"
                ? "جارٍ التحديث"
                : "Refreshing..."
              : language === "ar"
                ? "تحديث"
                : "Refresh"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={toggleLanguage}
            style={{ padding: "0.4rem 0.8rem" }}
          >
            <Globe size={16} style={{ marginInlineEnd: "0.25rem" }} />
            {language === "ar" ? "English" : "العربية"}
          </button>
        </div>
      </nav>

      <div className="main-wrapper">
        <aside className="sidebar">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => handleTabChange(item.to)}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="badge refunded number-text"
                  style={{ padding: "0.15rem 0.4rem", fontSize: "0.7rem" }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </aside>

        <main className="page-content">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard t={t} setTab={handleTabChange} syncTick={syncTick} />
              }
            />
            <Route
              path="/results"
              element={<Results t={t} syncTick={syncTick} />}
            />
            <Route
              path="/leaderboard"
              element={<Leaderboard t={t} syncTick={syncTick} />}
            />
            <Route
              path="/player-ranking"
              element={<PlayerRanking t={t} syncTick={syncTick} />}
            />
            <Route
              path="/checkin"
              element={<CheckIn t={t} role={role} syncTick={syncTick} />}
            />
            <Route
              path="/timing"
              element={<Timing t={t} role={role} syncTick={syncTick} />}
            />
            <Route
              path="/teams"
              element={<Teams t={t} role={role} syncTick={syncTick} />}
            />
            <Route
              path="/players"
              element={<Players t={t} role={role} syncTick={syncTick} />}
            />
            <Route
              path="/incidents"
              element={<Incidents t={t} role={role} syncTick={syncTick} />}
            />
            <Route
              path="/substitutions"
              element={<Substitutions t={t} role={role} syncTick={syncTick} />}
            />
            <Route
              path="/notifications"
              element={<Notifications t={t} syncTick={syncTick} />}
            />
            <Route
              path="/settings"
              element={<Settings t={t} role={role} syncTick={syncTick} />}
            />
          </Routes>
        </main>
      </div>

      <Toast toasts={toastStack} />
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.options?.title || "Confirm"}
        message={confirmState?.message || ""}
        confirmText={confirmState?.options?.confirmText || "Confirm"}
        cancelText={confirmState?.options?.cancelText || "Cancel"}
        variant={confirmState?.options?.variant || "warning"}
        onConfirm={() => {
          confirmState?.onConfirm?.();
          closeConfirm();
        }}
        onCancel={closeConfirm}
      />
    </div>
  );
}

const tabToPath = {
  dashboard: "/",
  results: "/results",
  leaderboard: "/leaderboard",
  player_ranking: "/player-ranking",
  checkin: "/checkin",
  timing: "/timing",
  teams: "/teams",
  players: "/players",
  incidents: "/incidents",
  substitutions: "/substitutions",
  notifications: "/notifications",
  settings: "/settings",
};
