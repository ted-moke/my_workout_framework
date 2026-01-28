import { useState } from "react";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Settings from "./components/Settings";
import "./App.css";

type Tab = "dashboard" | "history" | "settings";

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleWorkoutLogged = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Workout Tracker</h1>
        <nav className="tabs">
          <button
            className={tab === "dashboard" ? "tab active" : "tab"}
            onClick={() => setTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={tab === "history" ? "tab active" : "tab"}
            onClick={() => setTab("history")}
          >
            History
          </button>
          <button
            className={tab === "settings" ? "tab active" : "tab"}
            onClick={() => setTab("settings")}
          >
            Settings
          </button>
        </nav>
      </header>
      <main>
        {tab === "dashboard" && <Dashboard onWorkoutLogged={handleWorkoutLogged} />}
        {tab === "history" && <History refreshKey={refreshKey} />}
        {tab === "settings" && <Settings />}
      </main>
    </div>
  );
}
