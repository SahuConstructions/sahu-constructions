"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HardHat, LogIn } from "lucide-react";
import api from "../lib/api";
import { setToken, getUserFromToken } from "../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      const res = await api.post("/auth/login", { email, password });
  
      if (res.data.status === "ok" && res.data.accessToken) {
        setToken(res.data.accessToken);
      
        if (res.data.mustReset) {
          localStorage.setItem("mustReset", "true");
          console.log("⚠️ mustReset flag stored = true");
        } else {
          localStorage.removeItem("mustReset");
        }
      
        const user = getUserFromToken();
        const role = user?.role?.toLowerCase() || "employee";
      
        let path = "/dashboard/employee";
        switch (role) {
          case "admin":
            path = "/dashboard/admin";
            break;
          case "hr":
            path = "/dashboard/hr";
            break;
          case "manager":
            path = "/dashboard/manager";
            break;
          case "finance":
            path = "/dashboard/finance";
            break;
        }
      
        // ✅ Delay navigation slightly to ensure flag persists
        setTimeout(() => {
          router.push(path);
        }, 100);
      }
       else {
        setError(res.data.message || "Invalid response from server.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
      {/* Animated construction lighting accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,0,0.07),_transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(0,120,255,0.1),_transparent_70%)]" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-8 space-y-6">
        {/* Logo + Title */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            {/* <HardHat className="text-yellow-400 drop-shadow" size={36} /> */}
            <h1 className="text-2xl font-extrabold tracking-wide text-white">
              <span className="text-white-400">SAHU</span>{" "}
              <span className="text-blue-400">CONSTRUCTIONS</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-2 tracking-wide">
            Employee Management Portal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-sm mb-2">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-400 bg-red-500/10 border border-red-600/30 rounded-md px-3 py-2 text-sm text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-900 via-blue-200 to-blue-800 hover:brightness-110 text-slate-900 font-semibold py-2.5 rounded-lg shadow-md transition-all"
          >
            {loading ? (
              <span className="animate-pulse">Logging in...</span>
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
          <div className="text-center mt-4">
  <button
    type="button"
    onClick={() =>
      alert(
        "If you have forgotten your password, please contact your HR to reset it."
      )
    }
    className="text-sm text-blue-400 hover:text-blue-300 underline transition"
  >
    Forgot Password?
  </button>
</div>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-800">
          © {new Date().getFullYear()} Sahu Constructions. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
