"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import { Users, Search, RefreshCcw, KeyRound, Copy } from "lucide-react";

/**
 * HR Employee Directory Page
 * Displays all employees with search, filtering, and reset-password modal.
 */
export default function EmployeeDirectoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // For modal
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{ email: string; name: string; password: string } | null>(null);

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "HR") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/employees");
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  // ✅ HR: Reset temporary password for employee
  const resetPassword = async (emp: any) => {
    if (
      !confirm(
        `Are you sure you want to generate a new temporary password for ${emp.name}?`
      )
    )
      return;

    try {
      const res = await api.post(`/employees/${emp.id}/reset-password`);
      const newPass = res.data?.tempPassword;

      if (newPass) {
        setModalData({
          email: res.data.email,
          name: emp.name,
          password: newPass,
        });
        setShowModal(true);
        setMessage(`✅ Temporary password for ${emp.name} regenerated.`);
      } else {
        setMessage("⚠️ Something went wrong. No password returned.");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to reset password.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = searchTerm.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.user?.email?.toLowerCase().includes(q) ||
      emp.user?.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Employee Directory
          </h1>
          <p className="text-sm text-gray-500">
            Manage and view all employees across your organization.
          </p>
        </div>

        <button
          onClick={fetchEmployees}
          disabled={loading}
          className={`flex items-center gap-2 bg-gradient-to-b from-slate-800 to-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          <RefreshCcw size={16} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-between items-center bg-white border border-gray-100 rounded-xl shadow-sm p-4">
        <div className="relative w-full max-w-sm">
          <Search
            className="absolute left-3 top-2.5 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="hidden md:block text-sm text-gray-500 font-medium">
          Total Employees:{" "}
          <span className="text-blue-700 font-semibold">
            {filteredEmployees.length}
          </span>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {filteredEmployees.length === 0 ? (
          <p className="text-gray-600 text-sm">
            {searchTerm
              ? "No employees found matching your search."
              : "No employees available."}
          </p>
        ) : (
          <Table
            headers={[
              "Name",
              "Email",
              "Role",
              "Phone",
              "Created At",
              "Actions",
            ]}
            rows={filteredEmployees.map((emp) => [
              <span className="font-medium text-gray-800">{emp.name}</span>,
              emp.user?.email || "-",
              <span
                className={`px-2 py-1 rounded-md text-xs font-semibold ${
                  emp.user?.role === "ADMIN"
                    ? "bg-purple-100 text-purple-700"
                    : emp.user?.role === "HR"
                    ? "bg-blue-100 text-blue-700"
                    : emp.user?.role === "MANAGER"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {emp.user?.role || "-"}
              </span>,
              emp.phone || "-",
              emp.createdAt?.substring(0, 10) || "-",
              <button
                onClick={() => resetPassword(emp)}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
              >
                <KeyRound size={14} />
                Reset Password
              </button>,
            ])}
          />
        )}
      </div>

      {/* Password Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <KeyRound className="text-indigo-600" />
              Temporary Password Generated
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              A new temporary password has been generated for{" "}
              <span className="font-semibold text-gray-800">{modalData.name}</span>.
              Share this password securely with the employee.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
              <div className="text-sm text-gray-700 flex justify-between items-center">
                <span>Email:</span>
                <span className="font-medium">{modalData.email}</span>
              </div>
              <div className="text-sm text-gray-700 flex justify-between items-center">
                <span>Temporary Password:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-white border border-gray-300 rounded px-2 py-1">
                    {modalData.password}
                  </span>
                  <button
                    onClick={() => copyToClipboard(modalData.password)}
                    className="text-indigo-600 hover:text-indigo-800"
                    title="Copy password"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              ⚠️ Employee will be required to reset this password upon first login.
            </p>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm"
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
  );
}

/* 📊 Reusable Table Component */
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
