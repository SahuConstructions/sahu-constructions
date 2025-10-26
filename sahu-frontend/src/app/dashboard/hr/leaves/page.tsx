"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import { CalendarClock, Building2, CheckCircle, XCircle, RefreshCcw } from "lucide-react";

export default function HRLeavesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "HR") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchLeaves();
    fetchBalances();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await api.get("/leaves/pending");
      setLeaves(res.data || []);
    } catch {
      setMessage("❌ Failed to fetch pending leaves");
    }
  };

  const fetchBalances = async () => {
    try {
      const res = await api.get("/leaves/balances/hr");
      setBalances(res.data || []);
    } catch (err) {
      console.error("Failed to fetch HR balances", err);
    }
  };

  const takeAction = async (id: number, action: "approve" | "reject") => {
    try {
      await api.post(`/leaves/${id}/action`, { action, comments: "" });
      setMessage(`✅ Leave ${id} ${action}d successfully`);
      fetchLeaves();
      fetchBalances();
    } catch {
      setMessage(`❌ Failed to ${action} leave ${id}`);
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-blue-600" />
            Pending Leave Requests
          </h1>
          <p className="text-sm text-gray-500">
            Approve or reject pending leave applications from employees.
          </p>
        </div>
        <button
          onClick={() => {
            fetchLeaves();
            fetchBalances();
          }}
          className="flex items-center gap-2 bg-gradient-to-b from-slate-800 to-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {/* 🕒 Pending Leave Approvals */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {leaves.length === 0 ? (
          <p className="text-gray-600 text-sm">No pending leaves found.</p>
        ) : (
          <Table
            headers={[
              "ID",
              "Employee",
              "Type",
              "Dates",
              "Reason",
              "Status",
              "Action",
            ]}
            rows={leaves.map((l) => [
              l.id,
              l.employee?.name,
              l.type,
              `${l.startDate?.substring(0, 10)} → ${l.endDate?.substring(0, 10)}`,
              l.reason || "-",
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-semibold">
                {l.status}
              </span>,
              <div className="flex gap-2">
                <button
                  onClick={() => takeAction(l.id, "approve")}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
                >
                  <CheckCircle size={14} />
                  Approve
                </button>
                <button
                  onClick={() => takeAction(l.id, "reject")}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>,
            ])}
          />
        )}
      </div>

      {/* 🏢 Org Leave Balances */}
      <div className="bg-white p-6 border border-gray-100 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
          <Building2 className="w-5 h-5 text-blue-600" />
          Organization Leave Balances
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-50/60 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">Employee</th>
                <th className="py-3 px-4 text-center">Annual</th>
                <th className="py-3 px-4 text-center">Sick</th>
                <th className="py-3 px-4 text-center">Other</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {balances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No data available
                  </td>
                </tr>
              ) : (
                balances.map((b, i) => (
                  <tr
                    key={i}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50/40 transition-all`}
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
                    <td
                      className={`py-3 px-4 text-center text-xs font-semibold ${
                        b.confirmed ? "text-green-600" : "text-yellow-600"
                      }`}
                    >
                      {b.confirmed ? "Confirmed" : "Probation"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
