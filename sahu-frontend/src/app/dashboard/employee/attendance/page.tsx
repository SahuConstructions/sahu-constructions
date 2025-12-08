"use client";

import { useEffect, useState } from "react";
import { MapPin, Camera, Clock } from "lucide-react";
import api from "@/lib/api";
import { getUserFromToken } from "@/lib/auth";
import { useToast } from "@/context/ToastContext";

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [location, setLocation] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [selfie, setSelfie] = useState<File | null>(null);
  const toast = useToast();
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
      toast.error("Failed to load attendance");
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
      toast.warning("Please take a selfie before punching in/out");
      return;
    }

    const formData = new FormData();
    formData.append("type", type);
    formData.append("timestamp", new Date().toISOString());
    formData.append("location", location);
    formData.append("deviceId", deviceId);
    formData.append("selfie", selfie);

    setLoading(true);

    try {
      const res = await api.post("/attendance/punch", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.ok) {
        toast.success(`${type} punch recorded successfully`);
        fetchAttendance();
        setSelfie(null);
      } else {
        toast.error("Failed to record attendance");
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Try again.");
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
            className={`px-4 py-2 rounded-lg text-white font-medium transition ${loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
              }`}
          >
            {loading ? "Processing..." : `Mark ${type}`}
          </button>
        </div>
      </form>

      {/* Message */}


      {/* Attendance Records */}
      {/* Attendance History */}
      <div className="bg-white border rounded-lg shadow-sm p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">My Attendance History</h3>
        {records.length === 0 ? (
          <p className="text-gray-500 text-sm">No attendance records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700">Date</th>
                  <th className="text-left p-3 font-medium text-gray-700">Punch In</th>
                  <th className="text-left p-3 font-medium text-gray-700">Punch Out</th>
                  <th className="text-left p-3 font-medium text-gray-700">Hours</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-3 align-top">{rec.date}</td>

                    {/* Punch In Column */}
                    <td className="p-3 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-900">
                          {rec.inTime ? new Date(rec.inTime).toLocaleTimeString() : "-"}
                        </span>
                        {rec.inLocation && (
                          <span className="text-xs text-gray-500 max-w-[200px] truncate" title={rec.inLocation}>
                            📍 {rec.inLocation}
                          </span>
                        )}
                        {rec.inSelfie && (
                          <a href={rec.inSelfie} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                            📷 View Selfie
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Punch Out Column */}
                    <td className="p-3 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-900">
                          {rec.outTime ? new Date(rec.outTime).toLocaleTimeString() : "Working..."}
                        </span>
                        {rec.outLocation && rec.outLocation !== '-' && (
                          <span className="text-xs text-gray-500 max-w-[200px] truncate" title={rec.outLocation}>
                            📍 {rec.outLocation}
                          </span>
                        )}
                        {rec.outSelfie && (
                          <a href={rec.outSelfie} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                            📷 View Selfie
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="p-3 align-top font-medium text-gray-700">{rec.hours ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
