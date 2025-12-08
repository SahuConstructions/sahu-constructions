"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import dayjs from "dayjs";
import { Wallet, Receipt, FileText } from "lucide-react";
import DonutChart from "@/components/charts/DonutChart";
import AreaChartWidget from "@/components/charts/AreaChartWidget";
import RadialBarChart from "@/components/charts/RadialBarChart";

export default function FinanceOverview() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    payrolls: 0,
    reimbursements: 0,
    pendingReimbursements: 0,
    approvalRate: 0,
    monthlyTrend: [] as any[],
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
      const approved = reimbursements.filter((r: any) => r.status === "APPROVED").length;
      const rate = reimbursements.length > 0 ? Math.round((approved / reimbursements.length) * 100) : 0;
      const monthlyData = generateMonthlyExpenses(reimbursements);

      setStats({
        payrolls: payrollRes.data?.length || 0,
        reimbursements: reimbursements.length,
        pendingReimbursements: reimbursements.filter(
          (r: any) => r.status === "PENDING"
        ).length,
        approvalRate: rate,
        monthlyTrend: monthlyData,
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

      {/* Enhanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-center">
          <DonutChart
            percentage={stats.approvalRate}
            label="Approval Rate"
            subtitle="All Reimbursements"
            color="#10b981"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-center">
          <RadialBarChart
            value={stats.pendingReimbursements}
            maxValue={stats.reimbursements}
            label="Pending Review"
            subtitle="Requires Action"
            color="#f59e0b"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-center">
          <RadialBarChart
            value={stats.reimbursements - stats.pendingReimbursements}
            maxValue={stats.reimbursements}
            label="Processed"
            subtitle="Completed Items"
            color="#3b82f6"
          />
        </div>
      </div>

      {/* Monthly Expenses Trend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <AreaChartWidget
          data={stats.monthlyTrend}
          xKey="month"
          yKeys={["amount"]}
          title="Monthly Reimbursement Trends"
          colors={["#3b82f6"]}
          height={250}
        />
      </div>
    </div>
  );
}

function generateMonthlyExpenses(reimbursements: any[]) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = dayjs().subtract(5 - i, "month");
    return {
      month: date.format("MMM"),
      amount: 0,
    };
  });

  reimbursements.forEach((r: any) => {
    const month = dayjs(r.createdAt).format("MMM");
    const entry = months.find((m) => m.month === month);
    if (entry) {
      entry.amount += r.amount || 0;
    }
  });

  return months;
}
