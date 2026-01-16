import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // ← add useLocation
import { useAuthStore } from "@/stores/useAuthStore";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const user = useAuthStore((state) => state.user);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // ← get current path

  useEffect(() => {
    const init = async () => {
      await fetchUser();
      setLoading(false);
    };
    init();
  }, [fetchUser]);

  useEffect(() => {
    if (!loading && user) {
      // Allow staff to stay on KYC-related public pages
      const isKycPage = location.pathname.startsWith("/kyc") || 
                        location.pathname.startsWith("/schedule");
      
      if (!isKycPage) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [loading, user, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {children}
    </div>
  );
}