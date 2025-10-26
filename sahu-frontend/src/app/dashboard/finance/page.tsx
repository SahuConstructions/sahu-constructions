"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import dayjs from "dayjs";
import { Wallet, Receipt, FileText } from "lucide-react";

export default function FinanceOverview() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    payrolls: 0,
    reimbursements: 0,
    pendingReimbursements: 0,
  });

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "FINANCE") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [payrollRes, reimburseRes] = await Promise.all([
        api.get("/payroll"),
        api.get("/reimbursements"),
      ]);
      const reimbursements = reimburseRes.data || [];
      setStats({
        payrolls: payrollRes.data?.length || 0,
        reimbursements: reimbursements.length,
        pendingReimbursements: reimbursements.filter(
          (r: any) => r.status === "PENDING"
        ).length,
      });
    } catch (err) {
      console.error("Failed to fetch finance overview data", err);
    }
  };

  const cards = [
    {
      title: "Reimbursements",
      value: stats.reimbursements,
      sub: "Total Requests",
      color: "bg-gradient-to-b from-slate-900 to-blue-900",
      icon: <Receipt className="w-6 h-6 text-white" />,
      link: "/dashboard/finance/reimbursements",
    },
    {
      title: "Pending Reviews",
      value: stats.pendingReimbursements,
      sub: "To be Processed",
      color: "bg-gradient-to-b from-slate-900 to-blue-900",
      icon: <FileText className="w-6 h-6 text-white" />,
      link: "/dashboard/finance/reimbursements",
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, {user?.email?.split("@")[0] || "Finance Admin"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Role:{" "}
              <span className="font-semibold text-blue-600">{user?.role}</span>
            </p>
          </div>
          <div className="text-sm text-gray-600 bg-green-100 px-3 py-1 rounded-md">
            {dayjs().format("MMMM YYYY")}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c) => (
          <div
            key={c.title}
            onClick={() => router.push(c.link)}
            className={`cursor-pointer bg-gradient-to-br ${c.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all`}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="bg-white/20 p-2 rounded-lg">{c.icon}</div>
              <span className="text-xs opacity-90 font-medium">{c.title}</span>
            </div>
            <div className="text-3xl font-bold">{c.value}</div>
            <div className="text-xs opacity-80 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
