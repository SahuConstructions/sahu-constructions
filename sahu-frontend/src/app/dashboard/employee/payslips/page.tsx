"use client";

import { useEffect, useState } from "react";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import { FileText, Download, Filter } from "lucide-react";

export default function PayslipsPage() {
  const [user, setUser] = useState<any | null>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [filteredPayslips, setFilteredPayslips] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (!u) return;
    setUser(u);
    fetchPayslips(u.userId);
  }, []);

  const fetchPayslips = async (userId: number) => {
    try {
      const res = await api.get(`/payroll/mypayslips/${userId}`);
      setPayslips(res.data || []);
      setFilteredPayslips(res.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch payslips:", err);
      setError("Failed to fetch payslips");
    } finally {
      setLoading(false);
    }
  };

  const filterPayslips = (month: string, year: string) => {
    let filtered = payslips;
    if (month !== "All") {
      const monthIndex = months.indexOf(month); // e.g., March → 3
      filtered = filtered.filter(
        (p) => p.payrollLineItem?.payrollRun?.month === monthIndex
      );
    }
    if (year !== "All") {
      filtered = filtered.filter(
        (p) => p.payrollLineItem?.payrollRun?.year?.toString() === year
      );
    }
    setFilteredPayslips(filtered);
  };

  useEffect(() => {
    filterPayslips(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, payslips]);

  if (loading) return <div className="p-6 text-gray-600">Loading payslips...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // Extract distinct years dynamically from payslips
  const uniqueYears = Array.from(
    new Set(payslips.map((p) => p.payrollLineItem?.payrollRun?.year))
  ).filter(Boolean);
  const yearOptions = ["All", ...uniqueYears.map((y) => y.toString())];

  const getMonthName = (num: number) =>
    months[num] || "-";

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            My Payslips
          </h1>
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
      </div>

      {/* Payslip Table / Cards */}
      {filteredPayslips.length === 0 ? (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg border border-yellow-200 text-sm">
          No payslips found for selected filter
        </div>
      ) : (
        <>
          {/* 🖥 Desktop Table */}
          <div className="hidden sm:block overflow-x-auto border rounded-lg bg-white shadow-sm">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left font-medium">Month</th>
                  <th className="py-3 px-4 text-left font-medium">Year</th>
                  <th className="py-3 px-4 text-left font-medium">Net Pay</th>
                  <th className="py-3 px-4 text-left font-medium">Payslip</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayslips.map((p: any, i) => (
                  <tr
                    key={i}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition`}
                  >
                    <td className="py-3 px-4">
                      {getMonthName(p.payrollLineItem?.payrollRun?.month) || "-"}
                    </td>
                    <td className="py-3 px-4">
                      {p.payrollLineItem?.payrollRun?.year || "-"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      ₹{p.payrollLineItem?.netPay || "0"}
                    </td>
                    <td className="py-3 px-4">
                      {p.pdfUrl ? (
                        <div className="flex gap-2">
                          <a
                            href={p.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
                          >
                            Preview
                          </a>
                          <a
                            href={p.pdfUrl.replace("/upload/", "/upload/fl_attachment/")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-gradient-to-b from-slate-800 to-blue-800 hover:from-slate-900 text-white rounded text-sm flex items-center gap-1"
                          >
                            <Download size={14} /> Download
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-500">Not generated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 📱 Mobile Cards */}
          <div className="sm:hidden space-y-4">
            {filteredPayslips.map((p: any) => (
              <div
                key={p.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">
                    {getMonthName(p.payrollLineItem?.payrollRun?.month)}{" "}
                    {p.payrollLineItem?.payrollRun?.year}
                  </h3>
                  <span className="text-sm font-medium text-gray-500">
                    ₹{p.payrollLineItem?.netPay || "0"}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex flex-col gap-2">
                  {p.pdfUrl ? (
                    <>
                      <a
                        href={p.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
                      >
                        Preview Payslip
                      </a>
                      <a
                        href={p.pdfUrl.replace("/upload/", "/upload/fl_attachment/")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center py-2 rounded-md bg-gradient-to-b from-slate-800 to-blue-800 hover:from-slate-900 text-white text-sm font-medium transition flex justify-center items-center gap-2"
                      >
                        <Download size={14} /> Download
                      </a>
                    </>
                  ) : (
                    <span className="text-gray-500 text-sm text-center mt-2">
                      Not generated yet
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
