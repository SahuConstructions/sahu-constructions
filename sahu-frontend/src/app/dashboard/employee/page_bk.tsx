// src/app/dashboard/employee/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";

// Helper small card
function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border rounded p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default function Page() {
  return <EmployeeDashboard />;
}

function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [message, setMessage] = useState<string>("");

  // refs for sections (needed if you want to programmatically scroll)
  const overviewRef = useRef<HTMLElement | null>(null);
  const leavesRef = useRef<HTMLElement | null>(null);
  const reimburseRef = useRef<HTMLElement | null>(null);
  const attendRef = useRef<HTMLElement | null>(null);
  const timesheetRef = useRef<HTMLElement | null>(null);
  const payslipRef = useRef<HTMLElement | null>(null);

  // data
  const [attendance, setAttendance] = useState<any[]>([]);
  const [myTimesheets, setMyTimesheets] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [myReimbursements, setMyReimbursements] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  // leave form
  const [leaveType, setLeaveType] = useState("Casual");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [leaveErrors, setLeaveErrors] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // attendance punch
  const [punchType, setPunchType] = useState("IN");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [locationName, setLocationName] = useState("");
  const [punchErrors, setPunchErrors] = useState<string | null>(null);

  // timesheet
  const [timesheetErrors, setTimesheetErrors] = useState<string | null>(null);

  // reimbursement
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [reimErrors, setReimErrors] = useState<string | null>(null);

  // history modal
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const u = getUserFromToken();
    if (!u) {
      router.push("/");
      return;
    }
    setUser(u);
    fetchInitial(u.userId);
  }, []);

  const fetchInitial = async (userId: number) => {
    setLoading(true);
    await Promise.all([
      fetchMyAttendance(),
      fetchMyTimesheets(),
      fetchPayslips(userId),
      fetchMyReimbursements(),
      fetchMyLeaves(),
    ]);
    setLoading(false);
  };

  // API calls
  const fetchMyAttendance = async () => {
    try {
      const res = await api.get("/attendance/me");
      const recs = res.data.records ?? res.data;
      setAttendance(recs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyTimesheets = async () => {
    try {
      const res = await api.get("/timesheets/me");
      setMyTimesheets(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayslips = async (userId: number) => {
    try {
      const res = await api.get(`/payroll/mypayslips/${userId}`);
      setPayslips(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyReimbursements = async () => {
    try {
      const res = await api.get("/reimbursements/me");
      setMyReimbursements(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyLeaves = async () => {
    try {
      const res = await api.get("/leaves/me");
      setLeaves(res.data || []);
    } catch (err) {
      console.log("no leaves endpoint or fetch error", err);
    }
  };

  // leave submit
  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveErrors(null);

    if (!fromDate || !toDate) {
      setLeaveErrors("Please choose both From and To dates.");
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      setLeaveErrors("To date must be same or after From date.");
      return;
    }
    if (!reason.trim()) {
      setLeaveErrors("Reason is required.");
      return;
    }

    try {
      await api.post("/leaves", {
        type: leaveType,
        startDate: fromDate,
        endDate: toDate,
        reason,
      });
      setMessage("✅ Leave applied");
      setLeaveType("Casual");
      setFromDate("");
      setToDate("");
      setReason("");
      fetchMyLeaves();
    } catch (err) {
      console.error(err);
      setLeaveErrors("Failed to apply leave.");
    }
  };

  // get location helper
  const getLocation = async () =>
    new Promise<string>((resolve) => {
      if (!navigator.geolocation) return resolve("");
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await resp.json();
            resolve(data.display_name || `${latitude},${longitude}`);
          } catch {
            resolve(`${latitude},${longitude}`);
          }
        },
        () => resolve(""),
        { enableHighAccuracy: true }
      );
    });

  // punch attendance
  const punchAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setPunchErrors(null);
    if (!punchType) {
      setPunchErrors("Select punch type.");
      return;
    }
    try {
      const loc = await getLocation();
      setLocationName(loc);
      const formData = new FormData();
      formData.append("type", punchType);
      formData.append("timestamp", new Date().toISOString());
      formData.append("deviceId", "frontend");
      formData.append("location", loc);
      if (selfie) formData.append("selfie", selfie);

      await api.post("/attendance/punch", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("✅ Punched " + punchType);
      setSelfie(null);
      fetchMyAttendance();
    } catch (err) {
      console.error(err);
      setPunchErrors("Failed to punch attendance.");
    }
  };

  // timesheet submit
  const submitTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimesheetErrors(null);
    const fd = new FormData(e.target as HTMLFormElement);
    const project = (fd.get("project") || "").toString().trim();
    const task = (fd.get("task") || "").toString().trim();
    const hoursStr = (fd.get("hours") || "").toString().trim();
    const date = (fd.get("date") || "").toString().trim();

    if (!project || !task || !hoursStr || !date) {
      setTimesheetErrors("All timesheet fields are required.");
      return;
    }
    const hours = parseFloat(hoursStr);
    if (isNaN(hours) || hours <= 0) {
      setTimesheetErrors("Hours must be a positive number.");
      return;
    }
    if (new Date(date) > new Date()) {
      setTimesheetErrors("Date cannot be in the future.");
      return;
    }

    try {
      await api.post("/timesheets", { project, task, hours, date });
      setMessage("✅ Timesheet submitted");
      (e.target as HTMLFormElement).reset();
      fetchMyTimesheets();
    } catch (err) {
      console.error(err);
      setTimesheetErrors("Failed to submit timesheet.");
    }
  };

  // reimbursement submit
  const submitReimbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    setReimErrors(null);
    if (!amount || Number(amount) <= 0) {
      setReimErrors("Amount must be > 0.");
      return;
    }
    if (!description.trim()) {
      setReimErrors("Description required.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("description", description);
      if (receipt) formData.append("receipt", receipt);
      await api.post("/reimbursements", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setMessage("✅ Reimbursement submitted");
      setAmount("");
      setDescription("");
      setReceipt(null);
      fetchMyReimbursements();
    } catch (err) {
      console.error(err);
      setReimErrors("Failed to submit reimbursement.");
    }
  };

  const fetchHistory = async (id: number) => {
    try {
      setShowHistory(true);
      setHistory([]);
      const res = await api.get(`/reimbursements/${id}/history`, { headers: { "Cache-Control": "no-cache" } });
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch history");
    }
  };

  const logout = () => {
    clearToken();
    router.push("/");
  };

  if (!user) return <div>Loading...</div>;

  const summary = {
    totalAttendance: attendance.length,
    totalTimesheets: myTimesheets.length,
    totalPayslips: payslips.length,
    totalReimbursements: myReimbursements.length,
    totalLeaves: leaves.length,
  };

  return (
    <div className="space-y-6">
      <div className="rounded border bg-white p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Employee Dashboard</h1>
          <div className="text-sm text-gray-600 hidden sm:block">{user.email} — <b>{user.role}</b></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <SummaryCard label="Attendance" value={summary.totalAttendance} />
          <SummaryCard label="Timesheets" value={summary.totalTimesheets} />
          <SummaryCard label="Payslips" value={summary.totalPayslips} />
          <SummaryCard label="Reimbursements" value={summary.totalReimbursements} />
          <SummaryCard label="Leaves" value={summary.totalLeaves} />
        </div>
      </div>

      {/* Leaves */}
      <section id="my-leaves" ref={(r) => {leavesRef.current = r;}}>
        <div className="rounded border bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">Apply Leave</h2>

          <form onSubmit={submitLeave} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="border p-2 rounded">
              <option>Casual</option>
              <option>Sick</option>
              <option>Paid</option>
            </select>

            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border p-2 rounded" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border p-2 rounded" />

            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="col-span-1 md:col-span-3 border p-2 rounded" />

            <div className="col-span-1 md:col-span-3">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Apply</button>
            </div>
          </form>

          {leaveErrors && <p className="text-sm text-red-600 mt-2">{leaveErrors}</p>}

          <div className="mt-6">
            <h3 className="font-semibold mb-2">My Leaves</h3>
            {leaves.length === 0 ? <p className="text-gray-600">No leaves</p> :
              <table className="w-full border text-sm">
                <thead><tr className="bg-gray-50"><th className="border p-2">Type</th><th className="border p-2">From</th><th className="border p-2">To</th><th className="border p-2">Status</th></tr></thead>
                <tbody>
                  {leaves.map((l: any) => (
                    <tr key={l.id}><td className="border p-2">{l.type}</td><td className="border p-2">{l.startDate?.substring?.(0,10)}</td><td className="border p-2">{l.endDate?.substring?.(0,10)}</td><td className="border p-2">{l.status}</td></tr>
                  ))}
                </tbody>
              </table>
            }
          </div>
        </div>
      </section>

      {/* Reimbursements */}
      <section id="my-reimbursements" ref={(r) => {reimburseRef.current = r;}}>
        <div className="rounded border bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">Apply Reimbursement</h2>
          <form onSubmit={submitReimbursement} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="border p-2 rounded" />
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className="border p-2 rounded" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="border p-2 rounded col-span-1 md:col-span-3" />
            <div className="col-span-1 md:col-span-3">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
            </div>
          </form>

          {reimErrors && <p className="text-red-600 mt-2">{reimErrors}</p>}

          <div className="mt-4">
            <h3 className="font-semibold mb-2">My Reimbursements</h3>
            <table className="w-full border text-sm">
              <thead><tr className="bg-gray-50"><th className="border p-2">Amount</th><th className="border p-2">Description</th><th className="border p-2">Status</th><th className="border p-2">Receipt</th><th className="border p-2">History</th></tr></thead>
              <tbody>
                {myReimbursements.map((r: any) => (
                  <tr key={r.id}>
                    <td className="border p-2">₹{r.amount}</td>
                    <td className="border p-2">{r.description}</td>
                    <td className="border p-2">{r.status}</td>
                    <td className="border p-2">{r.receiptUrl ? <a href={`http://localhost:3000${r.receiptUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">View</a> : <span className="text-gray-500">No</span>}</td>
                    <td className="border p-2 text-center"><button onClick={() => fetchHistory(r.id)} className="text-sm text-blue-600 underline">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Attendance */}
      <section id="attendance" ref={(r) => {attendRef.current = r}}>
        <div className="rounded border bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">Punch Attendance</h2>

          <form onSubmit={punchAttendance} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <select value={punchType} onChange={(e) => setPunchType(e.target.value)} className="border p-2 rounded">
              <option>IN</option>
              <option>OUT</option>
            </select>
            <input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] || null)} className="border p-2 rounded" />
            <div><button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Punch</button></div>
          </form>

          {punchErrors && <p className="text-red-600 mt-2">{punchErrors}</p>}
          {locationName && <p className="text-sm mt-2">Last location: {locationName}</p>}

          <div className="mt-4">
            <h3 className="font-semibold mb-2">My Attendance</h3>
            <table className="w-full border text-sm">
              <thead><tr className="bg-gray-50"><th className="border p-2">Date</th><th className="border p-2">Type</th><th className="border p-2">Location</th></tr></thead>
              <tbody>
                {attendance.map((a: any, i: number) => (
                  <tr key={i}><td className="border p-2">{a.timestamp?.substring?.(0,10)}</td><td className="border p-2">{a.type}</td><td className="border p-2">{a.location || "-"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Timesheets */}
      <section id="timesheets" ref={(r) => {timesheetRef.current = r;}}>
        <div className="rounded border bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">Submit Timesheet</h2>
          <form onSubmit={submitTimesheet} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input name="project" placeholder="Project / Site" className="border p-2 rounded" />
            <input name="task" placeholder="Task Description" className="border p-2 rounded" />
            <input name="hours" placeholder="Hours" type="number" step="0.1" className="border p-2 rounded" />
            <input name="date" type="date" className="border p-2 rounded" />
            <div className="md:col-span-4 text-right">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">Submit</button>
            </div>
          </form>

          {timesheetErrors && <p className="text-red-600 mt-2">{timesheetErrors}</p>}

          <div className="mt-4">
            <h3 className="font-semibold mb-2">My Timesheets</h3>
            <table className="w-full border text-sm">
              <thead><tr className="bg-gray-50"><th className="border p-2">Date</th><th className="border p-2">Project</th><th className="border p-2">Task</th><th className="border p-2">Hours</th><th className="border p-2">Status</th></tr></thead>
              <tbody>
                {myTimesheets.map((t: any) => (
                  <tr key={t.id}><td className="border p-2">{t.date?.substring?.(0,10)}</td><td className="border p-2">{t.project}</td><td className="border p-2">{t.task}</td><td className="border p-2">{t.hours}</td><td className="border p-2">{t.status}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Payslips */}
      <section id="payslips" ref={(r) => {payslipRef.current = r;}}>
        <div className="rounded border bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">My Payslips</h2>

          <table className="w-full border text-sm">
            <thead><tr className="bg-gray-50"><th className="border p-2">Month</th><th className="border p-2">Year</th><th className="border p-2">Net Pay</th><th className="border p-2">Payslip</th></tr></thead>
            <tbody>
              {payslips.map((p: any) => (
                <tr key={p.id}>
                  <td className="border p-2">{p.payrollLineItem?.payrollRun?.month}</td>
                  <td className="border p-2">{p.payrollLineItem?.payrollRun?.year}</td>
                  <td className="border p-2">{p.payrollLineItem?.netPay}</td>
                  <td className="border p-2">
                    {p.pdfUrl ? (
                      <div className="flex gap-2">
                        <a href={`http://localhost:3000/api/v1/payroll/payslip/${p.payrollLineItemId}/download`} target="_blank" rel="noreferrer" className="px-2 py-1 bg-gray-800 text-white rounded text-sm">Download</a>
                        <a href={`http://localhost:3000/api/v1/payroll/payslip/${p.payrollLineItemId}/preview`} target="_blank" rel="noreferrer" className="px-2 py-1 bg-indigo-600 text-white rounded text-sm">Preview</a>
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
      </section>

      {/* History modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded w-full max-w-2xl max-h-[80vh] overflow-auto">
            <h3 className="font-semibold mb-3">Reimbursement History</h3>
            {history.length === 0 ? <p className="text-gray-600">No history</p> : (
              <table className="w-full border text-sm">
                <thead><tr className="bg-gray-50"><th className="border p-2">User</th><th className="border p-2">Action</th><th className="border p-2">Notes</th><th className="border p-2">Date</th></tr></thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}><td className="border p-2">{h.user?.email}</td><td className="border p-2">{h.action}</td><td className="border p-2">{h.notes || "-"}</td><td className="border p-2">{new Date(h.createdAt).toLocaleString()}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="mt-4 text-right">
              <button onClick={() => { setShowHistory(false); setHistory([]); }} className="px-4 py-2 bg-gray-700 text-white rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {message && <div className="text-sm text-green-700">{message}</div>}
    </div>
  );
}
