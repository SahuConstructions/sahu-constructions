"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import {
  Wallet,
  PlusCircle,
  FileText,
  Edit3,
  Loader2,
  CheckCircle,
  Filter,
} from "lucide-react";

export default function PayrollPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState<any[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const months = [
    "All",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "HR") {
      router.push("/");
      return;
    }    
    setUser(u);
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const res = await api.get("/payroll");
      setPayrolls(res.data);
      setFilteredPayrolls(res.data);
    } catch {
      setMessage("❌ Failed to fetch payrolls");
    }
  };

  // 🔍 Filter payrolls client-side
  const filterPayrolls = (month: string, year: string) => {
    let filtered = payrolls;

    if (month !== "All") {
      const monthIndex = months.indexOf(month);
      filtered = filtered.filter((p) => p.month === monthIndex);
    }
    if (year !== "All") {
      filtered = filtered.filter((p) => p.year.toString() === year);
    }

    setFilteredPayrolls(filtered);
  };

  useEffect(() => {
    filterPayrolls(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, payrolls]);

  const fetchItems = async (id: number) => {
    try {
      const res = await api.get(`/payroll/${id}`);
      setSelectedPayroll(res.data);
      setItems(res.data.items || []);
    } catch {
      setMessage("❌ Failed to fetch payroll items");
    }
  };

  const createPayroll = async () => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    try {
      await api.post("/payroll", { month, year });
      setMessage("✅ Payroll run created");
      fetchPayrolls();
    } catch {
      setMessage("❌ Failed to create payroll run");
    }
  };

  const actionPayroll = async (id: number, action: string) => {
    setLoadingAction(action);
    try {
      await api.post(`/payroll/${id}/${action}`);
      setMessage(`✅ Payroll ${action}d`);
      fetchPayrolls();
      fetchItems(id);
    } catch {
      setMessage(`❌ Failed to ${action} payroll`);
    } finally {
      setTimeout(() => setLoadingAction(null), 1000);
    }
  };

  const previewPayslip = async (id: number) => {
    try {
      const res = await api.get(`/payroll/payslip/${id}/preview`);
      if (res.data?.url) window.open(res.data.url, "_blank");
      else alert("Payslip preview not available.");
    } catch {
      alert("Failed to preview payslip.");
    }
  };

  const downloadPayslip = async (id: number) => {
    try {
      const res = await api.get(`/payroll/payslip/${id}/download`);
      if (res.data?.url) window.open(res.data.url, "_blank");
      else alert("Download link not available.");
    } catch {
      alert("Failed to download payslip.");
    }
  };

  const handleEdit = (item: any) => setEditingItem({ ...item });

  const saveEdit = async () => {
    if (!editingItem) return;
    try {
      const res = await api.patch(
        `/payroll/line-item/${editingItem.id}`,
        editingItem
      );
      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? { ...res.data } : i))
      );
      setMessage("✅ Salary updated successfully");
      setEditingItem(null);
    } catch {
      setMessage("❌ Failed to update salary");
    }
  };

  const getMonthName = (num: number) => months[num] || "-";

  const uniqueYears = Array.from(new Set(payrolls.map((p) => p.year))).filter(
    Boolean
  );
  const yearOptions = ["All", ...uniqueYears.map((y) => y.toString())];

  return (
    <div className="space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Payroll Management
          </h1>
        </div>
        <button
          onClick={createPayroll}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
        >
          <PlusCircle size={16} /> Create Payroll
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm">
        <Filter className="text-blue-600 w-4 h-4" />
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
        >
          {months.map((m, i) => (
            <option key={i} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
        >
          {yearOptions.map((y, i) => (
            <option key={i} value={y}>
              {y}
            </option>
          ))}
        </select>
        {(selectedMonth !== "All" || selectedYear !== "All") && (
          <button
            onClick={() => {
              setSelectedMonth("All");
              setSelectedYear("All");
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      {/* Payroll List */}
      {filteredPayrolls.length === 0 ? (
        <p className="text-gray-600 text-sm">No payrolls available.</p>
      ) : (
        <Table
          headers={["Month", "Year", "Status", "Actions"]}
          rows={filteredPayrolls.map((p) => [
            getMonthName(p.month),
            p.year,
            p.status,
            <div className="flex items-center justify-start gap-2" key={p.id}>
              <button
                onClick={() => fetchItems(p.id)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
              >
                View
              </button>

              {p.status === "DRAFT" && (
                <button
                  onClick={() => actionPayroll(p.id, "calculate")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
                >
                  Calculate
                </button>
              )}

              {p.status === "CALCULATED" && (
                <button
                  onClick={() => actionPayroll(p.id, "finalize")}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
                >
                  Finalize
                </button>
              )}

              {p.status === "FINALIZED" && (
                <button
                  onClick={() => actionPayroll(p.id, "publish")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition"
                >
                  {loadingAction === "publish" ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" /> Publishing...
                    </>
                  ) : (
                    "Publish"
                  )}
                </button>
              )}
            </div>,
          ])}
        />
      )}

      {/* Payroll Details */}
      {selectedPayroll && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Payroll Items — {getMonthName(selectedPayroll.month)}/
            {selectedPayroll.year}
          </h3>

          {items.length === 0 ? (
            <p className="text-gray-600 text-sm">No payroll items found.</p>
          ) : (
            <Table
              headers={[
                "Employee",
                "Basic",
                "HRA",
                "Other",
                "PF",
                "PT",
                "Net Pay",
                "Actions",
              ]}
              rows={items.map((i) => [
                i.employee?.name,
                `₹${i.basic || 0}`,
                `₹${i.hra || 0}`,
                `₹${i.otherAllowance || 0}`,
                `₹${i.pf || 0}`,
                `₹${i.pt || 0}`,
                `₹${i.netPay || 0}`,
                <div className="space-x-2" key={i.id}>
                  {selectedPayroll.status !== "FINALIZED" &&
                    selectedPayroll.status !== "PUBLISHED" && (
                      <button
                        onClick={() => handleEdit(i)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded flex items-center gap-1"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                    )}
                  {i.payslip ? (
                    <>
                      <button
                        onClick={() => previewPayslip(i.id)}
                        className="bg-indigo-600 text-white px-2 py-1 rounded"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => downloadPayslip(i.id)}
                        className="bg-gray-700 text-white px-2 py-1 rounded"
                      >
                        Download
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-500">Not generated</span>
                  )}
                </div>,
              ])}
            />
          )}
        </div>
      )}

      {/* Salary Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] shadow-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Edit Salary for {editingItem.employee?.name}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {["basic", "hra", "otherAllowance", "pf", "pt", "lopDays"].map(
                (field) => (
                  <div key={field}>
                    <label className="text-xs text-gray-500 capitalize">
                      {field}
                    </label>
                    <input
                      type="number"
                      value={editingItem[field] || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          [field]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full border rounded-md px-2 py-1 mt-1 text-sm"
                    />
                  </div>
                )
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-md border"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded-md bg-blue-600 text-white flex items-center gap-2"
              >
                <CheckCircle size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <p className="text-center text-sm font-medium text-green-700">
          {message}
        </p>
      )}
    </div>
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
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="py-3 px-4 text-left font-medium uppercase text-[13px]"
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
              } hover:bg-blue-50 transition align-middle`}
            >
              {r.map((c, j) => (
                <td key={j} className="py-3 px-4 text-gray-700 align-middle">
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
