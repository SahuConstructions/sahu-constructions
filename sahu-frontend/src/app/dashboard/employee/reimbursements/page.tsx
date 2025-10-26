"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  FileImage,
  FileText,
  Receipt,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import dayjs from "dayjs";

export default function ReimbursementsPage() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  // 🔍 Filters
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());

  useEffect(() => {
    fetchReimbursements();
  }, [month, year]);

  const fetchReimbursements = async () => {
    try {
      const res = await api.get(`/reimbursements/me?month=${month}&year=${year}`);
      setReimbursements(res.data || []);
    } catch {
      setMessage("❌ Failed to fetch reimbursements");
    }
  };

  const submitReimbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    if (!amount || Number(amount) <= 0 || !description.trim()) {
      setMessage("⚠️ Please enter valid amount and description");
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("description", description);
      if (receipt) formData.append("receipt", receipt);

      await api.post("/reimbursements", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("✅ Reimbursement submitted successfully (Pending Manager approval)");
      setAmount("");
      setDescription("");
      setReceipt(null);
      fetchReimbursements();
    } catch (err) {
      console.error("Reimbursement error:", err);
      setMessage("❌ Failed to submit reimbursement");
    } finally {
      setSubmitting(false);
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

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - i);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING_MANAGER":
        return "text-yellow-600";
      case "PENDING_HR":
        return "text-orange-600";
      case "PENDING_FINANCE":
        return "text-blue-600";
      case "APPROVED":
        return "text-green-600";
      case "REJECTED":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING_MANAGER":
        return "Pending Manager approval";
      case "PENDING_HR":
        return "Pending HR approval";
      case "PENDING_FINANCE":
        return "Pending Finance approval";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 px-3 sm:px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-2">
          <Receipt className="text-blue-600" size={22} />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            My Reimbursements
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 sm:p-4 border rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <Filter size={16} className="text-blue-600" />
          <span className="font-medium text-sm">Filter by:</span>
        </div>

        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border rounded-lg px-2 py-1 text-sm focus:ring-blue-500"
        >
          {months.map((m, i) => (
            <option key={i + 1} value={i + 1}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded-lg px-2 py-1 text-sm focus:ring-blue-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Reimbursement Form */}
      <form
        onSubmit={submitReimbursement}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-4 sm:p-5 rounded-lg shadow-sm border"
      >
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border rounded-lg p-2 text-sm focus:ring-blue-500 focus:outline-none"
        />
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setReceipt(e.target.files?.[0] || null)}
          className="border rounded-lg p-2 text-sm bg-white"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded-lg p-2 text-sm sm:col-span-2 lg:col-span-3 focus:ring-blue-500 focus:outline-none min-h-[70px]"
        />

        <div className="sm:col-span-2 lg:col-span-3 text-center sm:text-right">
          <button
            type="submit"
            disabled={submitting}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
              submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>

      {/* Reimbursements List */}
      <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-5">
        <h2 className="font-semibold text-gray-800 mb-3">My Reimbursement Claims</h2>

        {/* 📱 Mobile View */}
        <div className="grid grid-cols-1 sm:hidden gap-3">
          {reimbursements.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">
              No reimbursements for this period
            </p>
          ) : (
            reimbursements.map((r, i) => {
              const isExpanded = expanded === i;
              return (
                <div key={i} className="border rounded-lg bg-gray-50 hover:bg-blue-50 transition-all p-3">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : i)}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        ₹{r.amount}
                      </p>
                      <p className="text-xs text-gray-600 truncate max-w-[200px]">
                        {r.description}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="text-gray-500" size={18} />
                    ) : (
                      <ChevronDown className="text-gray-500" size={18} />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 space-y-1 text-sm text-gray-700 transition-all">
                      <p>
                        <span className="font-medium text-gray-800">Status:</span>{" "}
                        <span className={`${getStatusColor(r.status)} font-semibold`}>
                          {getStatusText(r.status)}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium text-gray-800">Receipt:</span>{" "}
                        {r.receiptUrl ? (
                          <a
                            href={r.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            {r.receiptUrl.endsWith(".pdf") ? (
                              <FileText size={14} />
                            ) : (
                              <FileImage size={14} />
                            )}
                            View
                          </a>
                        ) : (
                          "No file"
                        )}
                      </p>
                      <p>
                        <button
                          onClick={() => fetchHistory(r.id)}
                          className="text-blue-600 underline text-xs"
                        >
                          View History
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 💻 Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-2 px-3 text-left">Amount</th>
                <th className="py-2 px-3 text-left">Description</th>
                <th className="py-2 px-3 text-left">Status</th>
                <th className="py-2 px-3 text-left">Receipt</th>
                <th className="py-2 px-3 text-left">History</th>
              </tr>
            </thead>
            <tbody>
              {reimbursements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No reimbursements found
                  </td>
                </tr>
              ) : (
                reimbursements.map((r, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition`}>
                    <td className="py-2 px-3 font-medium">₹{r.amount}</td>
                    <td className="py-2 px-3">{r.description}</td>
                    <td className="py-2 px-3">
  <span
    className={`px-2 py-1 rounded-md text-xs font-medium ${
      r.status === "APPROVED"
        ? "bg-green-100 text-green-800"
        : r.status === "REJECTED"
        ? "bg-red-100 text-red-800"
        : "bg-yellow-100 text-yellow-800"
    }`}
  >
    {getReadableStatus(r.status)}
  </span>
</td>

                    <td className="py-2 px-3">
                      {r.receiptUrl ? (
                        <a
                          href={r.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          {r.receiptUrl.endsWith(".pdf") ? (
                            <FileText size={16} />
                          ) : (
                            <FileImage size={16} />
                          )}
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">No file</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => fetchHistory(r.id)}
                        className="text-blue-600 underline text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 px-3">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto relative">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Reimbursement History
            </h3>

            {history.length === 0 ? (
              <p className="text-gray-600 italic text-center">No history available</p>
            ) : (
              <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2">User</th>
                    <th className="border p-2">Action</th>
                    <th className="border p-2">Notes</th>
                    <th className="border p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, idx) => (
                    <tr key={idx}>
                      <td className="border p-2">{h.user?.email || "—"}</td>
                      <td className="border p-2 font-semibold">{h.action}</td>
                      <td className="border p-2">{h.notes || "—"}</td>
                      <td className="border p-2">
                        {new Date(h.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setShowHistory(false);
                  setHistory([]);
                }}
                className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Toast */}
      {message && (
        <p
          className={`text-sm font-medium text-center sm:text-left ${
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
    </div>
  );
}

function getReadableStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING_MANAGER: "Pending Manager Approval",
    PENDING_HR: "Pending HR Approval",
    PENDING_FINANCE: "Pending Finance Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return map[status] || status;
}
