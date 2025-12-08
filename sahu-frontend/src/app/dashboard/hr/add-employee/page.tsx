"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";
import { UserPlus, CheckCircle, AlertTriangle, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface FormData {
  // Step 1: Basic Information
  name: string;
  email: string;
  phone: string;
  dob: string;
  role: string;

  // Step 2: Job Details  
  department: string;
  designation: string;
  location: string;
  managerId: string;
  joinDate: string;
  inTime: string;
  outTime: string;

  // Step 3: Salary Structure
  basicSalary: string;
  hra: string;
  otherAllowance: string;
  pf: string;
  pt: string;

  // Step 4: PF Details
  pfNumber: string;
  uan: string;
}

interface Errors {
  [key: string]: string;
}

export default function AddEmployeePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [newCredentials, setNewCredentials] = useState<any>(null);
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Step Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: "", email: "", phone: "", dob: "", role: "",
    department: "", designation: "", location: "", managerId: "", joinDate: "", inTime: "", outTime: "",
    basicSalary: "", hra: "", otherAllowance: "", pf: "", pt: "",
    pfNumber: "", uan: ""
  });
  const [errors, setErrors] = useState<Errors>({});

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
      toast.error(" Failed to fetch employees list");
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Errors = {};

    switch (step) {
      case 1: // Basic Information
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.email.trim()) {
          newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Invalid email format";
        }
        if (!formData.phone.trim()) {
          newErrors.phone = "Phone is required";
        } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
          newErrors.phone = "Phone must be 10 digits";
        }
        if (!formData.role) newErrors.role = "Role is required";
        break;

      case 2: // Job Details
        // Optional fields - no required validation
        break;

      case 3: // Salary Structure
        if (!formData.basicSalary) {
          newErrors.basicSalary = "Basic salary is required";
        } else if (parseFloat(formData.basicSalary) <= 0) {
          newErrors.basicSalary = "Basic salary must be positive";
        }
        break;

      case 4: // PF Details
        // Optional fields
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const createEmployee = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    const body = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      managerId: parseInt(formData.managerId) || 0,
      basicSalary: parseFloat(formData.basicSalary) || 0,
      hra: parseFloat(formData.hra) || 0,
      otherAllowance: parseFloat(formData.otherAllowance) || 0,
      pf: parseFloat(formData.pf) || 0,
      pt: parseFloat(formData.pt) || 0,
      designation: formData.designation,
      department: formData.department,
      location: formData.location,
      dob: formData.dob || null,
      pfNumber: formData.pfNumber,
      uan: formData.uan,
      joinDate: formData.joinDate || null,
      inTime: formData.inTime || null,
      outTime: formData.outTime || null,
    };

    try {
      const res = await api.post("/employees", body);
      setNewCredentials(res.data.credentials);
      toast.success(" Employee created successfully!");
      // Reset form
      setFormData({
        name: "", email: "", phone: "", dob: "", role: "",
        department: "", designation: "", location: "", managerId: "", joinDate: "", inTime: "", outTime: "",
        basicSalary: "", hra: "", otherAllowance: "", pf: "", pt: "",
        pfNumber: "", uan: ""
      });
      setCurrentStep(1);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      toast.error(" Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: "Basic Info" },
      { num: 2, label: "Job Details" },
      { num: 3, label: "Salary" },
      { num: 4, label: "Review" }
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-all ${currentStep === step.num
                  ? "bg-blue-600 text-white shadow-lg"
                  : currentStep > step.num
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                  }`}
              >
                {step.num}
              </div>
              <span className={`text-xs mt-1 font-medium ${currentStep === step.num ? "text-blue-600" : "text-gray-500"
                }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 mb-5 ${currentStep > step.num ? "bg-green-500" : "bg-gray-300"
                }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderField = (label: string, field: keyof FormData, type: string = "text", required: boolean = false, options?: { value: string; label: string }[]) => {
    const isSelect = type === "select";

    return (
      <div>
        <label className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {isSelect ? (
          <select
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors[field] ? "border-red-500" : ""
              }`}
          >
            <option value="">Select {label}</option>
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors[field] ? "border-red-500" : ""
              }`}
            placeholder={type === "date" ? "dd-mm-yyyy" : ""}
          />
        )}
        {errors[field] && (
          <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField("Full Name", "name", "text", true)}
            {renderField("Email Address", "email", "email", true)}
            {renderField("Phone Number", "phone", "tel", true)}
            {renderField("Date of Birth", "dob", "date")}
            {renderField("Role", "role", "select", true, [
              { value: "USER", label: "Employee" },
              { value: "MANAGER", label: "Manager" },
              // { value: "HR", label: "HR" },
              // { value: "ADMIN", label: "Admin" }
            ])}
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField("Department", "department")}
            {renderField("Designation", "designation")}
            {renderField("Work Location", "location")}
            <div>
              <label className="text-sm font-medium text-gray-700">Reporting Manager</label>
              <select
                value={formData.managerId}
                onChange={(e) => handleInputChange("managerId", e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Select Manager --</option>
                {employees
                  .filter((e) => e.user?.role === "MANAGER")
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
              </select>
            </div>
            {renderField("Date of Joining", "joinDate", "date")}
            {renderField("In Time", "inTime", "time")}
            {renderField("Out Time", "outTime", "time")}
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField("Basic Salary (₹)", "basicSalary", "number", true)}
            {renderField("HRA (₹)", "hra", "number")}
            {renderField("Other Allowance (₹)", "otherAllowance", "number")}
            {renderField("PF (₹)", "pf", "number")}
            {renderField("Professional Tax (₹)", "pt", "number")}

            {/* Salary Summary */}
            <div className="col-span-full bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-gray-800 mb-2">Salary Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-gray-600">Gross Salary:</p>
                <p className="font-semibold">
                  ₹{(parseFloat(formData.basicSalary || "0") + parseFloat(formData.hra || "0") + parseFloat(formData.otherAllowance || "0")).toLocaleString()}
                </p>
                <p className="text-gray-600">Total Deductions:</p>
                <p className="font-semibold text-red-600">
                  -₹{(parseFloat(formData.pf || "0") + parseFloat(formData.pt || "0")).toLocaleString()}
                </p>
                <p className="text-gray-800 font-bold">Net Salary:</p>
                <p className="font-bold text-green-600">
                  ₹{(
                    parseFloat(formData.basicSalary || "0") +
                    parseFloat(formData.hra || "0") +
                    parseFloat(formData.otherAllowance || "0") -
                    parseFloat(formData.pf || "0") -
                    parseFloat(formData.pt || "0")
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField("PF Number", "pfNumber")}
              {renderField("UAN", "uan")}
            </div>

            {/* Review Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Review Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium">{formData.name || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{formData.email || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{formData.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Role</p>
                  <p className="font-medium">{formData.role || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Department</p>
                  <p className="font-medium">{formData.department || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Designation</p>
                  <p className="font-medium">{formData.designation || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Basic Salary</p>
                  <p className="font-medium">₹{parseFloat(formData.basicSalary || "0").toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Net Salary</p>
                  <p className="font-medium text-green-600">
                    ₹{(
                      parseFloat(formData.basicSalary || "0") +
                      parseFloat(formData.hra || "0") +
                      parseFloat(formData.otherAllowance || "0") -
                      parseFloat(formData.pf || "0") -
                      parseFloat(formData.pt || "0")
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-600" />
            Add New Employee
          </h1>
          <p className="text-sm text-gray-500">
            Step {currentStep} of 4: Complete the form to create a new employee record
          </p>
        </div>

        <button
          onClick={fetchEmployees}
          disabled={loading}
          className={`flex items-center gap-2 bg-gradient-to-b from-slate-900 to-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium transition ${loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
        >
          <RefreshCcw size={16} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Step Wizard Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {renderStepIndicator()}

        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition ${currentStep === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Next
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={createEmployee}
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
                } text-white`}
            >
              <CheckCircle size={18} />
              {loading ? "Creating..." : "Create Employee"}
            </button>
          )}
        </div>
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


    </div>
  );
}
