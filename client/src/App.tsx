import { useState } from "react";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Settings from "./components/Settings";
import "./App.css";

type Tab = "home" | "form" | "history" | "settings";

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
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
            className={tab === "home" ? "tab active" : "tab"}
            onClick={() => setTab("home")}
          >
            Home
          </button>
          <button
            className={tab === "form" ? "tab active" : "tab"}
            onClick={() => setTab("form")}
          >
            Form
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
        {tab === "home" && (
          <Home
            onStartWorkout={() => setTab("form")}
            refreshKey={refreshKey}
          />
        )}
        {tab === "form" && <Dashboard onWorkoutLogged={handleWorkoutLogged} />}
        {tab === "history" && <History refreshKey={refreshKey} />}
        {tab === "settings" && <Settings />}
      </main>
    </div>
  );
}
