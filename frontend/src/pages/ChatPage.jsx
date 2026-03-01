import { useState, useEffect, useRef } from "react";
import { chatApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  PaperAirplaneIcon,
  PlusIcon,
  ChatBubbleLeftEllipsisIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function ChatPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  // Load sessions
  useEffect(() => {
    loadSessions();
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession);
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  // Auto-scroll
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const res = await chatApi.sessions();
      setSessions(res.data.data || res.data || []);
    } catch {}
  };

  const loadMessages = async (sessionId) => {
    try {
      const res = await chatApi.messages(sessionId);
      const raw = res.data.data || res.data || [];
      // Backend returns {id, message, response, timestamp} per row.
      // Expand each into separate user + assistant messages for the UI.
      const expanded = [];
      raw.forEach((m) => {
        if (m.message) {
          expanded.push({
            id: `u-${m.id}`,
            role: "user",
            content: m.message,
            created_at: m.timestamp || m.created_at,
          });
        }
        if (m.response) {
          expanded.push({
            id: `a-${m.id}`,
            role: "assistant",
            content: m.response,
            created_at: m.timestamp || m.created_at,
          });
        }
      });
      setMessages(expanded);
    } catch {}
  };

  const newChat = () => {
    setActiveSession(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm("Delete this chat?")) return;
    try {
      await chatApi.deleteSession(sessionId);
      if (activeSession === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch {}
  };

  const handleClearAll = async () => {
    if (!confirm("Delete all chat history? This cannot be undone.")) return;
    try {
      await chatApi.deleteAllSessions();
      setSessions([]);
      setActiveSession(null);
      setMessages([]);
    } catch {}
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // Optimistic user message
    const tempMsg = {
      id: Date.now(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const payload = { message: text };
      if (activeSession) payload.session_id = activeSession;

      const res = await chatApi.send(payload);
      const data = res.data;

      // Set session if new
      if (!activeSession && data.session_id) {
        setActiveSession(data.session_id);
        loadSessions();
      }

      // Replace temp message + add assistant response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempMsg.id);
        const newMsgs = [];
        if (data.user_message) {
          newMsgs.push({
            ...data.user_message,
            content: data.user_message.content || data.user_message.message,
            created_at:
              data.user_message.created_at ||
              data.user_message.timestamp ||
              data.timestamp,
          });
        } else {
          newMsgs.push({
            ...tempMsg,
            id: `user-${Date.now()}`,
            content: data.message || text,
            created_at: data.timestamp || new Date().toISOString(),
          });
        }
        if (data.assistant_message) {
          newMsgs.push({
            ...data.assistant_message,
            content:
              data.assistant_message.content || data.assistant_message.response,
            created_at:
              data.assistant_message.created_at ||
              data.assistant_message.timestamp ||
              data.timestamp,
          });
        } else if (data.response) {
          newMsgs.push({
            id: `asst-${Date.now()}`,
            role: "assistant",
            content: data.response,
            created_at: data.timestamp || new Date().toISOString(),
          });
        }
        return [...filtered, ...newMsgs];
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          created_at: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sessions sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform
          md:static md:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden"}
        `}
      >
        <div className="p-3 border-b border-gray-100 space-y-2">
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <PlusIcon className="h-4 w-4" />
            New Chat
          </button>
          {sessions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="w-full flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
            >
              <TrashIcon className="h-4 w-4" />
              Clear All Chats
            </button>
          )}
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {sessions.length === 0 && (
            <p className="text-center text-sm text-gray-400 mt-8">
              No past chats yet
            </p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`group w-full text-left px-3 py-2.5 rounded-lg text-sm transition flex items-center gap-2 cursor-pointer ${
                activeSession === s.session_id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveSession(s.session_id);
                setSidebarOpen(false);
              }}
            >
              <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="truncate flex-1">
                {s.title ||
                  `Chat ${new Date(s.created_at).toLocaleDateString()}`}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(s.session_id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition"
                title="Delete chat"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Toggle sidebar + header */}
        <div className="flex items-center px-4 py-2 bg-white border-b border-gray-100">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 mr-3 text-gray-500"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h2 className="text-sm font-medium text-gray-600">
            {activeSession ? "Chat Session" : "New Conversation"}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ChatBubbleLeftEllipsisIcon className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                How can I help you today?
              </h3>
              <p className="text-gray-400 max-w-md">
                Ask me anything about GSU — admissions, courses, timetables,
                fees, and more. You can ask in English, Shona, or Ndebele.
              </p>
            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`chat-message ${
                    msg.role === "user"
                      ? "chat-message-user"
                      : msg.isError
                        ? "bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-bl-sm px-4 py-3"
                        : "chat-message-assistant"
                  } max-w-[80%]`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {msg.content}
                  </div>
                  <div
                    className={`text-xs mt-1 ${msg.role === "user" ? "text-blue-300" : "text-gray-400"}`}
                  >
                    {msg.created_at && !isNaN(new Date(msg.created_at))
                      ? new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="chat-message-assistant max-w-[80%]">
                  <div className="flex items-center gap-1">
                    <span
                      className="animate-bounce inline-block w-2 h-2 bg-gray-400 rounded-full"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="animate-bounce inline-block w-2 h-2 bg-gray-400 rounded-full"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="animate-bounce inline-block w-2 h-2 bg-gray-400 rounded-full"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEnd} />
          </div>
        </div>

        {/* Input */}
        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shona / Ndebele / English)"
                rows={1}
                className="flex-1 resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32"
                style={{ minHeight: "24px" }}
                onInput={(e) => {
                  e.target.style.height = "24px";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 128) + "px";
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              GSU SmartAssist can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
