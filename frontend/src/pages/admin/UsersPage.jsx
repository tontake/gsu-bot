import { useState, useEffect, useRef } from "react";
import { adminApi } from "../../services/api";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  KeyIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const roleColors = {
  admin: "bg-red-100 text-red-700",
  staff: "bg-purple-100 text-purple-700",
  student: "bg-blue-100 text-blue-700",
};

const PASSWORD_HINT =
  "Min 8 characters with uppercase, lowercase, number & special character.";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Add User modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // CSV Import
  const [showCsv, setShowCsv] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const fileRef = useRef();

  // Security Code modal
  const [showSecCode, setShowSecCode] = useState(false);
  const [secCode, setSecCode] = useState("");
  const [secCodeUser, setSecCodeUser] = useState(null);
  const [secCodeLoading, setSecCodeLoading] = useState(false);
  const [secCodeCopied, setSecCodeCopied] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.users.list({ page, search });
      const data = res.data;
      setUsers(data.data || []);
      setPagination({
        current_page: data.current_page || data.meta?.current_page || 1,
        last_page: data.last_page || data.meta?.last_page || 1,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id, role) => {
    await adminApi.users.update(id, { role });
    load(pagination.current_page);
  };

  const deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await adminApi.users.delete(id);
    load(pagination.current_page);
  };

  // --- Add User ---
  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      await adminApi.users.create(addForm);
      setShowAdd(false);
      setAddForm({ name: "", email: "", password: "", role: "student" });
      load(pagination.current_page);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setAddError(Object.values(data.errors).flat().join(" "));
      } else {
        setAddError(data?.message || "Failed to create user.");
      }
    } finally {
      setAddLoading(false);
    }
  };

  // --- CSV Import ---
  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvLoading(true);
    setCsvResult(null);
    try {
      const res = await adminApi.users.importCsv(csvFile);
      setCsvResult(res.data);
      load(pagination.current_page);
    } catch (err) {
      const data = err.response?.data;
      setCsvResult({
        created_count: 0,
        error_count: 1,
        errors: [data?.message || "Import failed."],
      });
    } finally {
      setCsvLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv =
      "name,email,password,role\nJohn Doe,john@gsu.ac.zw,Str0ng!Pass,student\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Generate Security Code ---
  const handleGenerateCode = async (user) => {
    setSecCodeLoading(true);
    setSecCodeUser(user);
    setSecCode("");
    setSecCodeCopied(false);
    setShowSecCode(true);
    try {
      const res = await adminApi.users.generateSecurityCode(user.id);
      setSecCode(res.data.security_code);
    } catch {
      setSecCode("ERROR");
    } finally {
      setSecCodeLoading(false);
    }
  };

  const handleCopySecCode = async () => {
    try {
      await navigator.clipboard.writeText(secCode);
      setSecCodeCopied(true);
      setTimeout(() => setSecCodeCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = secCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setSecCodeCopied(true);
      setTimeout(() => setSecCodeCopied(false), 2000);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search users..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={() => setShowCsv(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <PlusIcon className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* --------------- Add User Modal --------------- */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowAdd(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Create New User
            </h2>
            {addError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">
                {addError}
              </div>
            )}
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm({ ...addForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={addForm.password}
                  onChange={(e) =>
                    setAddForm({ ...addForm, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">{PASSWORD_HINT}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) =>
                    setAddForm({ ...addForm, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={addLoading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {addLoading ? "Creating..." : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --------------- CSV Import Modal --------------- */}
      {showCsv && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => {
                setShowCsv(false);
                setCsvResult(null);
                setCsvFile(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Import Users from CSV
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              Upload a CSV file with columns:{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">
                name, email, password, role
              </code>
            </p>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline mb-4"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Download CSV template
            </button>

            <div className="flex items-center gap-3 mb-4">
              <input
                type="file"
                accept=".csv"
                ref={fileRef}
                onChange={(e) => setCsvFile(e.target.files[0])}
                className="text-sm"
              />
              <button
                onClick={handleCsvUpload}
                disabled={!csvFile || csvLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
              >
                {csvLoading ? "Importing..." : "Upload"}
              </button>
            </div>

            {csvResult && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-700 font-medium">
                    {csvResult.created_count} created
                  </span>
                  <span className="text-red-600 font-medium">
                    {csvResult.error_count || csvResult.errors?.length || 0}{" "}
                    errors
                  </span>
                </div>
                {csvResult.errors?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {csvResult.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-700 mb-1">
                        {e}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Name
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Email
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Role
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Last Login
              </th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">
                  {u.name}
                </td>
                <td className="px-6 py-3 text-gray-600">{u.email}</td>
                <td className="px-6 py-3">
                  <select
                    value={u.role || ""}
                    onChange={(e) => updateRole(u.id, e.target.value)}
                    className={`px-2 py-0.5 rounded-full text-xs capitalize border-0 cursor-pointer ${roleColors[u.role] || "bg-gray-100"}`}
                  >
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-3 text-gray-500 text-xs">
                  {u.last_login_at
                    ? new Date(u.last_login_at).toLocaleString()
                    : "—"}
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleGenerateCode(u)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      title="Generate new security code"
                    >
                      <KeyIcon className="h-3.5 w-3.5" />
                      New Code
                    </button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: pagination.last_page }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => load(i + 1)}
              className={`px-3 py-1 rounded text-sm ${
                pagination.current_page === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* --------------- Security Code Modal --------------- */}
      {showSecCode && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative text-center">
            <button
              onClick={() => setShowSecCode(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <KeyIcon className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              New Security Code
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Generated for{" "}
              <span className="font-medium text-gray-700">
                {secCodeUser?.name}
              </span>{" "}
              ({secCodeUser?.email})
            </p>

            {secCodeLoading ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 mb-4">
                <p className="text-gray-400">Generating...</p>
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 mb-4">
                <p className="text-3xl font-mono font-bold tracking-[0.3em] text-blue-700">
                  {secCode}
                </p>
              </div>
            )}

            <button
              onClick={handleCopySecCode}
              disabled={secCodeLoading || secCode === "ERROR"}
              className="flex items-center justify-center gap-2 mx-auto mb-4 px-5 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium disabled:opacity-50"
            >
              {secCodeCopied ? (
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

            <p className="text-xs text-gray-500">
              The user will be prompted to save this code on their next login.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
