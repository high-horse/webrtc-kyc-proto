import { create } from "zustand";
import api from "@/lib/api";

interface User {
  id: number;
  email: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  fetchUser: async () => {
    try {
      const res = await api.get("/profile");
      set({ user: res.data });
    } catch {
      set({ user: null }); // not logged in
    }
  },

  logout: async () => {
    try {
      await api.post("/logout"); // backend should clear HTTP-only cookie
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      set({ user: null }); // reset state
    }
  },
}));
