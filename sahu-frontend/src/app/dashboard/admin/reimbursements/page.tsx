"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import { Receipt, CheckCircle, XCircle, RefreshCcw } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import dayjs from "dayjs";

export default function AdminReimbursementsPage() {
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
        if (!u || u.role !== "ADMIN") {
            router.push("/");
            return;
        }
        setUser(u);
        fetchReimbursements();
    }, []);

    useEffect(() => {
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

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const fetchReimbursements = async () => {
        setLoading(true);
        try {
            const res = await api.get("/reimbursements?status=ALL");
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

    const fetchHistory = async (id: number) => {
        try {
            setShowHistory(true);
            setHistory([]);
            const res = await api.get(`/reimbursements/${id}/history`, {
                headers: { "Cache-Control": "no-cache" },
            });
            setHistory(res.data || []);
        } catch {
            toast.error(" Failed to fetch history");
        }
    };

    // Filter pending/actionable items for the main list
    const pendingReimbursements = reimbursements.filter(r => r.status !== 'APPROVED' && r.status !== 'REJECTED');
    // History items are those that have been processed, but Admin can still act on them if needed
    const historyReimbursements = reimbursements.filter(r => r.status === 'APPROVED' || r.status === 'REJECTED');

    return (
        <div className="space-y-6 p-6">
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-2xl border bg-white shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Receipt className="w-6 h-6 text-emerald-600" />
                        <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                            Reimbursement Approvals
                        </h1>
                    </div>
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

                {/* 🕒 Pending Approvals */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        Pending Approvals
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                            {pendingReimbursements.length}
                        </span>
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {pendingReimbursements.length === 0 ? (
                            <div className="p-6 text-gray-600 text-sm">No pending reimbursements.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table
                                    headers={[
                                        "Employee",
                                        "Amount",
                                        "Date",
                                        "Description",
                                        "Receipt",
                                        "Status",
                                        "Notes",
                                        "Actions",
                                        "History"
                                    ]}
                                    rows={pendingReimbursements.map((r) => [
                                        <span key="emp" className="font-medium text-gray-800 whitespace-nowrap">
                                            {r.employee?.name}
                                        </span>,
                                        <span key="amt" className="font-semibold text-gray-800 whitespace-nowrap">
                                            ₹{r.amount}
                                        </span>,
                                        <span key="date" className="text-gray-600 whitespace-nowrap" style={{ minWidth: '85px' }}>
                                            {r.createdAt ? dayjs(r.createdAt).format("DD MMM YYYY") : "-"}
                                        </span>,
                                        <span key="desc" className="text-gray-600 break-words max-w-[200px]">
                                            {r.description || "-"}
                                        </span>,
                                        r.receiptUrl ? (
                                            <a key="receipt" href={r.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs font-medium">📎 View</a>
                                        ) : (
                                            <span key="receipt" className="text-gray-400 text-xs">No file</span>
                                        ),
                                        <StatusBadge key="status" status={getReadableStatus(r.status)} />,
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
                                        </div>,
                                        <button
                                            key="view"
                                            onClick={() => fetchHistory(r.id)}
                                            className="text-blue-600 underline text-xs font-medium hover:text-blue-800 whitespace-nowrap"
                                        >
                                            View
                                        </button>,
                                    ])}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* 📜 Reimbursement History - Admin Override Enabled */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        Reimbursement History
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {historyReimbursements.length === 0 ? (
                            <div className="p-6 text-gray-600 text-sm">No history found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table
                                    headers={[
                                        "Employee",
                                        "Amount",
                                        "Date",
                                        "Description",
                                        "Receipt",
                                        "Status",
                                        "Notes",
                                        "Actions",
                                        "History"
                                    ]}
                                    rows={historyReimbursements.map((r) => [
                                        <span key="emp" className="font-medium text-gray-800 whitespace-nowrap">
                                            {r.employee?.name}
                                        </span>,
                                        <span key="amt" className="font-semibold text-gray-800 whitespace-nowrap">
                                            ₹{r.amount}
                                        </span>,
                                        <span key="date" className="text-gray-600 whitespace-nowrap" style={{ minWidth: '85px' }}>
                                            {r.createdAt ? dayjs(r.createdAt).format("DD MMM YYYY") : "-"}
                                        </span>,
                                        <span key="desc" className="text-gray-600 break-words max-w-[200px]">
                                            {r.description || "-"}
                                        </span>,
                                        r.receiptUrl ? (
                                            <a key="receipt" href={r.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs font-medium">📎 View</a>
                                        ) : (
                                            <span key="receipt" className="text-gray-400 text-xs">No file</span>
                                        ),
                                        <StatusBadge key="status" status={getReadableStatus(r.status)} />,
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
                                        <div key="actions" className="flex items-center gap-2 justify-center opacity-70 hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => resolveReimbursement(r.id, "APPROVED")}
                                                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md text-[10px] font-medium transition"
                                                title="Override: Approve"
                                            >
                                                <CheckCircle size={10} />
                                            </button>
                                            <button
                                                onClick={() => resolveReimbursement(r.id, "REJECTED")}
                                                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md text-[10px] font-medium transition"
                                                title="Override: Reject"
                                            >
                                                <XCircle size={10} />
                                            </button>
                                        </div>,
                                        <button
                                            key="view"
                                            onClick={() => fetchHistory(r.id)}
                                            className="text-blue-600 underline text-xs font-medium hover:text-blue-800 whitespace-nowrap"
                                        >
                                            View Log
                                        </button>,
                                    ])}
                                />
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
                                        dayjs(h.createdAt).format("DD MMM YYYY HH:mm"),
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
        </div>
    );
}

/* 💠 Status Badge */
function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        "Pending Manager Approval": "bg-yellow-100 text-yellow-800 border border-yellow-300",
        "Pending HR Approval": "bg-orange-100 text-orange-800 border border-orange-300",
        "Pending Finance Approval": "bg-blue-100 text-blue-800 border border-blue-300",
        "Approved": "bg-green-100 text-green-800 border border-green-300",
        "Rejected": "bg-red-100 text-red-700 border border-red-300",
    };
    return (
        <span
            className={`px-3 py-1 rounded-md text-xs font-semibold text-center block sm:inline ${colors[status] || "bg-gray-100 text-gray-700 border"}`}
        >
            {status}
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
