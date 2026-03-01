import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  TicketIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .dashboard()
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        {
          name: "Total Users",
          value: stats.total_users || 0,
          icon: UsersIcon,
          color: "bg-blue-500",
        },
        {
          name: "Chat Sessions",
          value: stats.total_sessions || stats.total_chat_sessions || 0,
          icon: ChatBubbleLeftRightIcon,
          color: "bg-green-500",
        },
        {
          name: "Open Tickets",
          value: stats.open_tickets || 0,
          icon: TicketIcon,
          color: "bg-orange-500",
        },
        {
          name: "Total Messages",
          value: stats.total_messages || 0,
          icon: ChartBarIcon,
          color: "bg-purple-500",
        },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div
              key={card.name}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-xl`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats?.recent_tickets && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Tickets
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Subject
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  User
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recent_tickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900">{t.subject}</td>
                  <td className="px-6 py-3 text-gray-600">
                    {t.user?.name || "N/A"}
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                      {t.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
