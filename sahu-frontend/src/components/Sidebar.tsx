"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";

interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}

export default function Sidebar({ isOpen, toggle, isCollapsed = false, toggleCollapse }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<string>("");
  const [role, setRole] = useState<string>("employee");
  const [basePath, setBasePath] = useState<string>("/dashboard/employee");
  const [stats, setStats] = useState({ leaves: 0, timesheets: 0, reimbursements: 0 });

  // Load role from token
  useEffect(() => {
    const user = getUserFromToken();
    if (user?.role) {
      const roleName = user.role.toLowerCase();
      setRole(roleName);
      if (["hr", "manager", "admin", "finance", "super admin"].includes(roleName)) {
        setBasePath(`/dashboard/${roleName.replace(" ", "")}`);
        fetchStats();
      }
    }
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    }
  };

  // Active section based on pathname
  useEffect(() => {
    const lastSegment = pathname.split("/").pop();
    if (!lastSegment || ["employee", "hr", "manager", "admin", "finance", "superadmin"].includes(lastSegment)) {
      setActive("overview");
    } else {
      setActive(lastSegment);
    }
  }, [pathname]);

  // Role-specific nav items
  const EMPLOYEE_ITEMS: NavItem[] = [
    { id: "overview", label: "Overview", icon: <HomeIcon size={18} /> },
    { id: "leaves", label: "My Leaves", icon: <CalendarDays size={18} /> },
    { id: "attendance", label: "Attendance", icon: <Clock size={18} /> },
    { id: "timesheets", label: "Timesheets", icon: <FileText size={18} /> },
    { id: "payslips", label: "Payslips", icon: <Wallet size={18} /> },
    { id: "reimbursements", label: "Reimbursements", icon: <Receipt size={18} /> },
  ];

  const ADMIN_ITEMS: NavItem[] = [
    { id: "overview", label: "Overview", icon: <HomeIcon size={18} /> },
    { id: "employees", label: "Employees", icon: <Users size={18} /> },
    { id: "add-employee", label: "Add Employee", path: "/dashboard/admin/add-employee", icon: <UserPlus size={18} /> },
    { id: "attendance", label: "Attendance", path: "/dashboard/admin/attendance", icon: <Clock size={18} /> },
    { id: "leaves", label: "Leaves", icon: <CalendarDays size={18} /> },
    { id: "timesheets", label: "Timesheets", icon: <FileText size={18} /> },
    { id: "reimbursements", label: "Reimbursements", path: "/dashboard/admin/reimbursements", icon: <Receipt size={18} /> },
    { id: "workforce-summary", label: "Workforce Summary", path: "/dashboard/admin/workforce-summary", icon: <FileText size={18} /> },
    { id: "payroll", label: "Payroll", icon: <Wallet size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  const HR_ITEMS: NavItem[] = [
    { id: "overview", label: "Overview", path: "/dashboard/hr", icon: <HomeIcon size={18} /> },
    { id: "attendance", label: "Attendance", path: "/dashboard/hr/attendance", icon: <Clock size={18} /> },
    { id: "employees", label: "Employees", path: "/dashboard/hr/employees", icon: <Users size={18} /> },
    { id: "leaves", label: "Leaves", path: "/dashboard/hr/leaves", icon: <CalendarDays size={18} /> },
    { id: "timesheets", label: "Timesheets", path: "/dashboard/hr/timesheets", icon: <FileText size={18} /> },
    { id: "add-employee", label: "Add Employee", path: "/dashboard/hr/add-employee", icon: <UserPlus size={18} /> },
    { id: "workforce-summary", label: "Workforce Summary", path: "/dashboard/hr/workforce-summary", icon: <FileText size={18} /> },
    { id: "payroll", label: "Payroll", path: "/dashboard/hr/payroll", icon: <Wallet size={18} /> },
    { id: "reimbursements", label: "Reimbursements", path: "/dashboard/hr/reimbursements", icon: <Receipt size={18} /> },
  ];

  const MANAGER_ITEMS: NavItem[] = [
    { id: "overview", label: "Overview", path: "/dashboard/manager", icon: <HomeIcon size={18} /> },
    {
      id: "attendance-group",
      label: "Attendance",
      icon: <Clock size={18} />,
      children: [
        { id: "attendance", label: "Employee Attendance", path: "/dashboard/manager/attendance" },
        { id: "my-attendance", label: "My Attendance", path: "/dashboard/manager/my-attendance" },
      ],
    },
    {
      id: "leaves-group",
      label: "Leaves",
      icon: <CalendarDays size={18} />,
      children: [
        { id: "leaves", label: "Employee Leaves", path: "/dashboard/manager/leaves" },
        { id: "my-leaves", label: "My Leaves", path: "/dashboard/manager/my-leaves" },
      ],
    },
    {
      id: "timesheets-group",
      label: "Timesheets",
      icon: <FileText size={18} />,
      children: [
        { id: "timesheets", label: "Employee Timesheets", path: "/dashboard/manager/timesheets" },
        { id: "my-timesheets", label: "My Timesheets", path: "/dashboard/manager/my-timesheets" },
      ],
    },
    { id: "team", label: "Workforce Summary", path: "/dashboard/manager/team", icon: <Users size={18} /> },
    {
      id: "reimbursements-group",
      label: "Reimbursements",
      icon: <Receipt size={18} />,
      children: [
        { id: "reimbursements", label: "Employee Reimbursements", path: "/dashboard/manager/reimbursements" },
        { id: "my-reimbursements", label: "My Reimbursements", path: "/dashboard/manager/my-reimbursements" },
      ],
    },
  ];

  const FINANCE_ITEMS: NavItem[] = [
    { id: "overview", label: "Overview", path: "/dashboard/finance", icon: <HomeIcon size={18} /> },
    { id: "reimbursements", label: "Reimbursements", path: "/dashboard/finance/reimbursements", icon: <Receipt size={18} /> },
  ];

  const NAV_ITEMS: NavItem[] =
    role === "admin"
      ? ADMIN_ITEMS
      : role === "manager"
        ? MANAGER_ITEMS
        : role === "hr"
          ? HR_ITEMS
          : role === "finance"
            ? FINANCE_ITEMS
            : EMPLOYEE_ITEMS;

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getBadgeCount = (id: string) => {
    if (id === "leaves" && stats.leaves > 0) return stats.leaves;
    if (id === "timesheets" && stats.timesheets > 0) return stats.timesheets;
    if (id === "reimbursements" && stats.reimbursements > 0) return stats.reimbursements;
    return 0;
  };

  const handleNavigate = (item: NavItem) => {
    if (item.children) {
      toggleMenu(item.id);
      return;
    }

    if (item.path) {
      router.push(item.path);
    } else {
      if (item.id === "overview") router.push(basePath);
      else router.push(`${basePath}/${item.id}`);
    }

    if (window.innerWidth < 768) toggle();
  };

  // Sidebar width classes
  const sidebarWidth = isCollapsed ? "w-20" : "w-64";

  return (
    <aside
      className={`
        h-full bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl flex flex-col text-white
        transition-all duration-300 ease-in-out overflow-hidden
        ${sidebarWidth}
      `}
    >
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-4 border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm min-h-[60px]`}>
        {/* Logo/Title */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <h1 className="text-lg font-bold tracking-wide text-white whitespace-nowrap">
            SAHU ERP
          </h1>
        </div>

        {/* Desktop Collapse Toggle */}
        {toggleCollapse && (
          <button
            onClick={toggleCollapse}
            className="hidden md:flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-700 transition-all duration-200 p-2 rounded-full"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}

        {/* Mobile Close Button */}
        <button
          onClick={toggle}
          className="md:hidden text-gray-400 hover:text-white transition"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isChildActive = item.children && item.children.some(c => active === c.id);
          const isActive = active === item.id;
          const isExpanded = expandedMenus[item.id];

          return (
            <div key={item.id} className="mb-1">
              <button
                onClick={() => handleNavigate(item)}
                title={isCollapsed ? item.label : ""}
                className={`
                  flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isCollapsed ? 'justify-center' : 'justify-between'}
                  ${isActive && !item.children
                    ? "bg-white text-slate-900 font-semibold shadow-sm border-l-4 border-blue-500"
                    : "text-gray-300 hover:bg-slate-700/40 hover:text-white"
                  }
                  ${isChildActive ? "text-white font-semibold" : ""}
                `}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <div className={`flex-shrink-0 p-1 rounded-md transition-colors duration-200 ${isActive && !item.children ? "bg-slate-200 text-slate-900" : ""}`}>
                    {item.icon}
                  </div>
                  <span className={`whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                    {item.label}
                  </span>

                  {/* 🔔 Badge */}
                  {!isCollapsed && getBadgeCount(item.id) > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {getBadgeCount(item.id)}
                    </span>
                  )}
                </div>

                {/* Arrow for children */}
                {item.children && !isCollapsed && (
                  <span className="text-gray-400 transition-transform duration-200">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                )}
              </button>

              {/* Submenu */}
              {item.children && isExpanded && !isCollapsed && (
                <div className="mt-1 ml-4 border-l border-slate-700 pl-2 space-y-1 animate-fadeIn">
                  {item.children.map((child) => {
                    const isChildSelected = active === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(child);
                        }}
                        className={`
                          flex items-center gap-2 px-3 py-2 w-full rounded-md text-sm transition-all duration-200
                          ${isChildSelected
                            ? "bg-white text-slate-900 font-semibold shadow-sm border-l-4 border-blue-500"
                            : "text-gray-400 hover:text-white hover:bg-slate-800/50"
                          }
                        `}
                      >
                        {!isChildSelected && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>}
                        <span className="flex-1 text-left">{child.label}</span>
                        {/* 🔔 Submenu Badge */}
                        {getBadgeCount(child.id) > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {getBadgeCount(child.id)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`mt-auto px-4 py-4 border-t border-slate-800 text-xs text-gray-500 bg-slate-900 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'opacity-0 h-0 py-0' : 'opacity-100'}`}>
        <p className="whitespace-nowrap">© 2025 Sahu Construction</p>
      </div>
    </aside>
  );
}
