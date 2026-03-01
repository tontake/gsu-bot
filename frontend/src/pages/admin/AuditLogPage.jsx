import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import {
  FunnelIcon,
  GlobeAltIcon,
  LanguageIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
  });
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    load();
  }, []);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page };
      if (filter) params.action = filter;
      if (levelFilter) params.level = levelFilter;
      const res = await adminApi.auditLog.list(params);
      const data = res.data;
      setLogs(data.data || []);
      setPagination({
        current_page: data.meta?.current_page || data.current_page || 1,
        last_page: data.meta?.last_page || data.last_page || 1,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const actionColors = {
    translation: "bg-purple-100 text-purple-700",
    function_call: "bg-blue-100 text-blue-700",
    auto_ticket_created: "bg-amber-100 text-amber-700",
    login: "bg-green-100 text-green-700",
    password_reset: "bg-orange-100 text-orange-700",
    "log.Error": "bg-red-100 text-red-700",
    "log.Warning": "bg-yellow-100 text-yellow-700",
    "log.Info": "bg-blue-50 text-blue-600",
    "log.Debug": "bg-gray-50 text-gray-500",
    "log.Critical": "bg-red-200 text-red-800",
    "log.Emergency": "bg-red-300 text-red-900",
    default: "bg-gray-100 text-gray-700",
  };

  const levelColors = {
    Emergency: "bg-red-600 text-white",
    Alert: "bg-red-500 text-white",
    Critical: "bg-red-400 text-white",
    Error: "bg-red-100 text-red-700",
    Warning: "bg-yellow-100 text-yellow-700",
    Notice: "bg-blue-100 text-blue-700",
    Info: "bg-green-100 text-green-700",
    Debug: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track translations, function calls, and system events
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setTimeout(() => load(), 0);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Actions</option>
            <option value="translation">Translations</option>
            <option value="function_call">Function Calls</option>
            <option value="auto_ticket_created">Auto-Created Tickets</option>
            <option value="login">Logins</option>
            <option value="password_reset">Password Resets</option>
          </select>
          <select
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value);
              setTimeout(() => load(), 0);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Levels</option>
            <option value="Emergency">Emergency</option>
            <option value="Alert">Alert</option>
            <option value="Critical">Critical</option>
            <option value="Error">Error</option>
            <option value="Warning">Warning</option>
            <option value="Notice">Notice</option>
            <option value="Info">Info</option>
            <option value="Debug">Debug</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-2 py-3"></th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Timestamp
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Level
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                User
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Action
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  No audit logs found
                </td>
              </tr>
            )}
            {logs.map((log) => {
              const details =
                typeof log.description === "string" ? log.description : "";
              const context = log.context || {};
              const isTranslation = log.action === "translation";
              const hasContext = Object.keys(context).length > 0;
              const isExpanded = expandedRows.has(log.id);
              return (
                <>
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => hasContext && toggleRow(log.id)}
                  >
                    <td className="px-2 py-3 text-gray-400">
                      {hasContext &&
                        (isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4" />
                        ))}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      {log.level && (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${levelColors[log.level] || "bg-gray-100 text-gray-600"}`}
                        >
                          {log.level}
                        </span>
                      )}
                      {log.channel && (
                        <span className="block text-[10px] text-gray-400 mt-0.5">
                          {log.channel}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-900 font-medium">
                      {log.user?.name || "System"}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${actionColors[log.action] || actionColors.default}`}
                      >
                        {isTranslation && <LanguageIcon className="h-3 w-3" />}
                        {log.action?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600 text-xs max-w-md">
                      {isTranslation && typeof context === "object" ? (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <GlobeAltIcon className="h-3 w-3 text-purple-500" />
                            <span className="font-medium text-purple-700">
                              {context.original_language === "sn"
                                ? "Shona"
                                : context.original_language === "nd"
                                  ? "Ndebele"
                                  : context.original_language}
                              {" → English"}
                            </span>
                          </div>
                          {context.original_text && (
                            <p className="text-gray-500 italic">
                              "{context.original_text}"
                            </p>
                          )}
                          {context.translated_text && (
                            <p className="text-gray-700 mt-0.5">
                              → "{context.translated_text}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="truncate block">
                          {details ? details.substring(0, 150) : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && hasContext && (
                    <tr key={`${log.id}-ctx`} className="bg-gray-50">
                      <td colSpan={6} className="px-8 py-3">
                        <div className="text-xs">
                          <div className="font-medium text-gray-700 mb-1">
                            Context / Debug Info
                          </div>
                          <pre className="bg-gray-900 text-green-300 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto text-[11px] leading-relaxed whitespace-pre-wrap">
                            {JSON.stringify(context, null, 2)}
                          </pre>
                          {details && (
                            <div className="mt-2">
                              <div className="font-medium text-gray-700 mb-1">
                                Message
                              </div>
                              <p className="text-gray-600 whitespace-pre-wrap">
                                {details}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from(
            { length: Math.min(pagination.last_page, 10) },
            (_, i) => (
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
            ),
          )}
        </div>
      )}
    </div>
  );
}
