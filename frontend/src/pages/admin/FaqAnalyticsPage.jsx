import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";

export default function FaqAnalyticsPage() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.faqAnalytics
      .list()
      .then((res) => setAnalytics(res.data.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">FAQ Analytics</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Question
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Category
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Count
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Helpful
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Last Asked
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
            {!loading && analytics.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  No analytics data yet
                </td>
              </tr>
            )}
            {analytics.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-900 max-w-xs truncate">
                  {a.question}
                </td>
                <td className="px-6 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                    {a.category || "general"}
                  </span>
                </td>
                <td className="px-6 py-3 font-medium text-gray-900">
                  {a.count || a.ask_count || 0}
                </td>
                <td className="px-6 py-3 text-gray-600">
                  {a.helpful_count || 0} / {a.not_helpful_count || 0}
                </td>
                <td className="px-6 py-3 text-gray-500 text-xs">
                  {a.last_asked_at
                    ? new Date(a.last_asked_at).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
