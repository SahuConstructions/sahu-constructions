// src/app/dashboard/manager/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import dayjs from "dayjs";
import {
  Users,
  CalendarClock,
  Clock,
  AlertCircle,
  LogOut,
} from "lucide-react";

/**
 * Manager overview (mounted at /dashboard/manager)
 * Other routes remain: /dashboard/manager/leaves, /team, /attendance, /timesheets
 */
export default function Page() {
  return <ManagerOverview />;
}

function ManagerOverview() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);

  const [leaves, setLeaves] = useState<any[]>([]);
  const [employeeSummary, setEmployeeSummary] = useState<any[]>([]);
  const [attendanceOverview, setAttendanceOverview] = useState<any | null>(
    null
  );
  const [reportMonth, setReportMonth] = useState<number>(dayjs().month() + 1);
  const [reportYear, setReportYear] = useState<number>(dayjs().year());
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "MANAGER") {
      // not allowed -> back to login
      router.push("/");
      return;
    }
    setUser(u);
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-fetch when month/year changed (if you add UI to change them later)
  useEffect(() => {
    if (user) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportMonth, reportYear]);

  const logout = () => {
    clearToken();
    router.push("/");
  };

  const fetchAll = async () => {
    fetchLeaves();
    fetchEmployeeSummary(reportYear, reportMonth);
    fetchAttendanceOverview();
  };

  const fetchLeaves = async () => {
    try {
      const res = await api.get("/leaves/pending");
      setLeaves(res.data || []);
    } catch (err) {
      console.error("Failed to fetch leaves", err);
      setLeaves([]);
      setMessage("❌ Failed to fetch leaves");
    }
  };

  const fetchEmployeeSummary = async (year: number, month: number) => {
    try {
      const res = await api.get(`/timesheets/report/${year}/${month}`);
      setEmployeeSummary(res.data || []);
    } catch (err) {
      console.error("Failed to fetch employee summary", err);
      setEmployeeSummary([]);
      setMessage("❌ Failed to fetch workforce summary");
    }
  };

  const fetchAttendanceOverview = async () => {
    try {
      const res = await api.get("/attendance/overview/today");
      // expected shape: { total, present, absent, late } but will handle if missing
      setAttendanceOverview(res.data || null);
    } catch (err) {
      console.warn("Attendance overview not available", err);
      setAttendanceOverview(null);
    }
  };

  const openEmployeeDetail = async (id: number, name: string) => {
    // navigate to team page and optionally open the modal there.
    // For now we'll open a modal inside this page (use the same API used previously)
    // We'll fetch employee detail and show a modal (re-using code below)
    try {
      const res = await api.get(
        `/attendance/report/employee-detail/${id}/${reportYear}/${reportMonth}`
      );
      setModalEmployee({ name, details: res.data || [] });
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch employee detail", err);
      setMessage("❌ Failed to fetch employee detail");
    }
  };

  // employee detail modal state
  const [showModal, setShowModal] = useState(false);
  const [modalEmployee, setModalEmployee] = useState<{ name: string; details: any[] } | null>(null);

  // small helper to compute donut percent
  const getAttendanceDonut = () => {
    const a = attendanceOverview;
    if (!a) return { present: 0, total: 0, percent: 0 };
    const present = Number(a.present || 0);
    const absent = Number(a.absent || 0);
    const late = Number(a.late || 0);
    const total = present + absent + late || 0;
    const percent = total === 0 ? 0 : Math.round((present / total) * 100);
    return { present, total, percent, absent, late };
  };

  const stats = {
    pendingLeaves: leaves.length,
    teamMembers: employeeSummary.length,
    timesheets: (employeeSummary || []).reduce((s, x) => s + (x.totalHours ? 1 : 0), 0) || 0,
    presentToday: attendanceOverview?.present ?? "--",
  };

  if (!user) return <div>Loading...</div>;

  const donut = getAttendanceDonut();

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Manager Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome, <span className="font-semibold text-blue-700">{user.email?.split?.("@")?.[0]}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-sm text-gray-700 font-medium bg-green-100 px-3 py-1 rounded">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          color="bg-gradient-to-b from-slate-800 to-blue-800"
          label="Pending Leaves"
          value={stats.pendingLeaves}
          sub="Awaiting approval"
          onClick={() => router.push("/dashboard/manager/leaves")}
        />
        <SummaryCard
          color="bg-gradient-to-b from-slate-800 to-blue-800"
          label="Team Members"
          value={stats.teamMembers}
          sub="Your team"
          onClick={() => router.push("/dashboard/manager/team")}
        />
        <SummaryCard
          color="bg-gradient-to-b from-slate-800 to-blue-800"
          label="Month"
          value={`${reportMonth}/${reportYear}`}
          sub="Current cycle"
        />
        <SummaryCard
          color="bg-gradient-to-b from-slate-800 to-blue-800"
          label="Present Today"
          value={stats.presentToday}
          sub={`${donut.total || 0} total • ${donut.late || 0} late`}
          onClick={() => router.push("/dashboard/manager/attendance")}
        />
      </div>

      {/* Main content: left table, right charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workforce summary / table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Workforce Summary</h3>
            <div className="text-sm text-gray-500">Month: {reportMonth}/{reportYear}</div>
          </div>

          {employeeSummary.length === 0 ? (
            <div className="text-gray-500">No workforce data available.</div>
          ) : (
            <div className="overflow-x-auto rounded-md">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gray-50/80 text-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left">Employee</th>
                    <th className="py-3 px-4 text-left">Days Worked</th>
                    <th className="py-3 px-4 text-left">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeSummary.map((emp: any, idx: number) => (
                    <tr key={emp.employeeId || idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50/30`}>
                      <td className="py-3 px-4 text-blue-600 cursor-pointer" onClick={() => openEmployeeDetail(emp.employeeId, emp.name)}>
                        {emp.name}
                      </td>
                      <td className="py-3 px-4">{emp.daysWorked ?? "-"}</td>
                      <td className="py-3 px-4">{emp.totalHours ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: attendance donut + recent leaves */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col items-center">
            <h4 className="text-sm text-gray-700 mb-3">Today's Attendance</h4>

            <div className="flex items-center gap-4">
              <AttendanceDonut percent={donut.percent} size={130} />
              <div>
                <div className="text-2xl font-bold text-gray-800">{donut.present}/{donut.total}</div>
                <div className="text-sm text-gray-500">Present / Total</div>
                <div className="mt-3 text-sm">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-sm inline-block" /> Present: {donut.present}</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-sm inline-block" /> Absent: {donut.absent ?? 0}</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-400 rounded-sm inline-block" /> Late: {donut.late ?? 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">Recent Pending Leaves</h4>
              <button className="text-sm text-blue-600" onClick={() => router.push("/dashboard/manager/leaves")}>View all</button>
            </div>

            {leaves.length === 0 ? (
              <div className="text-gray-500 text-sm">No pending leaves</div>
            ) : (
              <div className="space-y-2">
                {leaves.slice(0, 6).map((l) => (
                  <div key={l.id} className="flex items-start justify-between gap-3 border-b last:border-b-0 pb-2">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{l.employee?.name || "—"}</div>
                      <div className="text-xs text-gray-500">{l.type} • {l.startDate?.substring(0,10)} → {l.endDate?.substring(0,10)}</div>
                    </div>
                    <div className="text-xs text-yellow-700 px-2 py-1 rounded bg-yellow-50">{l.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {message && <div className="text-center text-sm text-red-600">{message}</div>}

      {/* Employee detail modal */}
      {showModal && modalEmployee && (
        <EmployeeDetailModal
          name={modalEmployee.name}
          details={modalEmployee.details}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

/* ----------------- small components ----------------- */

function SummaryCard({ label, value, sub, color, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer bg-gradient-to-br ${color} text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1`}
    >
      <div className="text-xs opacity-90">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80 mt-1">{sub}</div>
    </div>
  );
}

function AttendanceDonut({ percent, size = 120 }: { percent: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (percent / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      <g transform={`translate(${size/2}, ${size/2})`}>
        {/* background circle */}
        <circle r={radius} fill="#f3f4f6" />
        {/* track */}
        <circle r={radius} fill="none" stroke="#e6e7ea" strokeWidth={12} />
        {/* progress stroke (rotate -90deg so 12 o'clock start) */}
        <circle
          r={radius}
          fill="none"
          stroke="url(#g1)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform={`rotate(-90)`}
        />
        <text x="0" y="4" textAnchor="middle" fontSize="18" fontWeight={700} fill="#111827">
          {percent ?? 0}%
        </text>
      </g>
    </svg>
  );
}

/* Employee detail modal (attendance rows) */
function EmployeeDetailModal({ name, details, onClose }: any) {
  const SHIFT_START_MIN = 9 * 60 + 30;
  const SHIFT_END_MIN = 17 * 60 + 30;

  const minutesFromTs = (ts: string | Date | null | undefined) => {
    if (!ts) return null;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return null;
    return d.getHours() * 60 + d.getMinutes();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-auto p-6">
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <h3 className="text-lg font-semibold">Attendance — <span className="text-indigo-600">{name}</span></h3>
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-700 text-white rounded-md">Close</button>
        </div>

        {(!details || details.length === 0) ? (
          <p className="text-gray-600">No attendance records found.</p>
        ) : (
          <div className="rounded-lg border border-gray-100">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  {["Date", "IN Time", "OUT Time", "Total Hours"].map((h, i) => (
                    <th key={i} className="py-3 px-4 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {details.map((d: any, i: number) => {
                  const inMin = minutesFromTs(d.inTime);
                  const outMin = minutesFromTs(d.outTime);
                  const isLate = inMin !== null && inMin > SHIFT_START_MIN;
                  const isEarly = outMin !== null && outMin < SHIFT_END_MIN;

                  return (
                    <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="py-3 px-4">{d.date}</td>
                      <td className={`py-3 px-4 ${isLate ? "text-red-600 font-semibold" : ""}`}>
                        {d.inTime ? new Date(d.inTime).toLocaleString() : "-"}
                        {isLate && <span className="ml-2 text-xs bg-red-100 text-red-700 px-1 rounded">Late</span>}
                      </td>
                      <td className={`py-3 px-4 ${isEarly ? "text-yellow-700 font-semibold" : ""}`}>
                        {d.outTime ? new Date(d.outTime).toLocaleString() : "-"}
                        {isEarly && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1 rounded">Early</span>}
                      </td>
                      <td className="py-3 px-4">{d.hours ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
