import { useState } from "react";
import { useUser } from "../UserContext";
import { createUser } from "../api";
import styles from "./UserSelect.module.css";

export default function UserSelect() {
  const { users, setUser, refreshUsers } = useUser();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    setError("");
    try {
      const user = await createUser(newName.trim());
      await refreshUsers();
      setUser(user);
    } catch {
      setError("Failed to create user");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.userSelect}>
      <h2>Who's working out?</h2>
      <div className={styles.userList}>
        {users.map((u) => (
          <button key={u.id} className={styles.userCard} onClick={() => setUser(u)}>
            {u.name}
          </button>
        ))}
      </div>
      <div className={styles.userCreate}>
        <input
          type="text"
          placeholder="New user name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button onClick={handleCreate} disabled={busy || !newName.trim()}>
          {busy ? "Creating..." : "Create"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
