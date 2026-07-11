import { useState } from "react";
import { FiHome, FiMapPin } from "react-icons/fi";
import { UserProvider, useUser } from "./UserContext";
import UserSelect from "./components/UserSelect";
import Home from "./components/Home";
import Workout from "./components/Workout";
import History from "./components/History";
import Plans from "./components/Plans";
import Exercises from "./components/Exercises";
import "./global.css";
import styles from "./App.module.css";

type Tab = "home" | "workout" | "history" | "plans" | "exercises";

function AppContent() {
  const { user, setUser, setLocation } = useUser();
  const [tab, setTab] = useState<Tab>("home");
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user) return <UserSelect />;

  const handleWorkoutChange = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <h1>Workout Tracker</h1>
        <div className={styles.userPicker}>
          <span className={styles.userName}>{user.name}</span>
          <button className={styles.userSwitch} onClick={() => setUser(null)}>
            Switch
          </button>
          <div className={styles.locationToggle}>
            {(["home", "gym"] as const).map((loc) => (
              <button
                key={loc}
                className={`${styles.locationBtn}${
                  user.workout_location === loc ? ` ${styles.locationBtnActive}` : ""
                }`}
                onClick={() => setLocation(loc)}
                title={
                  loc === "home"
                    ? "Only show exercises you have the equipment for"
                    : "Show all exercises"
                }
              >
                {loc === "home" ? <FiHome /> : <FiMapPin />}
                {loc === "home" ? "Home" : "Gym"}
              </button>
            ))}
          </div>
        </div>
        <nav className={styles.tabs}>
          <button
            className={`${styles.tab}${tab === "home" ? ` ${styles.tabActive}` : ""}`}
            onClick={() => setTab("home")}
          >
            Home
          </button>
          <button
            className={`${styles.tab}${tab === "workout" ? ` ${styles.tabActive}` : ""}`}
            onClick={() => setTab("workout")}
          >
            Workout
          </button>
          <button
            className={`${styles.tab}${tab === "plans" ? ` ${styles.tabActive}` : ""}`}
            onClick={() => setTab("plans")}
          >
            Plans
          </button>
          <button
            className={`${styles.tab}${tab === "exercises" ? ` ${styles.tabActive}` : ""}`}
            onClick={() => setTab("exercises")}
          >
            Exercises
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
        {tab === "plans" && <Plans />}
        {tab === "exercises" && <Exercises />}
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
