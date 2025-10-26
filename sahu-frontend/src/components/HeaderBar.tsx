"use client";

import { useEffect, useState } from "react";
import { Menu, LogOut, HardHat } from "lucide-react";
import { getUserFromToken, clearToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

interface HeaderBarProps {
  toggleSidebar: () => void;
}

export default function HeaderBar({ toggleSidebar }: HeaderBarProps) {
  const [user, setUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState("");
  const router = useRouter();

  useEffect(() => {
    const u = getUserFromToken();
    if (!u) router.push("/");
    else setUser(u);
    setCurrentDate(dayjs().format("dddd, D MMM YYYY"));
  }, []);

  const logout = () => {
    clearToken();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-sm">
      <div className="flex items-center justify-between px-5 py-2 md:px-8">
        {/* Left: Sidebar Toggle + Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-300 hover:text-yellow-400 transition"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-2 select-none">
            {/* <HardHat className="text-yellow-400 drop-shadow-sm" size={26} /> */}
            <h1 className="text-lg md:text-xl font-extrabold tracking-wide text-white">
              <span className="text-white-400">SAHU</span>{" "}
              <span className="text-blue-400">CONSTRUCTIONS</span>
            </h1>
          </div>
        </div>

        {/* Right: User Info + Logout */}
        <div className="flex items-center gap-5">
          {user && (
            <div className="hidden md:flex flex-col items-end text-right">
              <div className="text-sm font-semibold text-white">
                {user.email}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`px-2 py-0.5 rounded-md font-semibold ${
                    user.role === "ADMIN"
                      ? "bg-red-700/30 text-red-400 border border-red-700/40"
                      : user.role === "HR"
                      ? "bg-green-700/30 text-green-400 border border-green-700/40"
                      : user.role === "MANAGER"
                      ? "bg-indigo-700/30 text-indigo-400 border border-indigo-700/40"
                      : user.role === "FINANCE"
                      ? "bg-amber-700/30 text-amber-400 border border-amber-700/40"
                      : "bg-blue-700/30 text-blue-400 border border-blue-700/40"
                  }`}
                >
                  {user.role}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{currentDate}</span>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-sm font-medium shadow-sm transition"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Accent Line (Construction Feel) */}
      <div className="h-[3px] w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-blue-500 shadow-lg" />
    </header>
  );
}
