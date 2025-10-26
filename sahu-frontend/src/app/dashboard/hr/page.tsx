"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import dayjs from "dayjs";
import {
  Users,
  CalendarClock,
  FileText,
  UserPlus,
  BarChart3,
  PieChart,
  Filter,
  Receipt,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Pie,
  PieChart as RePieChart,
  Cell,
} from "recharts";

export default function HrOverview() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    employees: 0,
    leaves: 0,
    timesheets: 0,
    payrolls: 0,
    reimbursements: 0,
    pendingReimbursements: 0,
  });
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<any[]>([]);
  const [recentTimesheets, setRecentTimesheets] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [leaveChart, setLeaveChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "HR") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchOverviewData();
  }, [month, year]);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [emp, leaves, timesheets] = await Promise.all([
        api.get("/employees"),
        api.get("/leaves/pending"),
        api.get("/timesheets"),
      ]);

      const filteredTimesheets = timesheets.data.filter((t: any) => {
        const d = dayjs(t.date);
        return d.month() + 1 === month && d.year() === year;
      });

      const filteredLeaves = leaves.data.filter((l: any) => {
        const d = dayjs(l.startDate);
        return d.month() + 1 === month && d.year() === year;
      });

      const [payrollRes, reimburseRes] = await Promise.all([
              api.get("/payroll"),
              api.get("/reimbursements"),
            ]);
            const reimbursements = reimburseRes.data || [];

      setStats({
        employees: emp.data?.length || 0,
        leaves: filteredLeaves.length,
        timesheets: filteredTimesheets.length,
        payrolls: payrollRes.data?.length || 0,
        reimbursements: reimbursements.length,
        pendingReimbursements: reimbursements.filter(
          (r: any) => r.status === "PENDING_HR"
        ).length,
      });

      setRecentEmployees(emp.data.slice(-5).reverse());
      setRecentLeaves(filteredLeaves.slice(0, 5));
      setRecentTimesheets(filteredTimesheets.slice(0, 5));

      const grouped = groupBy(filteredTimesheets, "employee.name");
      const data = Object.entries(grouped).map(([name, entries]: any) => ({
        name,
        hours: entries.reduce((a: number, b: any) => a + b.hours, 0),
      }));
      setChartData(data.slice(0, 5));

      const leaveStatusCount = countBy(filteredLeaves, "status");
      setLeaveChart(
        Object.entries(leaveStatusCount).map(([status, count]) => ({
          name: status,
          value: count,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch HR overview data", err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Employees",
      value: stats.employees,
      sub: "Total Workforce",
      color: "bg-gradient-to-b from-slate-800 to-blue-800",
      icon: <Users className="w-6 h-6 text-white" />,
      link: "/dashboard/hr/employees",
    },
    {
      title: "Pending Leaves",
      value: stats.leaves,
      sub: "Awaiting Approval",
      color: "bg-gradient-to-b from-slate-800 to-blue-800",
      icon: <CalendarClock className="w-6 h-6 text-white" />,
      link: "/dashboard/hr/leaves",
    },
    {
      title: "Timesheets",
      value: stats.timesheets,
      sub: "This Month",
      color: "bg-gradient-to-b from-slate-800 to-blue-800",
      icon: <FileText className="w-6 h-6 text-white" />,
      link: "/dashboard/hr/timesheets",
    },
    {
      title: "Add Employee",
      value: "+",
      sub: "New Staff Entry",
      color: "bg-gradient-to-b from-slate-800 to-blue-800",
      icon: <UserPlus className="w-6 h-6 text-white" />,
      link: "/dashboard/hr/add-employee",
    },
    {
      title: "Payroll",
      value: stats.payrolls,
      sub: "Manage Salaries",
      color: "bg-gradient-to-b from-slate-800 to-blue-800",
      icon: <Wallet className="w-6 h-6 text-white" />,
      link: "/dashboard/hr/payroll",
    },
    {
      title: "Pending Reimbursements",
      value: stats.pendingReimbursements,
      sub: "Approval Pending",
      color: "bg-gradient-to-b from-slate-800 to-blue-800",
      icon: <Receipt className="w-6 h-6 text-white" />,
      link: "/dashboard/hr/reimbursements",
    },
  ];

  const months: string[] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            HR Overview — {dayjs(`${year}-${month}-01`).format("MMMM YYYY")}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back,{" "}
            <span className="font-semibold text-blue-600">
              {user?.email?.split("@")[0]}
            </span>
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="text-gray-500" size={20} />
          <select
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {months.map((m: string, i: number) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = dayjs().year() - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
        {cards.map((c) => (
          <div
            key={c.title}
            onClick={() => router.push(c.link)}
            className={`cursor-pointer bg-gradient-to-br ${c.color} text-white p-6 pr-3 pl-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2`}
          >
            <div className="flex justify-between items-center mb-1">
              <div className="bg-white/20 p-1  rounded-md">{c.icon}</div>
              <span className="text-xs opacity-90 font-medium">{c.title}</span>
            </div>
            <div className="text-3xl font-bold">{loading ? "…" : c.value}</div>
            <div className="text-xs opacity-80 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <OverviewCard
          title="Top Employees by Logged Hours"
          icon={<BarChart3 className="text-emerald-600" />}
        >
          <div className="h-64">
            {chartData.length === 0 ? (
              <EmptyState message="No data for this period" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hours" fill="#10b981" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </OverviewCard>

        <OverviewCard
          title="Leave Status Breakdown"
          icon={<PieChart className="text-blue-600" />}
        >
          <div className="h-64 flex justify-center">
            {leaveChart.length === 0 ? (
              <EmptyState message="No leave data available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={leaveChart}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {leaveChart.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={["#2563eb", "#10b981", "#f59e0b", "#ef4444"][index % 4]}
                      />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
            )}
          </div>
        </OverviewCard>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <OverviewCard
          title="Recent Pending Leaves"
          icon={<CalendarClock className="text-blue-600" />}
        >
          {recentLeaves.length === 0 ? (
            <EmptyState message="No leaves this month" />
          ) : (
            <OverviewTable
              headers={["Employee", "Type", "From → To"]}
              rows={recentLeaves.map((l) => [
                l.employee?.name,
                l.type,
                `${l.startDate?.substring(0, 10)} → ${l.endDate?.substring(0, 10)}`,
              ])}
            />
          )}
        </OverviewCard>

        <OverviewCard title="New Employees" icon={<Users className="text-indigo-600" />}>
          {recentEmployees.length === 0 ? (
            <EmptyState message="No new employees" />
          ) : (
            <OverviewTable
              headers={["Name", "Email", "Role"]}
              rows={recentEmployees.map((e) => [
                e.name,
                e.user?.email,
                e.user?.role,
              ])}
            />
          )}
        </OverviewCard>

        <OverviewCard
          title="Latest Timesheets"
          icon={<FileText className="text-emerald-600" />}
        >
          {recentTimesheets.length === 0 ? (
            <EmptyState message="No timesheets" />
          ) : (
            <OverviewTable
              headers={["Employee", "Project", "Hours"]}
              rows={recentTimesheets.map((t) => [
                t.employee?.name,
                t.project,
                `${t.hours}h`,
              ])}
            />
          )}
        </OverviewCard>
      </div>
    </div>
  );
}

/* Helper Functions */
function groupBy(arr: any[], key: string) {
  return arr.reduce((acc, obj) => {
    const val = key.split(".").reduce((o, k) => o?.[k], obj);
    (acc[val] = acc[val] || []).push(obj);
    return acc;
  }, {});
}

function countBy(arr: any[], key: string) {
  return arr.reduce((acc, obj) => {
    const val = obj[key];
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

/* Components */
function OverviewCard({ title, icon, children }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5">
      <div className="flex items-center gap-2 mb-4 border-b pb-2">
        {icon}
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function OverviewTable({ headers, rows }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            {headers.map((h: string, i: number) => (
              <th key={i} className="py-2 px-3 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any, i: number) => (
            <tr
              key={i}
              className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50/40 transition`}
            >
              {r.map((c: any, j: number) => (
                <td key={j} className="py-2 px-3 text-gray-700">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ message }: any) {
  return <div className="text-gray-500 text-sm text-center py-6">{message}</div>;
}
