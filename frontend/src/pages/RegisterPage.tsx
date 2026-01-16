import { useState } from "react";
import { useNavigate , Link} from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await api.post("/register", { email, password, role });
      navigate("/login"); // redirect to login after registration
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="w-full max-w-md p-8 border rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
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
      <select
        className="w-full mb-4 p-2 border rounded"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="user">User</option>
        <option value="partner">Partner</option>
        <option value="admin">Admin</option>
      </select>
      <Button className="w-full" onClick={handleRegister}>
        Register
      </Button>
      {error && <p className="mt-4 text-red-500">{error}</p>}
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-500 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
