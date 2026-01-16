import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

export default function HomeRedirect() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await fetchUser(); // get user from backend if cookie exists
      setLoading(false);
    };
    init();
  }, [fetchUser]);

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate("/dashboard", { replace: true });
      } else {
        // navigate("/login", { replace: true });
         navigate("/kyc", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
