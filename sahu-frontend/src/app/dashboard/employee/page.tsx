"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import {
  Clock,
  FileText,
  Wallet,
  Receipt,
  CalendarArrowDown,
} from "lucide-react";

export default function EmployeeOverview() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUserFromToken();
    if (!u) {
      router.push("/");
      return;
    }
    setUser(u);
    fetchAllData(u.userId);
  }, []);

  const fetchAllData = async (userId: number) => {
    try {
      const [att, time, pay, reimb, leave] = await Promise.all([
        api.get("/attendance/me"),
        api.get("/timesheets/me"),
        api.get(`/payroll/mypayslips/${userId}`),
        api.get("/reimbursements/me"),
        api.get("/leaves/me"),
      ]);

      setAttendance(att.data.records ?? att.data ?? []);
      setTimesheets(time.data ?? []);
      setPayslips(pay.data ?? []);
      setReimbursements(reimb.data ?? []);
      setLeaves(leave.data ?? []);
    } catch (err) {
      console.error("❌ Error fetching overview data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-600">Loading overview...</div>;
  if (!user) return null;

  const summary = {
    totalAttendance: attendance.length,
    totalTimesheets: timesheets.length,
    totalPayslips: payslips.length,
    totalReimbursements: reimbursements.length,
    totalLeaves: leaves.length,
  };

  const goTo = (path: string) => router.push(`/dashboard/employee/${path}`);

  return (
    <div className="p-6 space-y-8">
      <div className="rounded-2xl border bg-white shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, {user?.email?.split("@")[0] || "Employee"}
            </h1>
            <p className="text-sm text-gray-500">
              Role:{" "}
              <span className="font-medium text-blue-700">{user.role}</span>
            </p>
          </div>
          <div className="hidden md:block text-sm bg-green-100 text-green-800 px-3 py-1 rounded">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard
            color="bg-gradient-to-b from-slate-800 to-blue-800"
            label="Attendance"
            value={summary.totalAttendance}
            sub="Days Logged"
            icon={<Clock className="w-5 h-5" />}
            onClick={() => goTo("attendance")}
          />
          <SummaryCard
            color="bg-gradient-to-b from-slate-800 to-blue-800"
            label="Timesheets"
            value={summary.totalTimesheets}
            sub="Projects Recorded"
            icon={<FileText className="w-5 h-5" />}
            onClick={() => goTo("timesheets")}
          />
          <SummaryCard
            color="bg-gradient-to-b from-slate-800 to-blue-800"
            label="Payslips"
            value={summary.totalPayslips}
            sub="Months Processed"
            icon={<Wallet className="w-5 h-5" />}
            onClick={() => goTo("payslips")}
          />
          <SummaryCard
            color="bg-gradient-to-b from-slate-800 to-blue-800"
            label="Reimbursements"
            value={summary.totalReimbursements}
            sub="Claims Submitted"
            icon={<Receipt className="w-5 h-5" />}
            onClick={() => goTo("reimbursements")}
          />
          <SummaryCard
            color="bg-gradient-to-b from-slate-800 to-blue-800"
            label="Leaves"
            value={summary.totalLeaves}
            sub="Applications Sent"
            icon={<CalendarArrowDown className="w-5 h-5" />}
            onClick={() => goTo("leaves")}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color, icon, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer bg-gradient-to-br ${color} text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1 flex items-start gap-3`}
    >
      <div className="bg-white/20 p-2 rounded-md">{icon}</div>
      <div>
        <div className="text-xs opacity-90">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs opacity-80 mt-1">{sub}</div>
      </div>
    </div>
  );
}
