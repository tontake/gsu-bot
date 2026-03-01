import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const SETTING_GROUPS = [
  {
    title: "General",
    settings: [
      { key: "app_name", label: "Application Name", type: "text" },
      { key: "welcome_message", label: "Welcome Message", type: "textarea" },
      { key: "maintenance_mode", label: "Maintenance Mode", type: "toggle" },
    ],
  },
  {
    title: "AI / LLM",
    settings: [
      { key: "openai_model", label: "OpenAI Model", type: "text" },
      { key: "max_tokens", label: "Max Response Tokens", type: "number" },
      { key: "temperature", label: "Temperature", type: "number" },
      { key: "system_prompt", label: "System Prompt", type: "textarea" },
    ],
  },
  {
    title: "Chat",
    settings: [
      {
        key: "max_messages_per_session",
        label: "Max Messages Per Session",
        type: "number",
      },
      {
        key: "session_timeout_minutes",
        label: "Session Timeout (minutes)",
        type: "number",
      },
    ],
  },
];

export default function SettingsPage() {
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.settings
      .list()
      .then((res) => {
        const data = res.data.data || res.data || [];
        const map = {};
        if (Array.isArray(data)) {
          data.forEach((s) => {
            map[s.key] = s.value;
          });
        } else {
          Object.assign(map, data);
        }
        setValues(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (key, value) => {
    try {
      await adminApi.settings.update(key, { value });
      setSaved(key);
      setTimeout(() => setSaved(""), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-8 bg-gray-200 rounded w-48 mb-6"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {SETTING_GROUPS.map((group) => (
        <div key={group.title} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {group.title}
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {group.settings.map((setting) => (
              <div key={setting.key} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {setting.label}
                  </label>
                  {saved === setting.key && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircleIcon className="h-3 w-3" /> Saved
                    </span>
                  )}
                </div>
                {setting.type === "text" && (
                  <input
                    type="text"
                    value={values[setting.key] || ""}
                    onChange={(e) =>
                      setValues({ ...values, [setting.key]: e.target.value })
                    }
                    onBlur={(e) => save(setting.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
                {setting.type === "number" && (
                  <input
                    type="number"
                    value={values[setting.key] || ""}
                    onChange={(e) =>
                      setValues({ ...values, [setting.key]: e.target.value })
                    }
                    onBlur={(e) => save(setting.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
                {setting.type === "textarea" && (
                  <textarea
                    value={values[setting.key] || ""}
                    onChange={(e) =>
                      setValues({ ...values, [setting.key]: e.target.value })
                    }
                    onBlur={(e) => save(setting.key, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                )}
                {setting.type === "toggle" && (
                  <button
                    onClick={() => {
                      const newVal =
                        values[setting.key] === "1" ||
                        values[setting.key] === true
                          ? "0"
                          : "1";
                      setValues({ ...values, [setting.key]: newVal });
                      save(setting.key, newVal);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      values[setting.key] === "1" ||
                      values[setting.key] === true
                        ? "bg-blue-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition transform ${
                        values[setting.key] === "1" ||
                        values[setting.key] === true
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
