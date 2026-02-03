import { useState } from "react";
import { UserProvider, useUser } from "./UserContext";
import UserSelect from "./components/UserSelect";
import Home from "./components/Home";
import Workout from "./components/Workout";
import History from "./components/History";
import Plans from "./components/Plans";
import "./App.css";

type Tab = "home" | "workout" | "history" | "plans";

function AppContent() {
  const { user, setUser } = useUser();
  const [tab, setTab] = useState<Tab>("home");
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user) return <UserSelect />;

  const handleWorkoutChange = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Workout Tracker</h1>
        <div className="user-picker">
          <span className="user-name">{user.name}</span>
          <button className="user-switch" onClick={() => setUser(null)}>
            Switch
          </button>
        </div>
        <nav className="tabs">
          <button
            className={tab === "home" ? "tab active" : "tab"}
            onClick={() => setTab("home")}
          >
            Home
          </button>
          <button
            className={tab === "workout" ? "tab active" : "tab"}
            onClick={() => setTab("workout")}
          >
            Workout
          </button>
          <button
            className={tab === "history" ? "tab active" : "tab"}
            onClick={() => setTab("history")}
          >
            History
          </button>
          <button
            className={tab === "plans" ? "tab active" : "tab"}
            onClick={() => setTab("plans")}
          >
            Plans
          </button>
        </nav>
      </header>
      <main>
        {tab === "home" && (
          <Home
            onStartWorkout={() => setTab("workout")}
            refreshKey={refreshKey}
          />
        )}
        {tab === "workout" && (
          <Workout onWorkoutChange={handleWorkoutChange} />
        )}
        {tab === "history" && <History refreshKey={refreshKey} />}
        {tab === "plans" && <Plans />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
