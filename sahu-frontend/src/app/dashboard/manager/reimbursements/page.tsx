"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import { Receipt, CheckCircle, XCircle, RefreshCcw } from "lucide-react";

export default function ManagerReimbursementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [resolutionNotes, setResolutionNotes] = useState<{ [key: number]: string }>({});
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      const res = await api.get("/reimbursements");
      const filtered = (res.data || []).filter(
        (r: any) => r.status === "PENDING_MANAGER"
      );
      setReimbursements(filtered);
    } catch {
      setMessage("❌ Failed to fetch reimbursements");
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
      setMessage(`✅ Reimbursement ${status.toLowerCase()}`);
      fetchReimbursements();
    } catch {
      setMessage(`❌ Failed to ${status.toLowerCase()} reimbursement`);
    }
  };

  const fetchHistory = async (id: number) => {
    try {
      setShowHistory(true);
      const res = await api.get(`/reimbursements/${id}/history`);
      setHistory(res.data || []);
    } catch {
      setMessage("❌ Failed to fetch history");
    }
  };

  return (
    <div className="main-content-wrapper flex-1 p-4 sm:p-6 lg:p-4 overflow-y-auto">
  <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-6 h-6 text-blue-600" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            Manager Reimbursement Approvals
          </h1>
        </div>
        <button
          onClick={fetchReimbursements}
          disabled={loading}
          className={`flex items-center justify-center gap-2 bg-gradient-to-b from-slate-900 to-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          <RefreshCcw size={16} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
        {reimbursements.length === 0 ? (
          <p className="text-gray-600 text-sm">No reimbursement requests available.</p>
        ) : (
          <Table
            headers={[
              "Employee",
              "Amount",
              "Description",
              "Status",
              "Notes",
              "Actions",
              "History",
            ]}
            rows={reimbursements.map((r) => [
              <span key="emp" className="font-medium text-gray-800 whitespace-nowrap">
                {r.employee?.name}
              </span>,
              <span key="amt" className="font-semibold text-gray-800 whitespace-nowrap">
                ₹{r.amount}
              </span>,
              <span key="desc" className="text-gray-600 break-words max-w-[200px]">
                {r.description || "-"}
              </span>,
              <StatusBadge key="status" status={r.status} />,
              <input
                key="note"
                type="text"
                placeholder="Add note"
                value={resolutionNotes[r.id] || ""}
                onChange={(e) =>
                  setResolutionNotes({ ...resolutionNotes, [r.id]: e.target.value })
                }
                className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 w-[120px]"
              />,
              r.status === "PENDING_MANAGER" ? (
                <div key="actions" className="flex items-center gap-2 justify-center">
                  <button
                    onClick={() => resolveReimbursement(r.id, "APPROVED")}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition"
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button
                    onClick={() => resolveReimbursement(r.id, "REJECTED")}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition"
                  >
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              ) : (
                <span key="resolved" className="text-gray-500 text-sm italic">
                  Resolved
                </span>
              ),
              <button
                key="view"
                onClick={() => fetchHistory(r.id)}
                className="text-blue-600 underline text-xs font-medium hover:text-blue-800 whitespace-nowrap"
              >
                View
              </button>,
            ])}
          />
        )}
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-4">
        {reimbursements.length === 0 ? (
          <p className="text-gray-600 text-sm text-center">
            No reimbursement requests available.
          </p>
        ) : (
          reimbursements.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border shadow-sm p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">{r.employee?.name}</span>
                <StatusBadge status={r.status} />
              </div>
              <div className="text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-700">Amount:</span> ₹{r.amount}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Description:</span>{" "}
                  {r.description || "-"}
                </p>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Add note"
                  value={resolutionNotes[r.id] || ""}
                  onChange={(e) =>
                    setResolutionNotes({ ...resolutionNotes, [r.id]: e.target.value })
                  }
                  className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                {r.status === "PENDING_MANAGER" ? (
                  <div className="flex gap-2 justify-between">
                    <button
                      onClick={() => resolveReimbursement(r.id, "APPROVED")}
                      className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm w-1/2"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => resolveReimbursement(r.id, "REJECTED")}
                      className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm w-1/2"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm italic text-center">
                    Resolved
                  </span>
                )}
                <button
                  onClick={() => fetchHistory(r.id)}
                  className="text-blue-600 underline text-sm font-medium hover:text-blue-800 text-center"
                >
                  View History
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* History Drawer / Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="bg-white w-full sm:w-auto sm:max-w-3xl sm:rounded-xl sm:shadow-lg 
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
      className={`px-3 py-1 rounded-md text-xs font-semibold text-center block sm:inline ${
        colors[status] || "bg-gray-100 text-gray-700 border"
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
              className={`${
                i % 2 === 0 ? "bg-white" : "bg-gray-50"
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

/* 🪄 Drawer Animation */
const style = document.createElement("style");
style.innerHTML = `
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.animate-slideUp {
  animation: slideUp 0.3s ease-out;
}
`;
document.head.appendChild(style);
