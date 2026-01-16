import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { Toaster } from "sonner";


interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      await fetchUser();
      setLoading(false);
    };
    init();
  }, [fetchUser]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, navigate, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-white shadow flex justify-between items-center">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </header>
      <main className="flex-1 p-4 bg-gray-100">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
