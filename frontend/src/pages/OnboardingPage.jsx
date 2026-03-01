import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { onboardingApi } from "../services/api";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";
import gsuLogo from "../assets/gsu-logo.png";

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    role: "",
    date_of_birth: "",
    national_id: "",
  });
  const [securityCode, setSecurityCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await onboardingApi.complete(form);
      setSecurityCode(res.data.security_code);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Onboarding failed");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(securityCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const proceed = async () => {
    await refreshUser();
    navigate("/chat");
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <img
            src={gsuLogo}
            alt="GSU Logo"
            className="h-28 w-28 mx-auto mb-4 object-contain"
          />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Save Your Security Code
          </h2>
          <p className="text-gray-500 mb-6">
            This code is required to reset your password if you're locked out.
            <strong className="text-red-600"> Save it somewhere safe!</strong>
          </p>

          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 mb-6">
            <p className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
              {securityCode}
            </p>
          </div>

          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 mb-6"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>

          <button
            onClick={proceed}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            I've saved my code — Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img
            src={gsuLogo}
            alt="GSU Logo"
            className="h-28 w-28 mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-gray-900">
            Complete Your Profile
          </h1>
          <p className="text-gray-500 mt-1">
            Tell us a bit about yourself, {user?.name}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["student", "staff"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ ...form, role })}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-medium capitalize transition ${
                    form.role === role
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) =>
                setForm({ ...form, date_of_birth: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              National ID
            </label>
            <input
              type="text"
              value={form.national_id}
              onChange={(e) =>
                setForm({ ...form, national_id: e.target.value })
              }
              placeholder="e.g. 63-123456A78"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <button
            onClick={handleComplete}
            disabled={
              loading || !form.role || !form.date_of_birth || !form.national_id
            }
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Setting up..." : "Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}
