"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@lib/auth";
import api from "@lib/api";
import { CalendarClock, UserCheck, UserX, AlertTriangle, RefreshCcw } from "lucide-react";
import dayjs from "dayjs";

export default function ManagerAttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeDetails, setEmployeeDetails] = useState<any[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const reportMonth = dayjs().month() + 1;
  const reportYear = dayjs().year();
  const todayDate = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "MANAGER") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchTodayOverview();
    fetchTodayAttendanceList();
  }, []);

  // ✅ Fetch summary from /report/daily/:year/:month
  const fetchTodayOverview = async () => {
    try {
      const res = await api.get(`/attendance/report/daily/${reportYear}/${reportMonth}`);
      const today = res.data.find((r: any) => r.date === todayDate);
      setAttendanceSummary({
        present: today?.present || 0,
        absent: today?.absent || 0,
        late: today?.late || 0,
      });
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch attendance overview");
    }
  };

  // ✅ Use same endpoint to list today's attendance details
  const fetchTodayAttendanceList = async () => {
    try {
      const res = await api.get(`/attendance/report/daily/${reportYear}/${reportMonth}`);
      const today = res.data.find((r: any) => r.date === todayDate);
      setAttendanceList(today?.records || []); // backend may structure data differently
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch attendance list");
    }
  };

  // ✅ Load full attendance detail for one employee
  const viewEmployeeDetail = async (id: number, name: string) => {
    setSelectedEmployee({ id, name });
    setShowDetailModal(true);
    setEmployeeDetails([]);
    try {
      const res = await api.get(
        `/attendance/report/employee-detail/${id}/${reportYear}/${reportMonth}`
      );
      setEmployeeDetails(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch employee details");
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-blue-600" />
            Attendance Overview
          </h1>
          <p className="text-sm text-gray-500">
            Daily attendance summary for{" "}
            <span className="font-semibold text-blue-700">
              {dayjs().format("DD MMM YYYY")}
            </span>
          </p>
        </div>
        <button
          onClick={() => {
            fetchTodayOverview();
            fetchTodayAttendanceList();
          }}
          className="flex items-center gap-2 bg-gradient-to-b from-slate-800 to-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {attendanceSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <SummaryCard
            color="bg-gradient-to-b from-slate-800 to-blue-800"
            icon={<UserCheck className="w-6 h-6 text-white" />}
            label="Present"
            value={attendanceSummary.present}
            sub="Checked in today"
          />
          <SummaryCard
            color="bg-gradient-to-b from-slate-800 to-blue-800"
            icon={<UserX className="w-6 h-6 text-white" />}
            label="Absent"
            value={attendanceSummary.absent}
            sub="Not present today"
          />
          <SummaryCard
            color="bg-gradient-to-b from-slate-800 to-blue-800"
            icon={<AlertTriangle className="w-6 h-6 text-white" />}
            label="Late"
            value={attendanceSummary.late}
            sub="Arrived late"
          />
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        {attendanceList.length === 0 ? (
          <p className="text-gray-600 text-sm">No attendance records for today.</p>
        ) : (
          <Table
            headers={["Employee", "Status", "Check-in Time", "Action"]}
            rows={attendanceList.map((a: any) => [
              a.employee?.name || "-",
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-md ${
                  a.status === "Present"
                    ? "bg-green-100 text-green-700"
                    : a.status === "Late"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {a.status}
              </span>,
              a.inTime
                ? new Date(a.inTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-",
              <button
                onClick={() =>
                  viewEmployeeDetail(a.employeeId, a.employee?.name)
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-xs font-medium"
              >
                View Detail
              </button>,
            ])}
          />
        )}
      </div>

      {/* Employee Detail Modal */}
      {showDetailModal && (
        <EmployeeDetailModal
          name={selectedEmployee?.name}
          details={employeeDetails}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
}

/* 💠 Summary Card */
function SummaryCard({ label, value, sub, color, icon }: any) {
  return (
    <div
      className={`bg-gradient-to-br ${color} text-white p-5 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1`}
    >
      <div className="flex justify-between items-center mb-2">
        <div>{icon}</div>
        <div className="text-sm opacity-90 font-medium">{label}</div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs opacity-80 mt-1">{sub}</div>
    </div>
  );
}

/* 💬 Employee Detail Modal */
function EmployeeDetailModal({ name, details, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-4xl max-h-[85vh] overflow-auto p-6">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Attendance History —{" "}
            <span className="text-indigo-600">{name}</span>
          </h3>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded-md text-sm"
          >
            Close
          </button>
        </div>
        {details.length === 0 ? (
          <p className="text-gray-600 text-sm">No records available.</p>
        ) : (
          <Table
            headers={["Date", "IN Time", "OUT Time", "Hours"]}
            rows={details.map((d: any) => [
              d.date,
              d.inTime ? new Date(d.inTime).toLocaleTimeString() : "-",
              d.outTime ? new Date(d.outTime).toLocaleTimeString() : "-",
              d.hours ?? "-",
            ])}
          />
        )}
      </div>
    </div>
  );
}

/* 📊 Table Component */
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
        <thead className="bg-gray-50/60 text-gray-700">
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
              className={`${
                i % 2 === 0 ? "bg-white" : "bg-gray-50/60"
              } hover:bg-blue-50/40 transition-all`}
            >
              {r.map((c, j) => (
                <td key={j} className="py-3 px-4 text-gray-700">
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
