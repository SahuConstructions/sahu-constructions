"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { CalendarDays, Filter } from "lucide-react";
import { getUserFromToken } from "@/lib/auth";
import dayjs from "dayjs";

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<any[]>([]);
  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [balance, setBalance] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  const months = [
    "All",
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

  useEffect(() => {
    const u = getUserFromToken();
    setUser(u);
    if (u) {
      fetchLeaves();
      fetchBalance(u.id || u.userId);
    }
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await api.get("/leaves/me");
      setLeaves(res.data || []);
      setFilteredLeaves(res.data || []);
    } catch {
      setMessage("❌ Failed to fetch leaves");
    }
  };

  const fetchBalance = async (userId: number) => {
    try {
      const res = await api.get(`/leaves/balance/${userId}`);
      setBalance(res.data);
    } catch {
      console.error("Failed to fetch balance");
    }
  };

  const filterLeaves = (month: string, year: string) => {
    let filtered = leaves;
    if (month !== "All") {
      const monthIndex = months.indexOf(month);
      filtered = filtered.filter(
        (l) => new Date(l.startDate).getMonth() + 1 === monthIndex
      );
    }
    if (year !== "All") {
      filtered = filtered.filter(
        (l) => new Date(l.startDate).getFullYear().toString() === year
      );
    }
    setFilteredLeaves(filtered);
  };

  useEffect(() => {
    filterLeaves(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, leaves]);

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate || !reason.trim() || !leaveType) {
      setMessage("⚠️ Please fill all fields");
      return;
    }

    if (balance) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const diffDays =
        Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const type = leaveType.toLowerCase();
      let remaining = 0;

      if (type.includes("annual")) remaining = balance.remaining.annual;
      else if (type.includes("sick")) remaining = balance.remaining.sick;
      else remaining = balance.remaining.other;

      if (remaining < diffDays) {
        setMessage(`❌ Not enough ${leaveType} balance (${remaining} left)`);
        return;
      }
    }

    try {
      await api.post("/leaves", {
        type: leaveType,
        startDate: fromDate,
        endDate: toDate,
        reason,
      });
      setMessage("✅ Leave applied successfully");
      setLeaveType("Annual Leave");
      setFromDate("");
      setToDate("");
      setReason("");
      fetchLeaves();
      if (user) fetchBalance(user.userId);
    } catch {
      setMessage("❌ Failed to apply leave");
    }
  };

  // Extract distinct years dynamically from leaves
  const uniqueYears = Array.from(
    new Set(leaves.map((l) => new Date(l.startDate).getFullYear()))
  ).filter(Boolean);
  const yearOptions = ["All", ...uniqueYears.map((y) => y.toString())];

  return (
    <div className="space-y-6 px-3 sm:px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="text-blue-600 w-6 h-6" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            My Leaves
          </h1>
        </div>
      </div>

      {/* Leave Balance */}
      {balance && (
        <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="font-semibold text-gray-800 mb-3 text-lg">
            Leave Balance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <BalanceCard
              title="Annual Leave"
              total={balance.entitlement.annual}
              used={balance.used.annual}
              remaining={balance.remaining.annual}
              color="from-slate-800 to-blue-900"
            />
            <BalanceCard
              title="Sick Leave"
              total={balance.entitlement.sick}
              used={balance.used.sick}
              remaining={balance.remaining.sick}
              color="from-slate-800 to-blue-900"
            />
            <BalanceCard
              title="Other Leave"
              total={balance.entitlement.other}
              used={balance.used.other}
              remaining={balance.remaining.other}
              color="from-slate-800 to-blue-900"
            />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Status:{" "}
            {balance.confirmed ? (
              <span className="text-green-600 font-medium">
                Confirmed Employee
              </span>
            ) : (
              <span className="text-yellow-600 font-medium">
                Under 6-Month Probation
              </span>
            )}
          </p>
        </div>
      )}

      {/* Leave Application Form */}
      <form
        onSubmit={submitLeave}
        className="bg-white border rounded-lg shadow-sm p-4 sm:p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Apply for Leave
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Leave Type --</option>
            <option>Annual Leave</option>
            <option>Sick Leave</option>
            <option>Other</option>
          </select>

          <input
            type="date"
            value={fromDate}
            min={dayjs().format("YYYY-MM-DD")}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            value={toDate}
            min={dayjs().format("YYYY-MM-DD")}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for leave"
          className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 min-h-[80px]"
        />

        <div className="text-center sm:text-right">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition w-full sm:w-auto"
          >
            Apply Leave
          </button>
        </div>
      </form>

      {/* Message */}
      {message && (
        <p
          className={`text-sm font-medium ${
            message.startsWith("✅")
              ? "text-green-600"
              : message.startsWith("⚠️")
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      {/* Leave History */}
      <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-gray-800 text-lg">
            Leave History
          </h2>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 p-2 rounded-lg shadow-sm text-sm">
            <Filter className="text-blue-600 w-4 h-4" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
            >
              {months.map((m, i) => (
                <option key={i} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
            >
              {yearOptions.map((y, i) => (
                <option key={i} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {(selectedMonth !== "All" || selectedYear !== "All") && (
              <button
                onClick={() => {
                  setSelectedMonth("All");
                  setSelectedYear("All");
                }}
                className="text-blue-600 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-2 px-4 text-left">Type</th>
                <th className="py-2 px-4 text-left">From</th>
                <th className="py-2 px-4 text-left">To</th>
                <th className="py-2 px-4 text-left">Reason</th>
                <th className="py-2 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-4 text-gray-500 text-sm"
                  >
                    No leaves found for selected filter
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l, i) => (
                  <tr
                    key={i}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50/40 transition`}
                  >
                    <td className="py-2 px-4">{l.type}</td>
                    <td className="py-2 px-4">
                      {l.startDate?.substring(0, 10)}
                    </td>
                    <td className="py-2 px-4">{l.endDate?.substring(0, 10)}</td>
                    <td className="py-2 px-4">{l.reason}</td>
                    <td
                      className={`py-2 px-4 font-medium ${
                        l.status === "Approved"
                          ? "text-green-600"
                          : l.status.toLowerCase().includes("reject")
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {l.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-3">
          {filteredLeaves.length === 0 ? (
            <p className="text-center text-gray-500 text-sm">
              No leaves found for selected filter
            </p>
          ) : (
            filteredLeaves.map((l, i) => (
              <div
                key={i}
                className="border rounded-lg p-3 bg-gray-50 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800">{l.type}</h4>
                  <span
                    className={`text-xs font-medium ${
                      l.status === "Approved"
                        ? "text-green-600"
                        : l.status.toLowerCase().includes("reject")
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {l.startDate?.substring(0, 10)} → {l.endDate?.substring(0, 10)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {l.reason || "No reason provided"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* 🎨 Leave Balance Card */
function BalanceCard({
  title,
  total,
  used,
  remaining,
  color,
}: {
  title: string;
  total: number;
  used: number;
  remaining: number;
  color: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${color} text-white rounded-lg p-4 shadow-md hover:shadow-lg transition`}
    >
      <h3 className="text-sm font-semibold opacity-90">{title}</h3>
      <div className="text-xl font-bold mt-1">
        {remaining} / {total}
      </div>
      <div className="text-xs opacity-80 mt-1">Used: {used}</div>
    </div>
  );
}
