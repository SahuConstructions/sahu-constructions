"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  CalendarDays,
  Clock,
  FileText,
  Wallet,
  Receipt,
  Users,
  Settings,
  Menu,
  UserPlus,
} from "lucide-react";
import { getUserFromToken, clearToken } from "@/lib/auth";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<string>("");
  const [role, setRole] = useState<string>("employee");
  const [basePath, setBasePath] = useState<string>("/dashboard/employee");

  // Load role from token
  useEffect(() => {
    const user = getUserFromToken();
    if (user?.role) {
      const roleName = user.role.toLowerCase();
      setRole(roleName);

      // base route depending on role
      if (["hr", "manager", "admin", "finance", "super admin"].includes(roleName)) {
        setBasePath(`/dashboard/${roleName.replace(" ", "")}`);
      }
    }
  }, []);

  // Active section based on pathname
  useEffect(() => {
    const lastSegment = pathname.split("/").pop();
    if (!lastSegment || lastSegment === "employee" || lastSegment === "hr" || lastSegment === "manager" || lastSegment === "admin" || lastSegment === "finance" || lastSegment === "superadmin") {
      setActive("overview");
    } else {
      setActive(lastSegment);
    }
  }, [pathname]);

  // Role-specific nav items
  const EMPLOYEE_ITEMS = [
    { id: "overview", label: "Overview", icon: <HomeIcon size={18} /> },
    { id: "leaves", label: "My Leaves", icon: <CalendarDays size={18} /> },
    { id: "attendance", label: "Attendance", icon: <Clock size={18} /> },
    { id: "timesheets", label: "Timesheets", icon: <FileText size={18} /> },
    { id: "payslips", label: "Payslips", icon: <Wallet size={18} /> },
    { id: "reimbursements", label: "Reimbursements", icon: <Receipt size={18} /> },
  ];

  const ADMIN_ITEMS = [
    { id: "overview", label: "Overview", icon: <HomeIcon size={18} /> },
    { id: "employees", label: "Employees", icon: <Users size={18} /> },
    { id: "leaves", label: "Leaves", icon: <CalendarDays size={18} /> },
    { id: "timesheets", label: "Timesheets", icon: <FileText size={18} /> },
    { id: "payroll", label: "Payroll", icon: <Wallet size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  const HR_ITEMS = [
    { id: "overview", label: "Overview", path: "/dashboard/hr", icon: <HomeIcon size={18} /> },
    { id: "attendance", label: "Attendance", path: "/dashboard/hr/attendance", icon: <Clock size={18} /> },
    { id: "employees", label: "Employees", path: "/dashboard/hr/employees", icon: <Users size={18} />  },
    { id: "leaves", label: "Leaves", path: "/dashboard/hr/leaves", icon: <CalendarDays size={18} />  },
    { id: "timesheets", label: "Timesheets", path: "/dashboard/hr/timesheets", icon: <FileText size={18} />  },
    { id: "add-employee", label: "Add Employee", path: "/dashboard/hr/add-employee", icon: <UserPlus size={18} />  },
    { id: "workforce-summary", label: "Workforce Summary", path: "/dashboard/hr/workforce-summary", icon: <FileText size={18} /> },
    { id: "payroll", label: "Payroll", path: "/dashboard/finance/payroll", icon: <Wallet size={18} /> },
    { id: "reimbursements", label: "Reimbursements", path: "/dashboard/finance/reimbursements", icon: <Receipt size={18} /> },
  ]
  ;

  const MANAGER_ITEMS = [
    { id: "overview", label: "Overview", path: "/dashboard/manager", icon: <HomeIcon size={18} /> },
    { id: "attendance", label: "Attendance", path: "/dashboard/manager/attendance", icon: <Clock size={18} /> },
    { id: "leaves", label: "Leaves", path: "/dashboard/manager/leaves", icon: <CalendarDays size={18} /> },
    { id: "timesheets", label: "Timesheets", path: "/dashboard/manager/timesheets", icon: <FileText size={18} /> },
    { id: "team", label: "Workforce Summary", path: "/dashboard/manager/team", icon: <FileText size={18} /> },
    { id: "reimbursements", label: "Reimbursements", path: "/dashboard/finance/reimbursements", icon: <Receipt size={18} /> },
  ];

  // 🔹 ✅ Finance Nav
  const FINANCE_ITEMS = [
    { id: "overview", label: "Overview", path: "/dashboard/finance", icon: <HomeIcon size={18} /> },
    { id: "reimbursements", label: "Reimbursements", path: "/dashboard/finance/reimbursements", icon: <Receipt size={18} /> },
  ];
  // Choose correct nav items based on role
  const NAV_ITEMS =
    role === "admin"
      ? ADMIN_ITEMS
      : role === "manager"
      ? MANAGER_ITEMS
      : role === "hr"
      ? HR_ITEMS
      : role === "finance"
      ? FINANCE_ITEMS
      : EMPLOYEE_ITEMS;

      const handleNavigate = (id: string) => {
        if (id === "overview") router.push(basePath);
        else router.push(`${basePath}/${id}`);
        if (window.innerWidth < 768) toggle();
      };
      

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: -220 }}
          animate={{ x: 0 }}
          exit={{ x: -220 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed md:static top-0 left-0 z-30 h-full w-64 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl flex flex-col text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm">
            <h1 className="text-lg font-bold tracking-wide">SAHU ERP</h1>
            <button
              onClick={toggle}
              className="md:hidden hover:text-gray-300 transition"
            >
              <Menu size={22} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1 overflow-y-auto p-4 divide-y divide-slate-700">
            {NAV_ITEMS.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNavigate(n.id)}
                className={`flex items-center gap-3 px-3 py-2 w-full rounded-lg text-left transition-all ${
                  active === n.id
  ? "bg-white text-slate-900 font-semibold shadow-sm border-l-4 border-blue-500"
  : "text-gray-300 hover:bg-slate-700/40 hover:text-white"

                }`}
              >
                <div
                  className={`p-2 rounded-md ${
                    active === n.id ? "bg-slate-200 text-slate-900" : ""
                  }`}
                >
                  {n.icon}
                </div>
                <span className="text-sm tracking-wide">{n.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="mt-auto px-4 py-3 border-t border-slate-700 text-xs text-gray-400 bg-slate-900/70">
            © 2025 Sahu Construction
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
