import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import {
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import gsuLogo from "../assets/gsu-logo.png";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Security code popup state
  const [showSecurityPopup, setShowSecurityPopup] = useState(false);
  const [securityCode, setSecurityCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      // If security code not acknowledged, show popup
      if (user.security_code_acknowledged === false && user.security_code) {
        setSecurityCode(user.security_code);
        setPendingUser(user);
        setShowSecurityPopup(true);
      } else {
        navigateUser(user);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const navigateUser = (user) => {
    navigate(
      user.onboarding_completed
        ? user.role === "admin"
          ? "/admin"
          : "/chat"
        : "/onboarding",
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(securityCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = securityCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAcknowledge = async () => {
    try {
      await authApi.acknowledgeSecurityCode();
    } catch {
      // Continue even if acknowledge call fails
    }
    setShowSecurityPopup(false);
    navigateUser(pendingUser);
  };

  const googleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/auth/google/redirect`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img
            src={gsuLogo}
            alt="GSU Logo"
            className="h-28 w-28 mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-gray-900">GSU SmartAssist</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-sm text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <button
          onClick={googleLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-2.5 text-gray-700 hover:bg-gray-50 transition font-medium"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="mt-6 text-center">
          <Link
            to="/reset-password"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {/* Security Code Popup */}
      {showSecurityPopup && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <ShieldExclamationIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Save Your Security Code
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              A new security code has been generated for your account. Please
              copy and save it somewhere safe. You will need this code to reset
              your password if you forget it.
            </p>

            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 mb-6">
              <p className="text-3xl font-mono font-bold tracking-[0.3em] text-blue-700">
                {securityCode}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 mx-auto mb-6 px-5 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium"
            >
              {copied ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-green-700">Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="h-5 w-5" />
                  Copy to Clipboard
                </>
              )}
            </button>

            <p className="text-xs text-red-500 mb-4">
              This popup will appear on every login until you acknowledge you
              have saved your code.
            </p>

            <button
              onClick={handleAcknowledge}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              I've saved my security code — Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
