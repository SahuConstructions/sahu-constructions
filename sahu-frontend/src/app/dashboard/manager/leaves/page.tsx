"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import { CalendarClock, Users, CheckCircle, XCircle, RefreshCcw } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import dayjs from "dayjs";

export default function ManagerLeavesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // 🔹 History filters
  const [filterMonth, setFilterMonth] = useState<number>(dayjs().month() + 1);
  const [filterYear, setFilterYear] = useState<number>(dayjs().year());
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "MANAGER") {
      router.push("/");
    } else {
      setUser(u);
      fetchLeaves();
      fetchBalances();
    }
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get("/leaves/history");
      setLeaves(res.data || []);
    } catch {
      toast.error("Failed to fetch leave history");
    } finally {
      setLoading(false);
    }
  };

  const fetchBalances = async () => {
    try {
      const res = await api.get("/leaves/balances/manager");
      setBalances(res.data || []);
    } catch {
      console.error("Failed to fetch team balances");
    }
  };

  const takeAction = async (id: number, action: "approve" | "reject") => {
    try {
      await api.post(`/leaves/${id}/action`, { action, comments: "" });
      toast.success(`Leave ${id} ${action}d successfully`);
      fetchLeaves();
    } catch {
      toast.error(`Failed to ${action} leave ${id}`);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-blue-600" />
            Leave Requests & History
          </h1>
          <p className="text-sm text-gray-500">
            Review and manage team members' leave requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeaves}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-b from-slate-800 to-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition"
          >
            <RefreshCcw size={16} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Team Balances */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" /> Team Leave Balances
        </h2>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">Employee</th>
                <th className="py-3 px-4 text-center">Annual</th>
                <th className="py-3 px-4 text-center">Sick</th>
                <th className="py-3 px-4 text-center">Other</th>
              </tr>
            </thead>
            <tbody>
              {balances.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No team members found.
                  </td>
                </tr>
              ) : (
                balances.map((b, i) => (
                  <tr
                    key={i}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50/40 transition-all`}
                  >
                    <td className="py-3 px-4 font-medium">{b.name}</td>
                    <td className="py-3 px-4 text-center">
                      {b.remaining.annual} / {b.entitlement.annual}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.remaining.sick} / {b.entitlement.sick}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.remaining.other} / {b.entitlement.other}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🕒 Pending Approvals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          Pending Approvals
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
            {leaves.filter(l => l.status === "PendingManager").length}
          </span>
        </h2>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 overflow-x-auto">
          {leaves.filter(l => l.status === "PendingManager").length === 0 ? (
            <p className="text-gray-600 text-sm">No pending leaves found.</p>
          ) : (
            <Table
              headers={["ID", "Employee", "Type", "Dates", "Reason", "Status", "Action"]}
              rows={leaves
                .filter(l => l.status === "PendingManager")
                .map((l) => [
                  l.id,
                  l.employee?.name || "-",
                  l.type,
                  `${l.startDate?.substring(0, 10)} → ${l.endDate?.substring(0, 10)}`,
                  l.reason || "-",
                  <span className="px-2 py-1 text-xs font-semibold rounded-md bg-yellow-100 text-yellow-700">
                    {l.status}
                  </span>,
                  <div className="space-x-2 flex">
                    <button
                      onClick={() => takeAction(l.id, "approve")}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => takeAction(l.id, "reject")}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>,
                ])}
            />
          )}
        </div>
      </div>

      {/* 📜 Past History */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Approval History</h2>

          {/* 🔹 Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="border rounded-md px-2 py-1.5 text-sm bg-white">
              {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{dayjs().month(i).format("MMM")}</option>))}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="border rounded-md px-2 py-1.5 text-sm bg-white">
              {Array.from({ length: 5 }, (_, i) => { const year = dayjs().year() - 2 + i; return <option key={year} value={year}>{year}</option>; })}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded-md px-2 py-1.5 text-sm bg-white">
              <option value="ALL">All Statuses</option>
              <option value="PendingHR">Pending HR</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 overflow-x-auto">
          {(() => {
            const filteredHistory = leaves
              .filter(l => l.status !== "PendingManager")
              .filter(l => { const date = dayjs(l.startDate); return date.month() + 1 === filterMonth && date.year() === filterYear; })
              .filter(l => filterStatus === "ALL" || l.status === filterStatus);

            return filteredHistory.length === 0 ? (
              <p className="text-gray-600 text-sm">No history found for selected filters.</p>
            ) : (
              <Table
                headers={["ID", "Employee", "Type", "Dates", "Reason", "Status"]}
                rows={filteredHistory.map((l) => [
                  l.id,
                  l.employee?.name || "-",
                  l.type,
                  `${l.startDate?.substring(0, 10)} → ${l.endDate?.substring(0, 10)}`,
                  l.reason || "-",
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-semibold ${l.status === "Approved"
                      ? "bg-green-100 text-green-700"
                      : l.status.includes("Reject")
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {l.status}
                  </span>,
                ])}
              />
            );
          })()}
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
                className="py-3 px-4 text-left font-medium uppercase text-[13px] tracking-wide border-b border-gray-100 whitespace-nowrap"
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
              className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/60"} hover:bg-blue-50/40 transition-all`}
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
