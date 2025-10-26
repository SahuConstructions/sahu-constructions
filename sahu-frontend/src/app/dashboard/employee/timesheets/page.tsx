"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  FileText,
  Clock,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import dayjs from "dayjs";

export default function TimesheetsPage() {
  const [myTimesheets, setMyTimesheets] = useState<any[]>([]);
  const [project, setProject] = useState("");
  const [task, setTask] = useState("");
  const [hours, setHours] = useState<string | number>("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoFetched, setAutoFetched] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  // 🧭 Filters
  const [month, setMonth] = useState<number>(dayjs().month() + 1);
  const [year, setYear] = useState<number>(dayjs().year());

  useEffect(() => {
    fetchTimesheets();
  }, [month, year]);

  const fetchTimesheets = async () => {
    try {
      const res = await api.get(`/timesheets/me?month=${month}&year=${year}`);
      setMyTimesheets(res.data || []);
    } catch {
      setMessage("❌ Failed to fetch timesheets");
    }
  };

  useEffect(() => {
    if (date) fetchDailyHours(date);
  }, [date]);

  const fetchDailyHours = async (selectedDate: string) => {
    try {
      const res = await api.get(`/timesheets/daily-hours/${selectedDate}`);
      if (res.data?.hours > 0) {
        setHours(res.data.hours);
        setAutoFetched(true);
        setMessage(`✅ Auto-filled ${res.data.hours} hours from attendance`);
      } else {
        setAutoFetched(false);
        setHours("");
        setMessage("⚠️ No attendance data found for this date");
      }
    } catch {
      setAutoFetched(false);
      setHours("");
      setMessage("⚠️ Could not fetch attendance data");
    }
  };

  const submitTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!project.trim() || !task.trim() || !hours || !date) {
      setMessage("⚠️ Please fill all fields");
      return;
    }

    const parsedHours = parseFloat(hours.toString());
    if (isNaN(parsedHours) || parsedHours <= 0) {
      setMessage("⚠️ Hours must be a positive number");
      return;
    }

    setLoading(true);
    try {
      await api.post("/timesheets", {
        project,
        task,
        hours: parsedHours,
        date,
      });

      setMessage("✅ Timesheet submitted successfully");
      setProject("");
      setTask("");
      setHours("");
      setAutoFetched(false);
      fetchTimesheets();
    } catch {
      setMessage("❌ Failed to submit timesheet");
    } finally {
      setLoading(false);
    }
  };

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - i);

  return (
    <div className="space-y-6 px-3 sm:px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-2">
          <FileText className="text-indigo-600" size={22} />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            My Timesheets
          </h1>
        </div>
        <button
          onClick={fetchTimesheets}
          disabled={loading}
          className={`flex items-center gap-2 bg-gradient-to-b from-slate-900 to-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium transition ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          <RefreshCcw size={16} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 sm:p-4 border rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <Filter size={16} className="text-indigo-600" />
          <span className="font-medium text-sm">Filter by:</span>
        </div>

        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border rounded-lg px-2 py-1 text-sm focus:ring-indigo-500"
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
          className="border rounded-lg px-2 py-1 text-sm focus:ring-indigo-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Timesheet Form */}
      <form
        onSubmit={submitTimesheet}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 sm:p-5 rounded-lg shadow-sm border"
      >
        <input
          type="text"
          placeholder="Project / Site"
          value={project}
          onChange={(e) => setProject(e.target.value)}
          className="border rounded-lg p-2 text-sm focus:ring-indigo-500 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Task Description"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="border rounded-lg p-2 text-sm focus:ring-indigo-500 focus:outline-none"
        />

        <input
          type="date"
          value={date}
          max={dayjs().format("YYYY-MM-DD")}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded-lg p-2 text-sm focus:ring-indigo-500 focus:outline-none"
        />

        <div className="flex items-center border rounded-lg px-2 bg-gray-50">
          <Clock size={16} className="text-gray-500 mr-1" />
          <input
            type="number"
            placeholder="Hours"
            step="0.25"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full border-none outline-none p-2 text-sm bg-transparent"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-4 text-center sm:text-right">
          <button
            type="submit"
            disabled={loading}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>

        {autoFetched && (
          <div className="sm:col-span-2 lg:col-span-4 text-xs text-green-600 font-medium mt-1">
            ⚡ Auto-filled hours from attendance — you can edit if needed.
          </div>
        )}
      </form>

      {/* Timesheet List */}
      <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Submitted Timesheets</h2>

        {/* 📱 Mobile View */}
        <div className="grid grid-cols-1 sm:hidden gap-3">
          {myTimesheets.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">
              No timesheet entries found for this period
            </p>
          ) : (
            myTimesheets.map((t, i) => {
              const isExpanded = expanded === i;
              return (
                <div
                  key={i}
                  className="border rounded-lg bg-gray-50 hover:bg-indigo-50 transition-all p-3"
                >
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : i)}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {dayjs(t.date).format("DD MMM YYYY")}
                      </p>
                      <p className="text-sm text-gray-600 truncate max-w-[200px]">
                        {t.project}
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
                        <span className="font-medium text-gray-800">Task:</span>{" "}
                        {t.task || "—"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-800">Hours:</span>{" "}
                        {t.hours}
                      </p>
                      <p>
                        <span className="font-medium text-gray-800">Status:</span>{" "}
                        <span
                          className={`${
                            t.status === "Approved"
                              ? "text-green-600"
                              : t.status?.includes("Reject")
                              ? "text-red-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {t.status}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 💻 Desktop View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Project</th>
                <th className="py-2 px-4 text-left">Task</th>
                <th className="py-2 px-4 text-left">Hours</th>
                <th className="py-2 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {myTimesheets.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-4 text-gray-500 text-sm"
                  >
                    No timesheet entries found for this period
                  </td>
                </tr>
              ) : (
                myTimesheets.map((t, i) => (
                  <tr
                    key={i}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-indigo-50 transition`}
                  >
                    <td className="py-2 px-4">
                      {dayjs(t.date).format("YYYY-MM-DD")}
                    </td>
                    <td className="py-2 px-4">{t.project}</td>
                    <td className="py-2 px-4">{t.task}</td>
                    <td className="py-2 px-4">{t.hours}</td>
                    <td
                      className={`py-2 px-4 font-medium ${
                        t.status === "Approved"
                          ? "text-green-600"
                          : t.status?.includes("Reject")
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {t.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
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
