"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import HeaderBar from "@/components/HeaderBar";
import api from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/context/ToastContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mustReset, setMustReset] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    const flag = localStorage.getItem("mustReset");
    console.log("Popup check — mustReset =", flag);
    if (flag === "true") {
      setMustReset(true);
    }
  }, []);

  const handleChangePassword = async (e: any) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.warning("Passwords do not match");
      return;
    }
    try {
      await api.post("/auth/change-password", { oldPassword, newPassword });
      toast.success("Password updated successfully! Logging out...");
      setTimeout(() => {
        localStorage.clear();
        router.push("/");
      }, 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      {mustReset ? (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form
            onSubmit={handleChangePassword}
            className="bg-white p-8 rounded-2xl shadow-lg w-[400px] space-y-4 text-center"
          >
            <h2 className="text-lg font-semibold text-gray-800">
              🔒 Reset Your Password
            </h2>
            <p className="text-sm text-gray-500">
              You must change your temporary password before continuing.
            </p>
            <input
              type="password"
              placeholder="Temporary Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md font-medium transition"
            >
              Update Password
            </button>

          </form>
        </div>
      ) : (
        <>
          {/* Sidebar and header stay the same */}
          <aside className="hidden md:flex fixed inset-y-0 left-0 z-30">
            <Sidebar
              isOpen={true}
              toggle={() => setIsSidebarOpen(false)}
              isCollapsed={isCollapsed}
              toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />
          </aside>

          <AnimatePresence>
            {isSidebarOpen && (
              <>
                <motion.div
                  className="fixed inset-0 bg-black/50 z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsSidebarOpen(false)}
                />
                <motion.aside
                  className="fixed inset-y-0 left-0 z-50 w-72"
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Sidebar
                    isOpen={isSidebarOpen}
                    toggle={() => setIsSidebarOpen(false)}
                    isCollapsed={false}
                  />
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          <div className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
            <HeaderBar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="flex-1 overflow-y-auto bg-gray-50 px-4 sm:px-6 md:px-8 py-6">
              <div className="w-full mx-auto fade-in">{children}</div>
            </main>
          </div>
        </>
      )}
    </div>
  );
}
