import { useState, useEffect } from "react";
import { ticketApi } from "../services/api";
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  XMarkIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

const priorityColors = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const statusColors = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    message: "",
    priority: "medium",
    category: "general",
  });
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [listOpen, setListOpen] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const res = await ticketApi.list();
      setTickets(res.data.data || res.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async (id) => {
    try {
      const res = await ticketApi.show(id);
      const ticket = res.data.data || res.data;
      setSelectedTicket(ticket);
      setReplies(ticket.replies || []);
    } catch {}
  };

  const createTicket = async () => {
    try {
      await ticketApi.create(form);
      setShowCreate(false);
      setForm({
        subject: "",
        message: "",
        priority: "medium",
        category: "general",
      });
      loadTickets();
    } catch {}
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    try {
      await ticketApi.reply(selectedTicket.id, { message: replyText });
      setReplyText("");
      loadReplies(selectedTicket.id);
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

      {/* Ticket list */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-gray-200 flex flex-col transform transition-transform
          md:static md:translate-x-0 md:w-96 md:z-auto
          ${listOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Support Tickets
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
            <button
              className="md:hidden p-2 text-gray-400 hover:text-gray-600"
              onClick={() => setListOpen(false)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {loading && (
            <p className="text-center text-gray-400 mt-8">Loading...</p>
          )}
          {!loading && tickets.length === 0 && (
            <p className="text-center text-gray-400 mt-8">No tickets yet</p>
          )}
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                loadReplies(t.id);
                setListOpen(false);
              }}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${
                selectedTicket?.id === t.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {t.subject}
                </span>
                <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`px-2 py-0.5 rounded-full ${statusColors[t.status] || "bg-gray-100"}`}
                >
                  {t.status?.replace("_", " ")}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full ${priorityColors[t.priority] || "bg-gray-100"}`}
                >
                  {t.priority}
                </span>
                <span className="text-gray-400 ml-auto">
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ticket detail / conversation */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        {!selectedTicket ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <button
              className="md:hidden mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
              onClick={() => setListOpen(true)}
            >
              View Tickets
            </button>
            <ChatBubbleLeftRightIcon className="h-16 w-16 mb-4" />
            <p>Select a ticket to view the conversation</p>
          </div>
        ) : (
          <>
            <div className="px-4 sm:px-6 py-4 bg-white border-b border-gray-200 flex items-start gap-3">
              <button
                className="md:hidden mt-1 p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                onClick={() => setListOpen(true)}
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {selectedTicket.subject}
                </h3>
                <div className="flex gap-2 mt-1 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-full ${statusColors[selectedTicket.status]}`}
                  >
                    {selectedTicket.status?.replace("_", " ")}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full ${priorityColors[selectedTicket.priority]}`}
                  >
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
              {/* Original message */}
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedTicket.message}
                  </p>
                  <p className="text-xs text-blue-300 mt-1">
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {/* Replies */}
              {replies.map((r) => (
                <div
                  key={r.id}
                  className={`flex ${r.user?.role === "admin" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-lg ${
                      r.user?.role === "admin"
                        ? "bg-white border border-gray-200 rounded-bl-sm"
                        : "bg-blue-600 text-white rounded-br-sm"
                    }`}
                  >
                    {r.user?.role === "admin" && (
                      <p className="text-xs font-medium text-blue-600 mb-1">
                        Admin
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">
                      {r.message || r.reply}
                    </p>
                    <p
                      className={`text-xs mt-1 ${r.user?.role === "admin" ? "text-gray-400" : "text-blue-300"}`}
                    >
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Reply input */}
            {selectedTicket.status !== "closed" && (
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendReply()}
                    placeholder="Type a reply..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 text-sm font-medium"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create ticket modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                New Support Ticket
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="general">General</option>
                    <option value="academic">Academic</option>
                    <option value="financial">Financial</option>
                    <option value="technical">Technical</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                />
              </div>
              <button
                onClick={createTicket}
                disabled={!form.subject || !form.message}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
