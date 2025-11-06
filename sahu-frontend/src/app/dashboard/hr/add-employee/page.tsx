"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import { UserPlus, CheckCircle, AlertTriangle, RefreshCcw } from "lucide-react";

export default function AddEmployeePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [newCredentials, setNewCredentials] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    try {
      const res = await api.get("/employees");
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch employees list");
    }
  };

  const createEmployee = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const getVal = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement)?.value || "";

    const body = {
      name: getVal("name"),
      email: getVal("email"),
      phone: getVal("phone"),
      role: getVal("role"),
      managerId: parseInt(getVal("managerId") || "0"),
      basicSalary: parseFloat(getVal("basicSalary")) || 0,
      hra: parseFloat(getVal("hra")) || 0,
      otherAllowance: parseFloat(getVal("otherAllowance")) || 0,
      pf: parseFloat(getVal("pf")) || 0,
      pt: parseFloat(getVal("pt")) || 0,
      designation: getVal("designation"),
      department: getVal("department"),
      location: getVal("location"),
      dob: getVal("dob") || null,
      pfNumber: getVal("pfNumber"),
      uan: getVal("uan"),
      joinDate: getVal("joinDate") || null,
      inTime: getVal("inTime") || null,
      outTime: getVal("outTime") || null,
    };

    try {
      const res = await api.post("/employees", body);
      setNewCredentials(res.data.credentials);
      setMessage("✅ Employee created successfully!");
      form.reset();
      fetchEmployees();
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content-wrapper flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="rounded-2xl border bg-white shadow-sm p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-blue-600" />
              Add New Employee
            </h1>
            <p className="text-sm text-gray-500">
              Fill in the details below to create a new employee record and assign salary structure.
            </p>
          </div>

          <button
            onClick={fetchEmployees}
            disabled={loading}
            className={`flex items-center gap-2 bg-gradient-to-b from-slate-900 to-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium transition ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            <RefreshCcw size={16} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Add Employee Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={createEmployee} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Employee Info */}
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                name="name"
                type="text"
                required
                placeholder="John Doe"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input
                name="email"
                type="email"
                required
                placeholder="john@example.com"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                name="phone"
                type="tel"
                placeholder="9876543210"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select
                name="role"
                required
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Role</option>
                <option value="USER">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="HR">HR</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Reporting Manager</label>
              <select
                name="managerId"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- Select Manager --</option>
                {employees
                  .filter((e) => e.user?.role === "MANAGER")
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Salary Details */}
            <div>
              <label className="text-sm font-medium text-gray-700">Basic Salary (₹)</label>
              <input
                name="basicSalary"
                type="number"
                required
                placeholder="e.g. 25000"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">HRA (₹)</label>
              <input
                name="hra"
                type="number"
                placeholder="e.g. 5000"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Other Allowance (₹)</label>
              <input
                name="otherAllowance"
                type="number"
                placeholder="e.g. 2000"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">PF (₹)</label>
              <input
                name="pf"
                type="number"
                placeholder="e.g. 1800"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Professional Tax (₹)</label>
              <input
                name="pt"
                type="number"
                placeholder="e.g. 200"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Other Details */}
            <div>
              <label className="text-sm font-medium text-gray-700">Department</label>
              <input
                name="department"
                type="text"
                placeholder="e.g. Civil"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Designation</label>
              <input
                name="designation"
                type="text"
                placeholder="e.g. Site Engineer"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Work Location</label>
              <input
                name="location"
                type="text"
                placeholder="e.g. Ghansoli"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                name="dob"
                type="date"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">PF Number</label>
              <input
                name="pfNumber"
                type="text"
                placeholder="e.g. MH1234XYZ"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">UAN</label>
              <input
                name="uan"
                type="text"
                placeholder="e.g. 1002938475"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Joining and Shift Timing */}
            <div>
              <label className="text-sm font-medium text-gray-700">Date of Joining</label>
              <input
                name="joinDate"
                type="date"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">In Time</label>
              <input
                name="inTime"
                type="time"
                placeholder="HH:MM"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Out Time</label>
              <input
                name="outTime"
                type="time"
                placeholder="HH:MM"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Submit Button */}
            <div className="col-span-full">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-sm transition"
              >
                {loading ? "Creating..." : "Create Employee"}
              </button>
            </div>
          </form>
        </div>

        {/* New Employee Credentials */}
        {newCredentials && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm p-6 max-w-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Employee Created Successfully
            </h3>

            <div className="space-y-2 text-sm">
              <p><b>Login ID:</b> {newCredentials.email}</p>
              <p><b>Temporary Password:</b> {newCredentials.tempPassword}</p>
            </div>

            <div className="flex items-start gap-2 text-xs text-gray-600 mt-3">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <span>
                Please share these credentials securely with the employee. They will be prompted to update their password after first login.
              </span>
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
