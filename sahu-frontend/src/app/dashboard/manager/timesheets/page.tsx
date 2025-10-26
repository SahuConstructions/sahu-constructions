"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  RefreshCcw,
} from "lucide-react";
import dayjs from "dayjs";

export default function ManagerTimesheetsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "MANAGER") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const res = await api.get("/timesheets");
      // Filter only PendingManager for manager view
      const filtered = res.data.filter((t: any) => t.status === "PendingManager");
      setTimesheets(filtered);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch timesheets");
    } finally {
      setLoading(false);
    }
  };

  const takeAction = async (id: number, action: "approve" | "reject") => {
    try {
      await api.post(`/timesheets/${id}/action`, { action });
      setMessage(`✅ Timesheet ${id} ${action}d successfully`);
      fetchTimesheets();
    } catch (err) {
      console.error(err);
      setMessage(`❌ Failed to ${action} timesheet ${id}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Timesheet Approvals</h1>
            <p className="text-sm text-gray-500">
              Review and approve/reject timesheets submitted by your team.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTimesheets}
            className="flex items-center gap-2 bg-gradient-to-b from-slate-800 to-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
        </div>
      </div>

      {/* Summary Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Pending Reviews"
          value={timesheets.length}
          sub="Awaiting Manager Action"
          color="bg-gradient-to-b from-slate-800 to-blue-800"
        />
        <SummaryCard
          label="Team"
          value="Your Employees"
          sub="Assigned Team Timesheets"
          color="bg-gradient-to-b from-slate-800 to-blue-800"
        />
        <SummaryCard
          label="Month"
          value={`${dayjs().month() + 1}/${dayjs().year()}`}
          sub="Current Cycle"
          color="bg-gradient-to-b from-slate-800 to-blue-800"
        />
        <SummaryCard
          label="Last Updated"
          value={dayjs().format("HH:mm")}
          sub="Server Sync Time"
          color="bg-gradient-to-b from-slate-800 to-blue-800"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <p className="text-gray-500">Loading timesheets...</p>
        ) : timesheets.length === 0 ? (
          <p className="text-gray-600 text-sm">No pending timesheets found.</p>
        ) : (
          <Table
            headers={[
              "ID",
              "Employee",
              "Project",
              "Task",
              "Date",
              "Hours",
              "Status",
              "Action",
            ]}
            rows={timesheets.map((t) => [
              t.id,
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600" />
                {t.employee?.name || "-"}
              </div>,
              t.project,
              t.task,
              dayjs(t.date).format("DD MMM YYYY"),
              t.hours,
              <StatusBadge status={t.status} />,
              <div className="flex gap-2">
                <button
                  onClick={() => takeAction(t.id, "approve")}
                  className="flex items-center gap-1 bg-green-800 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  onClick={() => takeAction(t.id, "reject")}
                  className="flex items-center gap-1 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>,
            ])}
          />
        )}
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

/* 💠 Status Badge */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PendingManager: "bg-yellow-100 text-yellow-800",
    PendingHR: "bg-blue-100 text-blue-700",
    Approved: "bg-green-100 text-green-700",
    RejectedByManager: "bg-red-100 text-red-700",
    RejectedByHR: "bg-red-100 text-red-700",
    Overridden: "bg-purple-100 text-purple-700",
  };
  const text = status.replace(/([A-Z])/g, " $1");
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {text.trim()}
    </span>
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

/* 📈 Summary Card */
function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${color} text-white p-5 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1`}
    >
      <div className="text-sm opacity-90">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs opacity-80 mt-1">{sub}</div>
    </div>
  );
}
