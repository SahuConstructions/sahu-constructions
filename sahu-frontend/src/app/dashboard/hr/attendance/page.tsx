"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@lib/auth";
import api from "@lib/api";
import {
  CalendarClock,
  UserCheck,
  UserX,
  AlertTriangle,
  MapPin,
  RefreshCcw,
} from "lucide-react";
import dayjs from "dayjs";

export default function HRAttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "HR") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchManagerAttendance(selectedDate);
  }, []);

  const fetchManagerAttendance = async (date?: string) => {
    setLoading(true);
    try {
      const query = date ? `?date=${date}` : "";
      const res = await api.get(`/attendance/hr-view${query}`);
      const data = res.data?.data || [];
      const s = res.data?.summary || { present: 0, absent: 0, late: 0 };

      setSummary(s);
      setAttendanceList(data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: any) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchManagerAttendance(newDate);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-blue-600" />
            Team Attendance Overview
          </h1>
          <p className="text-sm text-gray-500">
            Selected Date:{" "}
            <span className="font-semibold text-blue-700">
              {dayjs(selectedDate).format("DD MMM YYYY")}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={() => fetchManagerAttendance(selectedDate)}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-b from-slate-800 to-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition"
          >
            <RefreshCcw size={16} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <SummaryCard
          label="Present"
          value={summary.present}
          color="bg-gradient-to-b from-slate-800 to-blue-800"
          icon={<UserCheck className="w-6 h-6 text-white" />}
        />
        <SummaryCard
          label="Absent"
          value={summary.absent}
          color="bg-gradient-to-b from-slate-800 to-blue-800"
          icon={<UserX className="w-6 h-6 text-white" />}
        />
        <SummaryCard
          label="Late"
          value={summary.late}
          color="bg-gradient-to-b from-slate-800 to-blue-800"
          icon={<AlertTriangle className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Attendance Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 overflow-x-auto">
        {attendanceList.length === 0 ? (
          <p className="text-gray-600 text-sm text-center">
            No attendance records for this day.
          </p>
        ) : (
          <Table
            headers={[
              "Employee",
              "Status",
              "Punch In",
              "Punch Out",
              "Total Hours",
              "IN Selfie",
              "OUT Selfie",
              "Location",
            ]}
            rows={attendanceList.map((a) => [
              <span key="name">{a.employeeName}</span>,
              <StatusBadge key="status" status={a.status} />,
              a.inTime ? dayjs(a.inTime).format("hh:mm A") : "-",
              a.outTime ? dayjs(a.outTime).format("hh:mm A") : "-",
              a.hours ? `${a.hours} hrs` : "-",
              a.inSelfie ? (
                <img
                  key="inSelfie"
                  src={a.inSelfie}
                  alt="In Selfie"
                  className="w-10 h-10 rounded-md object-cover border cursor-pointer hover:scale-105 transition"
                  onClick={() => window.open(a.inSelfie, "_blank")}
                />
              ) : (
                "-"
              ),
              a.outSelfie ? (
                <img
                  key="outSelfie"
                  src={a.outSelfie}
                  alt="Out Selfie"
                  className="w-10 h-10 rounded-md object-cover border cursor-pointer hover:scale-105 transition"
                  onClick={() => window.open(a.outSelfie, "_blank")}
                />
              ) : (
                "-"
              ),
              a.location ? (
                <span key="loc" className="flex items-center gap-1 text-gray-700 text-xs whitespace-nowrap">
                  <MapPin size={12} className="text-blue-600" />
                  {a.location.length > 40 ? a.location.slice(0, 40) + "..." : a.location}
                </span>
              ) : (
                "-"
              ),
            ])}
          />

        )}
      </div>
    </div>
  );
}

/* 📊 Summary Card */
function SummaryCard({ label, value, color, icon }: any) {
  return (
    <div
      className={`${color} text-white p-5 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1`}
    >
      <div className="flex justify-between items-center mb-2">
        <div>{icon}</div>
        <div className="text-sm opacity-90 font-medium">{label}</div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

/* 🟢 Status Badge */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Present: "bg-green-100 text-green-700",
    Late: "bg-yellow-100 text-yellow-700",
    Absent: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-md ${colors[status] || "bg-gray-100 text-gray-700"
        }`}
    >
      {status}
    </span>
  );
}

/* 📋 Table */
function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="py-3 px-4 text-left font-medium uppercase text-[13px] tracking-wide border-b border-gray-100"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50/40 transition`}
            >
              {r.map((c, j) => (
                <td key={j} className="py-3 px-4 text-gray-700 align-middle">
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
