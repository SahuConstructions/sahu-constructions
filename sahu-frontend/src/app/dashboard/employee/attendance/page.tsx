"use client";

import { useEffect, useState } from "react";
import { MapPin, Camera, Clock } from "lucide-react";
import api from "@/lib/api";
import { getUserFromToken } from "@/lib/auth";

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [location, setLocation] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getUserFromToken();
    setUser(u);
    fetchAttendance();
    generateDeviceId();
    getUserLocation();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await api.get("/attendance/me");
      setRecords(res.data.records || []);
    } catch {
      setMessage("❌ Failed to load attendance");
    }
  };

  const generateDeviceId = () => {
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("deviceId", id);
    }
    setDeviceId(id);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
      
          try {
            // 🌍 Convert coordinates → readable address using OpenStreetMap (free)
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
            const data = await res.json();
            const address = data.display_name || `${lat}, ${lon}`;
            setLocation(address);
          } catch (err) {
            console.error("Error fetching location name:", err);
            setLocation(`${lat}, ${lon}`);
          }
        },
        (error) => console.error("Location error:", error),
      );      
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!selfie) {
      setMessage("⚠️ Please take a selfie before punching in/out");
      return;
    }

    const formData = new FormData();
    formData.append("type", type);
    formData.append("timestamp", new Date().toISOString());
    formData.append("location", location);
    formData.append("deviceId", deviceId);
    formData.append("selfie", selfie);

    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/attendance/punch", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.ok) {
        setMessage(`✅ ${type} punch recorded successfully`);
        fetchAttendance();
        setSelfie(null);
      } else {
        setMessage("❌ Failed to record attendance");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Clock className="text-indigo-600" size={22} />
        <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
      </div>

      {/* Punch Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-lg shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Type */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Punch Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "IN" | "OUT")}
            className="border rounded-lg w-full p-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="IN">Punch In</option>
            <option value="OUT">Punch Out</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Location
          </label>
          <div className="flex items-center border rounded-lg p-2 bg-gray-50">
            <MapPin size={16} className="text-gray-500 mr-2" />
            <span className="text-gray-600 text-sm truncate">
              {location || "Fetching..."}
            </span>
          </div>
        </div>

        {/* Selfie Upload */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Selfie
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded-lg shadow cursor-pointer hover:bg-indigo-700 transition text-sm">
              <Camera size={16} className="mr-1" />
              Upload Selfie
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => setSelfie(e.target.files?.[0] || null)}
              />
            </label>
            {selfie && (
              <img
                src={URL.createObjectURL(selfie)}
                alt="Preview"
                className="w-12 h-12 rounded-full object-cover border"
              />
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-right">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white font-medium transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Processing..." : `Mark ${type}`}
          </button>
        </div>
      </form>

      {/* Message */}
      {message && (
        <p
          className={`text-sm font-medium ${
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

      {/* Attendance Records */}
      <div className="bg-white border rounded-lg shadow-sm p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Recent Punches</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-2 px-4 text-left">Type</th>
                <th className="py-2 px-4 text-left">Time</th>
                <th className="py-2 px-4 text-left">Location</th>
                <th className="py-2 px-4 text-left">Selfie</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-4 text-gray-500 text-sm"
                  >
                    No attendance records yet
                  </td>
                </tr>
              ) : (
                records.map((r, i) => (
                  <tr
                    key={i}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="py-2 px-4 font-medium">{r.type}</td>
                    <td className="py-2 px-4">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-4">{r.location}</td>
                    <td className="py-2 px-4">
                      {r.selfieUrl ? (
                        <a
                          href={r.selfieUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 underline"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
