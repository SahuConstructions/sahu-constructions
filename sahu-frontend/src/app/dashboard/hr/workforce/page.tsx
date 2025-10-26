"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import dayjs from "dayjs";
import { Users, CalendarClock } from "lucide-react";

/**
 * HR Workforce Summary Page
 * Shows employee-wise attendance summary (Days Worked & Total Hours)
 * Click on an employee name → opens detail modal for that user
 */
export default function WorkforceSummaryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [employeeSummary, setEmployeeSummary] = useState<any[]>([]);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<any[]>([]);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [message, setMessage] = useState("");

  const [reportMonth, setReportMonth] = useState(dayjs().month() + 1);
  const [reportYear, setReportYear] = useState(dayjs().year());

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "HR") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchEmployeeSummary(reportYear, reportMonth);
  }, []);

  const fetchEmployeeSummary = async (year: number, month: number) => {
    try {
      const res = await api.get(`/timesheets/report/${year}/${month}`);
      setEmployeeSummary(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch workforce summary");
    }
  };

  const loadEmployeeDetail = async (id: number, name: string) => {
    setSelectedEmployeeName(name);
    setShowDetailModal(true);
    setSelectedEmployeeDetail([]);
    try {
      const res = await api.get(
        `/attendance/report/employee-detail/${id}/${reportYear}/${reportMonth}`
      );
      setSelectedEmployeeDetail(res.data || []);
    } catch {
      setMessage("❌ Failed to fetch employee detail");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Workforce Summary
          </h1>
          <p className="text-gray-500 text-sm">
            Month:{" "}
            <span className="font-medium text-blue-600">
              {reportMonth}/{reportYear}
            </span>
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <select
            value={reportMonth}
            onChange={(e) => setReportMonth(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {dayjs().month(i).format("MMMM")}
              </option>
            ))}
          </select>

          <select
            value={reportYear}
            onChange={(e) => setReportYear(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const year = dayjs().year() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>

          <button
            onClick={() => fetchEmployeeSummary(reportYear, reportMonth)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Workforce Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4 border-b pb-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            Employee Attendance Summary
          </h2>
        </div>

        {employeeSummary.length === 0 ? (
          <p className="text-gray-600 text-sm">No data available for this month.</p>
        ) : (
          <Table
            headers={["Employee", "Days Worked", "Total Hours"]}
            rows={employeeSummary.map((emp) => [
              <span
                onClick={() => loadEmployeeDetail(emp.employeeId, emp.name)}
                className="text-blue-600 cursor-pointer font-medium hover:underline"
              >
                {emp.name}
              </span>,
              emp.daysWorked,
              emp.totalHours,
            ])}
          />
        )}
      </div>

      {/* Employee Detail Modal */}
      {showDetailModal && (
        <EmployeeDetailModal
          name={selectedEmployeeName}
          details={selectedEmployeeDetail}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {message && (
        <p className="text-center text-red-600 font-medium mt-4">{message}</p>
      )}
    </div>
  );
}

/* 📊 Table */
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

/* 💬 Employee Detail Modal */
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-4xl max-h-[85vh] overflow-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Attendance Detail — <span className="text-indigo-600">{name}</span>
          </h3>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded-md text-sm transition"
          >
            Close
          </button>
        </div>

        {/* Table */}
        {details.length === 0 ? (
          <p className="text-gray-600 text-sm">No attendance records found.</p>
        ) : (
          <div className="rounded-lg border border-gray-100 shadow-sm">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  {["Date", "IN Time", "OUT Time", "Total Hours"].map((h, i) => (
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
                      } hover:bg-blue-50 transition-all`}
                    >
                      <td className="py-3 px-4 border-b border-gray-100 text-gray-700">
                        {d.date}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-100 text-gray-700">
                        {d.inTime ? new Date(d.inTime).toLocaleString() : "-"}
                        {isLate && (
                          <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 rounded">
                            Late
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-100 text-gray-700">
                        {d.outTime ? new Date(d.outTime).toLocaleString() : "-"}
                        {isEarly && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 rounded">
                            Early
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-100 text-gray-700">
                        {d.hours ?? "-"}
                      </td>
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
