import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const statusColors = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [listOpen, setListOpen] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await adminApi.tickets.list({ search });
      setTickets(res.data.data || res.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadTicket = async (id) => {
    try {
      const res = await adminApi.tickets.show(id);
      setSelected(res.data.data || res.data);
      setStatusUpdate(res.data.data?.status || res.data?.status || "");
    } catch {}
  };

  const reply = async () => {
    if (!replyText.trim()) return;
    try {
      await adminApi.tickets.reply(selected.id, { message: replyText });
      setReplyText("");
      loadTicket(selected.id);
    } catch {}
  };

  const updateStatus = async () => {
    try {
      await adminApi.tickets.updateStatus(selected.id, {
        status: statusUpdate,
      });
      loadTicket(selected.id);
      load();
    } catch {}
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] relative">
      {/* Mobile overlay */}
      {listOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setListOpen(false)}
        />
      )}

      {/* List */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-gray-200 flex flex-col transform transition-transform
          md:static md:translate-x-0 md:w-96 md:z-auto
          ${listOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Tickets</h2>
          <button
            className="md:hidden p-1.5 text-gray-400 hover:text-gray-600"
            onClick={() => setListOpen(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 pt-0 border-b border-gray-100">
          <div className="relative mt-3">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search tickets..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                loadTicket(t.id);
                setListOpen(false);
              }}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${selected?.id === t.id ? "bg-blue-50" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {t.subject}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`px-2 py-0.5 rounded-full ${statusColors[t.status] || "bg-gray-100"}`}
                >
                  {t.status?.replace("_", " ")}
                </span>
                <span className="text-gray-400">{t.user?.name}</span>
                <span className="text-gray-400 ml-auto">
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <button
              className="md:hidden mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
              onClick={() => setListOpen(true)}
            >
              View Tickets
            </button>
            <p>Select a ticket to manage</p>
          </div>
        ) : (
          <>
            <div className="px-4 sm:px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    className="md:hidden mt-1 p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                    onClick={() => setListOpen(true)}
                  >
                    <Bars3Icon className="h-5 w-5" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {selected.subject}
                    </h3>
                    <p className="text-sm text-gray-500">
                      by {selected.user?.name} · {selected.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    onClick={updateStatus}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-lg">
                  <p className="text-xs font-medium text-blue-200 mb-1">
                    {selected.user?.name}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {selected.message}
                  </p>
                  <p className="text-xs text-blue-300 mt-1">
                    {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {(selected.replies || []).map((r) => (
                <div
                  key={r.id}
                  className={`flex ${r.user?.role === "admin" || r.replied_by?.role === "admin" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-lg ${
                      r.user?.role === "admin" || r.replied_by?.role === "admin"
                        ? "bg-white border border-gray-200 rounded-bl-sm"
                        : "bg-blue-600 text-white rounded-br-sm"
                    }`}
                  >
                    <p
                      className={`text-xs font-medium mb-1 ${r.user?.role === "admin" || r.replied_by?.role === "admin" ? "text-blue-600" : "text-blue-200"}`}
                    >
                      {r.user?.name || r.replied_by?.name}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {r.message || r.reply}
                    </p>
                    <p
                      className={`text-xs mt-1 ${r.user?.role === "admin" || r.replied_by?.role === "admin" ? "text-gray-400" : "text-blue-300"}`}
                    >
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && reply()}
                  placeholder="Reply as admin..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <button
                  onClick={reply}
                  disabled={!replyText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 text-sm font-medium"
                >
                  Reply
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                User will be notified of your reply
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
