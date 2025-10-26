// src/app/dashboard/admin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import dayjs from "dayjs";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import {
  Users,
  FileText,
  CalendarClock,
  PieChart,
  Wallet,
  LogOut,
  Search,
  RefreshCcw,
  GitGraph,
} from "lucide-react";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

export default function Page() {
  return <SuperAdminDashboard />;
}

function SuperAdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [message, setMessage] = useState<string>("");

  // core data
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);

  // reports / charts
  const [leaveReport, setLeaveReport] = useState<any | null>(null);
  const [attendanceReport, setAttendanceReport] = useState<any | null>(null);

  // drilldown modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [selectedEmployeeAttendance, setSelectedEmployeeAttendance] = useState<any[]>([]);
  const [selectedEmployeeTimesheets, setSelectedEmployeeTimesheets] = useState<any[]>([]);
  const [selectedEmployeeReimbursements, setSelectedEmployeeReimbursements] = useState<any[]>([]);

  const [reportMonth, setReportMonth] = useState<number>(dayjs().month() + 1);
  const [reportYear, setReportYear] = useState<number>(dayjs().year());

  useEffect(() => {
    const u = getUserFromToken();
    if (!u || u.role !== "ADMIN") {
      router.push("/");
      return;
    }
    setUser(u);
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setMessage("");
    await Promise.all([
      fetchEmployees(),
      fetchLeaves(),
      fetchTimesheets(),
      fetchReimbursements(),
      fetchPayrolls(),
      fetchReports(),
    ]);
  };

  // ---------- API calls ----------
  const fetchEmployees = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch employees");
    }
  };

  const fetchLeaves = async () => {
    try {
      // fetch all (pending + approved + rejected)
      const [pending, report] = await Promise.all([
        api.get("/leaves/pending"), // main list
        api.get("/leaves/report/summary").catch(() => ({ data: null })),
      ]);
  
      const pendingLeaves = pending.data || [];
      // Merge report data if needed
      setLeaves(pendingLeaves);
      if (report.data) setLeaveReport(report.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch leaves (check /leaves/pending)");
    }
  };
  

  const fetchTimesheets = async () => {
    try {
      const res = await api.get("/timesheets");
      setTimesheets(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch timesheets");
    }
  };

  const fetchReimbursements = async () => {
    try {
      const res = await api.get("/reimbursements");
      setReimbursements(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch reimbursements");
    }
  };

  const fetchPayrolls = async () => {
    try {
      const res = await api.get("/payroll");
      setPayrolls(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch payrolls");
    }
  };

  const fetchReports = async () => {
    try {
      const leavesRes = await api.get("/leaves/report/summary");
      setLeaveReport(leavesRes.data || null);
    } catch (err) {
      console.warn("leave report missing or failed", err);
    }
    try {
      const attRes = await api.get("/attendance/report/summary");
      setAttendanceReport(attRes.data || null);
    } catch (err) {
      console.warn("attendance report missing or failed", err);
    }
  };

  // ---------- utilities ----------
  const logout = () => {
    clearToken();
    router.push("/");
  };

  const openPayslip = (lineItemId: number) => {
    window.open(`/api/v1/payroll/payslip/${lineItemId}/preview`, "_blank");
  };
  const downloadPayslip = (lineItemId: number) => {
    window.open(`/api/v1/payroll/payslip/${lineItemId}/download`, "_blank");
  };

  const exportCSV = (rows: any[], filename = "export.csv") => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r: any) =>
        headers.map((h) => {
          let cell = r[h];
          if (cell === null || cell === undefined) return "";
          if (typeof cell === "string") {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return String(cell);
        }).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------- employee drilldown ----------
  const openEmployeeModal = async (emp: any) => {
    setSelectedEmployee(emp);
    setShowEmployeeModal(true);
    setSelectedEmployeeAttendance([]);
    setSelectedEmployeeTimesheets([]);
    setSelectedEmployeeReimbursements([]);
    try {
      // attendance detail
      const att = await api.get(`/attendance/report/employee-detail/${emp.id}/${reportYear}/${reportMonth}`);
      setSelectedEmployeeAttendance(att.data || []);
    } catch (err) {
      console.warn("attendance detail failed", err);
    }
    try {
      const ts = await api.get(`/timesheets/report/employee/${emp.id}/${reportYear}/${reportMonth}`);
      setSelectedEmployeeTimesheets(ts.data || []);
    } catch {
      // fallback to /timesheets?employeeId=...
      try {
        const tsf = await api.get(`/timesheets?employeeId=${emp.id}`);
        setSelectedEmployeeTimesheets(tsf.data || []);
      } catch (e) {
        console.warn(e);
      }
    }
    try {
      const rr = await api.get(`/reimbursements?employeeId=${emp.id}`);
      setSelectedEmployeeReimbursements(rr.data || []);
    } catch {
      // ignore
    }
  };

  // ---------- small helpers ----------
  const totalReimbursementsPending = reimbursements.filter((r) => r.status === "PENDING").length;
  const totalTimesheetsSubmitted = timesheets.length;
  const totalPayrollRuns = payrolls.length;
  const pendingLeavesCount = leaves.filter((l) => /Pending/i.test(l.status)).length;

  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 flex justify-between items-start gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Super Admin</h1>
          <p className="text-sm text-gray-600">Welcome, <b>{user.email}</b> — role: ADMIN</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-lr text-gray-700 font-medium bg-green-100 px-3 py-1 rounded">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </div>
        <button onClick={() => fetchAll()} className="bg-white-100 px-3 py-2 rounded hover:bg-slate-200"><RefreshCcw className="w-5.5 h-5.5" /></button>
        </div>
        
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <SummaryCard onClick={() => { /* maybe jump to employees */ }} color="from-indigo-500 to-indigo-600" label="Total Employees" value={employees.length} sub="Active users" icon={<Users className="w-5 h-5" />} />
        <SummaryCard color="from-blue-500 to-blue-600" label="Pending Leaves" value={pendingLeavesCount} sub="Awaiting action" icon={<CalendarClock className="w-5 h-5" />} />
        <SummaryCard color="from-emerald-500 to-emerald-600" label="Reimbursements" value={reimbursements.length} sub={`${totalReimbursementsPending} Pending`} icon={<Wallet className="w-5 h-5" />} />
        <SummaryCard color="from-rose-500 to-rose-600" label="Timesheets" value={totalTimesheetsSubmitted} sub="Records" icon={<FileText className="w-5 h-5" />} />
        <SummaryCard color="from-amber-500 to-amber-600" label="Payroll Runs" value={totalPayrollRuns} sub="Runs" icon={<PieChart className="w-5 h-5" />} />
        <SummaryCard color="from-slate-400 to-slate-600" label="Export" value="CSV" sub="Export visible data" icon={<Search className="w-5 h-5" />} onClick={() => exportCSV(employees.map(e => ({ id: e.id, name: e.name, email: e.user?.email || "-", role: e.user?.role || "-" })), "employees.csv")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <SectionCard title="Analytics" icon={<PieChart className="w-5 h-5 text-indigo-600" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-100 h-100">
              <h4 className="text-sm font-medium mb-2">Leave Breakdown</h4>
              {leaveReport ? (
                <Pie
                  data={{
                    labels: (leaveReport.byStatus || []).map((s: any) => s.status),
                    datasets: [
                      {
                        data: (leaveReport.byStatus || []).map((s: any) => s.count),
                        backgroundColor: ["#10b981", "#ef4444", "#f59e0b", "#3b82f6"],
                      },
                    ],
                  }}
                  options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
                />
              ) : (
                <p className="text-sm text-gray-500">Leave report not available</p>
              )}
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Graphical" icon={<GitGraph className="w-5 h-5 text-indigo-600" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="w-100 h-100">
              <h4 className="text-sm font-medium mb-2">Attendance (punches)</h4>
              {attendanceReport ? (
                <Bar
                  data={{
                    labels: (attendanceReport.byEmployee || []).map((e: any) => e.name),
                    datasets: [
                      {
                        label: "Punches",
                        data: (attendanceReport.byEmployee || []).map((e: any) => e.count),
                        backgroundColor: "#3b82f6",
                      },
                    ],
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                />
              ) : (
                <p className="text-sm text-gray-500">Attendance report not available</p>
              )}
            </div>
          </div>
        </SectionCard>


        {/* Reimbursements & Payroll */}
          <SectionCard title="Recent Reimbursements" icon={<Wallet className="w-5 h-5 text-rose-600" />}>
            {reimbursements.length === 0 ? <p className="text-gray-500">No reimbursements</p> : (
              <Table
                headers={["Employee", "Amount", "Status", "Receipt", "Action"]}
                rows={reimbursements.slice(0, 8).map((r) => [
                  r.employee?.name || "-",
                  `₹${r.amount}`,
                  r.status,
                  r.receiptUrl ? <a href={r.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View</a> : "—",
                  r.status === "PENDING" ? (
                    <div className="space-x-2">
                      <button className="bg-green-600 text-white px-2 py-1 rounded" onClick={async () => { try { await api.post(`/reimbursements/${r.id}/resolve`, { status: "APPROVED", notes: "" }); setMessage("✅ Approved"); fetchReimbursements(); } catch { setMessage("❌ Failed"); } }}>Approve</button>
                      <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={async () => { try { await api.post(`/reimbursements/${r.id}/resolve`, { status: "REJECTED", notes: "" }); setMessage("✅ Rejected"); fetchReimbursements(); } catch { setMessage("❌ Failed"); } }}>Reject</button>
                    </div>
                  ) : <span className="text-gray-500">Resolved</span>
                ])}
              />
            )}
          </SectionCard>

          <SectionCard title="Recent Payroll Runs" icon={<PieChart className="w-5 h-5 text-amber-600" />}>
            {payrolls.length === 0 ? <p className="text-gray-500">No payroll runs</p> : (
              <Table
                headers={["Month", "Year", "Status", "Actions"]}
                rows={payrolls.slice(0, 6).map((p) => [
                  p.month,
                  p.year,
                  p.status,
                  <div className="space-x-2">
                    <button onClick={() => { fetchPayrolls(); fetchReports(); }} className="bg-slate-200 px-2 py-1 rounded">Refresh</button>
                    {p.status === "DRAFT" && <button onClick={() => api.post(`/payroll/${p.id}/calculate`).then(() => { setMessage("✅ Calculated"); fetchPayrolls(); }).catch(()=>setMessage("❌ Failed"))} className="bg-yellow-400 px-2 py-1 rounded text-white">Calculate</button>}
                    {p.status === "CALCULATED" && <button onClick={() => api.post(`/payroll/${p.id}/finalize`).then(() => { setMessage("✅ Finalized"); fetchPayrolls(); }).catch(()=>setMessage("❌ Failed"))} className="bg-green-600 px-2 py-1 rounded text-white">Finalize</button>}
                    {p.status === "FINALIZED" && <button onClick={() => api.post(`/payroll/${p.id}/publish`).then(()=>{ setMessage("✅ Published"); fetchPayrolls(); }).catch(()=>setMessage("❌ Failed"))} className="bg-blue-600 px-2 py-1 rounded text-white">Publish</button>}
                  </div>
                ])}
              />
            )}
          </SectionCard>
        
      </div>

      {/* Big tables: Leaves, Workforce, Employees */}
      <SectionCard title="Pending Leaves (All)" icon={<CalendarClock className="w-5 h-5 text-blue-600" />}>
        {leaves.filter(l => /Pending/i.test(l.status)).length === 0 ? <p className="text-gray-500">No pending leaves</p> : (
          <Table
            headers={["ID", "Employee", "Type", "Dates", "Status", "Action"]}
            rows={leaves.filter(l => /Pending/i.test(l.status)).map(l => [
              l.id,
              <button className="text-blue-600 underline" onClick={() => openEmployeeModal(l.employee)}>{l.employee?.name || "-"}</button>,
              l.type,
              `${l.startDate?.substring?.(0,10)} → ${l.endDate?.substring?.(0,10)}`,
              l.status,
              <div className="space-x-2">
                <button onClick={async () => { try { await api.post(`/leaves/${l.id}/action`, { action: "approve", comments: "" }); setMessage("✅ Approved"); fetchLeaves(); } catch { setMessage("❌ Failed"); } }} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                <button onClick={async () => { try { await api.post(`/leaves/${l.id}/action`, { action: "reject", comments: "" }); setMessage("✅ Rejected"); fetchLeaves(); } catch { setMessage("❌ Failed"); } }} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
              </div>
            ])}
          />
        )}
      </SectionCard>

      <SectionCard title="Workforce Summary (Timesheets / Hours)" icon={<FileText className="w-5 h-5 text-indigo-600" />}>
        {(!timesheets || timesheets.length === 0) ? <p className="text-gray-500">No timesheets found</p> : (
          <Table
            headers={["Employee", "Timesheet Count", "Total Hours", "Action"]}
            rows={aggregateTimesheets(timesheets).map(row => [
              <button className="text-blue-600 underline" onClick={() => openEmployeeModal(row.employee)}>{row.employee.name}</button>,
              row.count,
              row.hours,
              <button onClick={() => exportCSV(row.rawRows.map((r: any) => ({ date: r.date, project: r.project, hours: r.hours })), `${row.employee.name}_timesheets.csv`)} className="bg-slate-100 px-2 py-1 rounded">Export</button>
            ])}
          />
        )}
      </SectionCard>

      <SectionCard title="All Employees" icon={<Users className="w-5 h-5 text-gray-700" />}>
        <div className="mb-3 flex items-center gap-2">
          <input placeholder="Search by name or email" className="border p-2 rounded grow" onChange={(e)=>{ const q = e.target.value.toLowerCase(); if(!q) fetchEmployees(); else setEmployees(prev => prev.filter(emp => (emp.name||"").toLowerCase().includes(q) || (emp.user?.email||"").toLowerCase().includes(q))); }} />
          <button onClick={() => exportCSV(employees.map(e => ({id: e.id, name: e.name, email: e.user?.email, role: e.user?.role})), "employees.csv")} className="bg-indigo-600 text-white px-3 py-2 rounded">Export</button>
        </div>
        <Table
          headers={["Name", "Email", "Role", "Phone", "Created At", "Action"]}
          rows={employees.map(emp => [
            <button className="text-blue-600 underline" onClick={() => openEmployeeModal(emp)}>{emp.name}</button>,
            emp.user?.email || "-",
            emp.user?.role || "-",
            emp.phone || "-",
            emp.createdAt?.substring?.(0,10) || "-",
            <div className="space-x-2">
              <button onClick={() => exportCSV([emp], `${emp.name}_profile.csv`)} className="bg-slate-200 px-2 py-1 rounded">Export</button>
            </div>
          ])}
        />
      </SectionCard>

      {/* Employee drilldown modal */}
      {showEmployeeModal && selectedEmployee && (
        <CenteredModal onClose={() => setShowEmployeeModal(false)} title={`Employee — ${selectedEmployee.name || selectedEmployee.user?.email || "Employee"}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Email</div>
                <div className="font-medium">{selectedEmployee.user?.email || "-"}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Role</div>
                <div className="font-medium">{selectedEmployee.user?.role || "-"}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Phone</div>
                <div className="font-medium">{selectedEmployee.phone || "-"}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Attendance</h4>
              <Table
                headers={["Date", "IN", "OUT", "Hours"]}
                rows={selectedEmployeeAttendance.map((d: any) => [d.date, d.inTime ? new Date(d.inTime).toLocaleString() : "-", d.outTime ? new Date(d.outTime).toLocaleString() : "-", d.hours ?? "-"])}
              />
            </div>

            <div>
              <h4 className="font-semibold mb-2">Timesheets</h4>
              <Table
                headers={["Date", "Project", "Task", "Hours", "Status"]}
                rows={selectedEmployeeTimesheets.map((t: any) => [t.date?.substring?.(0,10) || "-", t.project || "-", t.task || "-", t.hours, t.status || "-"])}
              />
            </div>

            <div>
              <h4 className="font-semibold mb-2">Reimbursements</h4>
              <Table
                headers={["Date", "Amount", "Description", "Status"]}
                rows={selectedEmployeeReimbursements.map((r: any) => [r.createdAt?.substring?.(0,10) || "-", `₹${r.amount}`, r.description || "-", r.status || "-"])}
              />
            </div>
          </div>
        </CenteredModal>
      )}

      {message && <div className="text-sm text-green-700">{message}</div>}
    </div>
  );
}

/* ---------- small UI components ---------- */

function SectionCard({ title, icon, children }: any) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-4 border-b pb-2">
        {icon}
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SummaryCard({ label, value, sub, color, icon, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer bg-gradient-to-br ${color} text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1 flex items-start gap-3`}
    >
      <div className="bg-white/20 p-2 rounded-md">{icon}</div>
      <div>
        <div className="text-xs opacity-90">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs opacity-80 mt-1">{sub}</div>
      </div>
    </div>
  );
}

function CenteredModal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-auto p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-gray-50/60 text-gray-700">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="py-3 px-4 text-left font-medium uppercase text-[13px] tracking-wide border-b border-gray-100">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/60"} hover:bg-blue-50/40 transition-all`}>
              {r.map((c, j) => (
                <td key={j} className="py-3 px-4 align-top text-gray-700">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* small aggregation helper for timesheets */
function aggregateTimesheets(timesheets: any[]) {
  const map: Record<string, any> = {};
  timesheets.forEach((t) => {
    const empId = t.employee?.id || t.employeeId || "unknown";
    if (!map[empId]) {
      map[empId] = { employee: t.employee || { id: empId, name: t.employeeName || "Employee" }, count: 0, hours: 0, rawRows: [] };
    }
    map[empId].count += 1;
    map[empId].hours += Number(t.hours || 0);
    map[empId].rawRows.push(t);
  });
  return Object.values(map);
}
