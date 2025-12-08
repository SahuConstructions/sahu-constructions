"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import { Receipt, CheckCircle, XCircle, RefreshCcw, Check, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import dayjs from "dayjs";

export default function ManagerReimbursementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [resolutionNotes, setResolutionNotes] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "MANAGER") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchReimbursements();
  }, []);

  const fetchReimbursements = async () => {
    setLoading(true);
    try {
      // Fetch all reimbursements to split them on the client side
      const res = await api.get(`/reimbursements?status=ALL`);
      setReimbursements(res.data || []);
    } catch {
      toast.error(" Failed to fetch reimbursements");
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
      toast.success(` Reimbursement ${status.toLowerCase()}`);
      fetchReimbursements();
    } catch {
      toast.error(` Failed to ${status.toLowerCase()} reimbursement`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl border bg-white shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              Manager Reimbursement Approvals
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
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
              {reimbursements.filter(r => r.status === "PENDING_MANAGER").length}
            </span>
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {reimbursements.filter(r => r.status === "PENDING_MANAGER").length === 0 ? (
              <div className="p-6 text-gray-600 text-sm">No pending reimbursements.</div>
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
                      .filter(r => r.status === "PENDING_MANAGER")
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-medium text-gray-900">#{r.id}</td>
                          <td className="p-4">{r.employee?.name || "Unknown"}</td>
                          <td className="p-4 font-semibold text-gray-900">₹{r.amount}</td>
                          <td className="p-4">{r.date ? dayjs(r.date).format("DD MMM YYYY") : "-"}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
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
            {reimbursements.filter(r => r.status !== "PENDING_MANAGER").length === 0 ? (
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reimbursements
                      .filter(r => r.status !== "PENDING_MANAGER")
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
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
