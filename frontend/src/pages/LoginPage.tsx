import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

interface LoginPageProps {
  role?: "admin" | "partner" | "user";
}

export default function LoginPage({ role = "user" }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    try {
      const response = await api.post("/login", { email, password, role });

      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem("auth_token", response.data.token);
      }

      // Fetch user profile
      const res = await api.get("/profile");
      setUser(res.data);
      setError("");

      // Redirect to dashboard or intended page
      navigate((location.state as any)?.from || "/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
      // Clear token on login failure
      localStorage.removeItem("auth_token");
    }
  };

  
  const heading =
    role === "admin"
      ? "Admin Login"
      : role === "partner"
      ? "Partner Login"
      : "User Login";

  return (
    <div className="w-full max-w-md p-8 border rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-6 text-center">{heading}</h2>
      <input
        type="email"
        placeholder="Email"
        className="w-full mb-4 p-2 border rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full mb-4 p-2 border rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button className="w-full" onClick={handleLogin}>
        Login
      </Button>
      {error && <p className="mt-4 text-red-500">{error}</p>}
      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link to="/register" className="text-blue-500 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
