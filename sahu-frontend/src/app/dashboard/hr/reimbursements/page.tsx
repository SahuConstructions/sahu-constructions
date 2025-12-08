"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import { Receipt, CheckCircle, XCircle, RefreshCcw, Check, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import dayjs from "dayjs";

export default function HRReimbursementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [resolutionNotes, setResolutionNotes] = useState<{ [key: number]: string }>({});
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "HR") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchReimbursements();
  }, []);

  const fetchReimbursements = async () => {
    setLoading(true);
    try {
      // Fetch all to allow client-side splitting
      const res = await api.get(`/reimbursements?status=ALL`);
      setReimbursements(res.data || []);
    } catch {
      toast.error("Failed to fetch reimbursements");
    } finally {
      setLoading(false);
    }
  };

  const resolveReimbursement = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      await api.post(`/reimbursements/${id}/resolve`, {
        status,
        notes: resolutionNotes[id] || "",
      });
      toast.success(`Reimbursement ${status.toLowerCase()}`);
      fetchReimbursements();
    } catch {
      toast.error(`Failed to ${status.toLowerCase()} reimbursement`);
    }
  };

  const fetchHistory = async (id: number) => {
    try {
      setShowHistory(true);
      const res = await api.get(`/reimbursements/${id}/history`);
      setHistory(res.data || []);
    } catch {
      toast.error("Failed to fetch history");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-6 h-6 text-blue-600" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            HR Reimbursement Approvals
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchReimbursements}
            disabled={loading}
            className={`flex items-center justify-center gap-2 bg-gradient-to-b from-slate-900 to-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto ${loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
          >
            <RefreshCcw size={16} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* 🕒 Pending Approvals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          Pending Approvals
          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">
            {reimbursements.filter(r => r.status === "PENDING_HR").length}
          </span>
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {reimbursements.filter(r => r.status === "PENDING_HR").length === 0 ? (
            <div className="p-6 text-gray-600 text-sm">No pending approvals.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 uppercase text-xs font-semibold text-gray-700">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reimbursements
                    .filter(r => r.status === "PENDING_HR")
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-medium text-gray-900">#{r.id}</td>
                        <td className="p-4">{r.employee?.name || "Unknown"}</td>
                        <td className="p-4 font-semibold text-gray-900">₹{r.amount}</td>
                        <td className="p-4">{r.date ? dayjs(r.date).format("DD MMM YYYY") : "-"}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                            {r.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-4 space-y-2">
                          <input
                            type="text"
                            placeholder="Add notes (optional)..."
                            className="w-full text-xs border rounded p-1 mb-1"
                            value={resolutionNotes[r.id] || ""}
                            onChange={(e) =>
                              setResolutionNotes({ ...resolutionNotes, [r.id]: e.target.value })
                            }
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => resolveReimbursement(r.id, "APPROVED")}
                              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700 transition"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => resolveReimbursement(r.id, "REJECTED")}
                              className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-red-700 transition"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 📜 Reimbursement History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          Reimbursement History
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {reimbursements.filter(r => r.status !== "PENDING_HR").length === 0 ? (
            <div className="p-6 text-gray-600 text-sm">No history found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 uppercase text-xs font-semibold text-gray-700">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reimbursements
                    .filter(r => r.status !== "PENDING_HR")
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-medium text-gray-900">#{r.id}</td>
                        <td className="p-4">{r.employee?.name || "Unknown"}</td>
                        <td className="p-4 font-semibold text-gray-900">₹{r.amount}</td>
                        <td className="p-4">{r.date ? dayjs(r.date).format("DD MMM YYYY") : "-"}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${r.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            r.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {r.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => fetchHistory(r.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                          >
                            View Log
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* History Drawer / Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="bg-white w-full sm:w-auto sm:max-w-6xl sm:rounded-xl sm:shadow-lg 
            rounded-t-2xl shadow-2xl max-h-[85vh] overflow-auto 
            p-5 sm:p-6 transform transition-all duration-300 
            animate-slideUp"
          >
            <h3 className="text-lg font-semibold mb-3 text-center">
              Reimbursement History
            </h3>
            {history.length === 0 ? (
              <p className="text-gray-600 text-center">No history found.</p>
            ) : (
              <Table
                headers={["User", "Action", "Notes", "Date"]}
                rows={history.map((h) => [
                  h.user?.email,
                  h.action,
                  h.notes || "-",
                  new Date(h.createdAt).toLocaleString(),
                ])}
              />
            )}
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowHistory(false)}
                className="px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm transition w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* 💠 Status Badge */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING_MANAGER: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    PENDING_HR: "bg-orange-100 text-orange-800 border border-orange-300",
    PENDING_FINANCE: "bg-blue-100 text-blue-800 border border-blue-300",
    APPROVED: "bg-green-100 text-green-800 border border-green-300",
    REJECTED: "bg-red-100 text-red-700 border border-red-300",
  };
  return (
    <span
      className={`px-3 py-1 rounded-md text-xs font-semibold text-center block sm:inline ${colors[status] || "bg-gray-100 text-gray-700 border"
        }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

/* 📊 Reusable Table */
function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
      <table className="min-w-full text-xs sm:text-sm border-collapse">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="py-2 sm:py-3 px-3 sm:px-4 text-left font-medium uppercase text-[12px] sm:text-[13px] tracking-wide border-b border-gray-100 whitespace-nowrap"
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
                } hover:bg-emerald-50/40 transition align-middle`}
            >
              {r.map((c, j) => (
                <td
                  key={j}
                  className="py-2 sm:py-3 px-3 sm:px-4 text-gray-700 align-middle break-words"
                >
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
