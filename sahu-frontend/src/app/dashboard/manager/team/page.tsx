"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@lib/auth";
import api from "@lib/api";
import { Users, BarChart2, Eye, AlertTriangle, FileDown, RefreshCcw } from "lucide-react";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ManagerTeamPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [attendanceDetails, setAttendanceDetails] = useState<any[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [shiftStartMin, setShiftStartMin] = useState<number | null>(null);
  const [shiftEndMin, setShiftEndMin] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [reportMonth, setReportMonth] = useState(dayjs().month() + 1);
  const [reportYear, setReportYear] = useState(dayjs().year());

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "MANAGER") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchTeamSummary(reportYear, reportMonth);
  }, []);

  const fetchTeamSummary = async (year: number, month: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/timesheets/report/${year}/${month}`);
      setTeam(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const viewEmployeeDetails = async (id: number, name: string) => {
    setSelectedEmployee({ id, name });
    setAttendanceDetails([]);
    setShowDetailModal(true);
    try {
      // Fetch employee to get per-employee in/out time
      const empRes = await api.get(`/employees/${id}`);
      const emp = empRes.data;
      const parseTime = (t?: string | null) => {
        if (!t || typeof t !== 'string') return null;
        const [hh, mm] = t.split(':').map((n: number | string) => parseInt(String(n), 10));
        if (isNaN(hh)) return null;
        return hh * 60 + (isNaN(mm) ? 0 : mm);
      };
      const startMin = parseTime(emp?.inTime) ?? (9 * 60 + 30);
      const endMin = parseTime(emp?.outTime) ?? (17 * 60 + 30);
      setShiftStartMin(startMin);
      setShiftEndMin(endMin);

      const res = await api.get(
        `/attendance/report/employee-detail/${id}/${reportYear}/${reportMonth}`
      );
      setAttendanceDetails(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to load employee details");
    }
  };

  const getAttendanceRate = (daysWorked: number, totalWorkingDays: number) => {
    if (!totalWorkingDays) return "0%";
    const rate = (daysWorked / totalWorkingDays) * 100;
    return `${Math.round(rate)}%`;
  };

  /* ✅ Export Workforce Summary to Excel */
  const exportToExcel = () => {
    if (!team || team.length === 0) {
      alert("No data to export!");
      return;
    }

    const dataForExcel = team.map((emp) => ({
      "Employee Name": emp.name,
      Email: emp.email || "-",
      "Days Worked": emp.daysWorked ?? 0,
      "Leave Days": emp.leaveDays ?? 0,
      "Absent Days": emp.absentDays ?? 0,
      "Total Hours": emp.totalHours?.toFixed(2) ?? "0.00",
      "Attendance %": getAttendanceRate(emp.daysWorked, emp.totalWorkingDays),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Workforce Summary");

    const filename = `Workforce_Summary_${reportYear}_${dayjs()
      .month(reportMonth - 1)
      .format("MMMM")}.xlsx`;

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, filename);
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - i);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Team Workforce Summary
          </h1>
          <p className="text-sm text-gray-500">
            Track attendance, total hours, and leave details for your team.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow transition"
          >
            <FileDown size={16} />
            Export Excel
          </button>
          <button
            onClick={() => fetchTeamSummary(reportYear, reportMonth)}
            disabled={loading}
            className={`flex items-center gap-2 bg-gradient-to-b from-slate-800 to-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            <RefreshCcw size={16} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <select
            value={reportMonth}
            onChange={(e) => setReportMonth(Number(e.target.value))}
            className="border rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {dayjs().month(m - 1).format("MMMM")}
              </option>
            ))}
          </select>

          <select
            value={reportYear}
            onChange={(e) => setReportYear(Number(e.target.value))}
            className="border rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => fetchTeamSummary(reportYear, reportMonth)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition"
        >
          Apply
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        {team.length === 0 ? (
          <p className="text-gray-600 text-sm">No team data available.</p>
        ) : (
          <Table
            headers={[
              "Employee Name",
              "Days Worked",
              "Leave Days",
              "Absent Days",
              "Total Hours",
              "Attendance %",
              "Action",
            ]}
            rows={team.map((emp) => [
              <span className="font-medium text-gray-800">{emp.name}</span>,
              emp.daysWorked ?? "-",
              emp.leaveDays ?? "-",
              emp.absentDays ?? "-",
              emp.totalHours?.toFixed(2) ?? "-",
              <span
                className={`font-semibold ${
                  emp.daysWorked > 20
                    ? "text-green-600"
                    : emp.daysWorked > 15
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {getAttendanceRate(emp.daysWorked, emp.totalWorkingDays)}
              </span>,
              <button
                onClick={() => viewEmployeeDetails(emp.employeeId, emp.name)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-xs font-medium transition"
              >
                View
              </button>,
            ])}
          />
        )}
      </div>

      {showDetailModal && (
        <EmployeeDetailModal
          name={selectedEmployee?.name}
          details={attendanceDetails}
          shiftStartMin={shiftStartMin}
          shiftEndMin={shiftEndMin}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {message && (
        <p
          className={`text-center text-sm font-medium ${
            message.includes("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

/* 💬 Employee Detail Modal */
function EmployeeDetailModal({ name, details, onClose, shiftStartMin, shiftEndMin }: any) {
  const SHIFT_START_MIN = typeof shiftStartMin === 'number' ? shiftStartMin : 9 * 60 + 30;
  const SHIFT_END_MIN = typeof shiftEndMin === 'number' ? shiftEndMin : 17 * 60 + 30;

  const minutesFromTs = (ts: string | Date | null | undefined) => {
    if (!ts) return null;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return null;
    return d.getHours() * 60 + d.getMinutes();
  };

  const toLabel = (m: number) => {
    const hh = Math.floor(m / 60) % 24;
    const mm = m % 60;
    const ampm = hh >= 12 ? "PM" : "AM";
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${hour12}:${mm.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-4xl max-h-[85vh] overflow-auto p-6">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            Attendance Details —{" "}
            <span className="text-indigo-700">{name}</span>
          </h3>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded-md text-sm"
          >
            Close
          </button>
        </div>

        {details.length === 0 ? (
          <p className="text-gray-600 text-sm">No attendance records found.</p>
        ) : (
          <table className="min-w-full text-sm border-collapse border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                {["Date", "IN Time", "OUT Time", "Total Hours"].map((h, i) => (
                  <th
                    key={i}
                    className="py-2.5 px-3 text-left font-medium border-b border-gray-200"
                  >
                    {h}
                  </th>
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
                  <tr
                    key={i}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-indigo-50 transition`}
                  >
                    <td className="py-2.5 px-3 border-b border-gray-200 text-gray-700">
                      {d.date}
                    </td>
                    <td className="py-2.5 px-3 border-b border-gray-200 text-gray-700">
                      {d.inTime ? new Date(d.inTime).toLocaleTimeString() : "-"}
                      {isLate && (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 rounded">
                          Late
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 border-b border-gray-200 text-gray-700">
                      {d.outTime
                        ? new Date(d.outTime).toLocaleTimeString()
                        : "-"}
                      {isEarly && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 rounded">
                          Early
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 border-b border-gray-200 text-gray-700">
                      {d.hours ?? "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="flex items-start gap-2 text-xs text-gray-600 mt-3">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <span>
            ⚠️ “Late” = IN after {toLabel(SHIFT_START_MIN)} · “Early” = OUT before {toLabel(SHIFT_END_MIN)}.
          </span>
        </div>
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
                <td key={j} className="py-3 px-4 align-top text-gray-700">
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
