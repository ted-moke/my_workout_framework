import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "./types";
import { fetchUsers } from "./api";

interface UserContextValue {
  user: User | null;
  users: User[];
  setUser: (user: User | null) => void;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  users: [],
  setUser: () => {},
  refreshUsers: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refreshUsers = async () => {
    const list = await fetchUsers();
    setUsers(list);
  };

  useEffect(() => {
    fetchUsers()
      .then((list) => {
        setUsers(list);
        const savedId = localStorage.getItem("selectedUserId");
        if (savedId) {
          const found = list.find((u) => u.id === parseInt(savedId, 10));
          if (found) setUserState(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem("selectedUserId", String(u.id));
    } else {
      localStorage.removeItem("selectedUserId");
    }
  };

  if (!loaded) return null;

  return (
    <UserContext.Provider value={{ user, users, setUser, refreshUsers }}>
      {children}
    </UserContext.Provider>
  );
}
