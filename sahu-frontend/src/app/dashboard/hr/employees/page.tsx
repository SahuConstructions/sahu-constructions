"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import { Users, Search, RefreshCcw, KeyRound, Copy, Edit, Trash2 } from "lucide-react";

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

  // For edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);

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

  // ✅ HR: Edit employee
  const handleEdit = (emp: any) => {
    setEditEmployee(emp);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployee) return;

    try {
      await api.put(`/employees/${editEmployee.id}`, {
        name: editEmployee.name,
        phone: editEmployee.phone,
        address: editEmployee.address,
        dob: editEmployee.dob,
        designation: editEmployee.designation,
        department: editEmployee.department,
        location: editEmployee.location,
        basicSalary: editEmployee.basicSalary,
        hra: editEmployee.hra,
        otherAllowance: editEmployee.otherAllowance,
        pf: editEmployee.pf,
        pt: editEmployee.pt,
        pfNumber: editEmployee.pfNumber,
        uan: editEmployee.uan,
      });
      setMessage(`✅ Employee ${editEmployee.name} updated successfully.`);
      setShowEditModal(false);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update employee.");
    }
  };

  // ✅ HR: Delete employee
  const handleDelete = async (emp: any) => {
    if (
      !confirm(
        `Are you sure you want to delete ${emp.name}? This action cannot be undone.`
      )
    )
      return;

    try {
      await api.delete(`/employees/${emp.id}`);
      setMessage(`✅ Employee ${emp.name} deleted successfully.`);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to delete employee.");
    }
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(emp)}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
                  title="Edit Employee"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(emp)}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
                  title="Delete Employee"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <button
                  onClick={() => resetPassword(emp)}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition"
                  title="Reset Password"
                >
                  <KeyRound size={14} />
                  Reset
                </button>
              </div>,
            ])}
          />
        )}
      </div>

      {/* Edit Employee Modal */}
      {showEditModal && editEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-xl w-full max-w-3xl shadow-lg border border-gray-200 my-8 relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Edit className="text-blue-600" />
                Edit Employee
              </h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                title="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editEmployee.name || ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={editEmployee.phone || ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editEmployee.dob ? editEmployee.dob.substring(0, 10) : ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, dob: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editEmployee.address || ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, address: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
                  Job Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={editEmployee.designation || ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, designation: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={editEmployee.department || ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, department: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editEmployee.location || ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, location: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Salary Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
                  Salary Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Basic Salary (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editEmployee.basicSalary || ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, basicSalary: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HRA (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editEmployee.hra || ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, hra: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Allowance (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editEmployee.otherAllowance || ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, otherAllowance: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PF (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editEmployee.pf || ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, pf: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PT (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editEmployee.pt || ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, pt: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* PF Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
                  PF Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PF Number
                    </label>
                    <input
                      type="text"
                      value={editEmployee.pfNumber || ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, pfNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UAN Number
                    </label>
                    <input
                      type="text"
                      value={editEmployee.uan || ""}
                      onChange={(e) =>
                        setEditEmployee({ ...editEmployee, uan: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg border border-gray-200 relative">
            <div className="flex items-center justify-between mb-3 pb-3 border-b">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <KeyRound className="text-indigo-600" />
                Temporary Password Generated
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                title="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
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
