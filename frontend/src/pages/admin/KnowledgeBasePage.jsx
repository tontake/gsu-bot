import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  GlobeAltIcon,
  CommandLineIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const TYPES = [
  {
    value: "api",
    label: "API",
    icon: CommandLineIcon,
    description: "External API endpoint",
    placeholder: "https://api.example.com/endpoint",
    contentLabel: "API Endpoint URL",
  },
  {
    value: "website",
    label: "Website Link",
    icon: GlobeAltIcon,
    description: "Website URL for reference",
    placeholder: "https://www.example.com/page",
    contentLabel: "Website URL",
  },
  {
    value: "text",
    label: "Text",
    icon: DocumentTextIcon,
    description: "Plain text knowledge",
    placeholder: "Enter the knowledge content here...",
    contentLabel: "Text Content",
  },
];

export default function KnowledgeBasePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "text",
    description: "",
    content: "",
    is_active: true,
  });
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await adminApi.knowledgeBase.list();
      setItems(res.data.data || res.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      if (editing) {
        await adminApi.knowledgeBase.update(editing.id, form);
      } else {
        await adminApi.knowledgeBase.create(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({
        name: "",
        type: "text",
        description: "",
        content: "",
        is_active: true,
      });
      load();
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to save. Check your inputs.",
      );
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this knowledge base entry?")) return;
    await adminApi.knowledgeBase.delete(id);
    load();
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      type: item.type,
      description: item.description || "",
      content: item.content || "",
      is_active: item.is_active,
    });
    setShowForm(true);
  };

  const selectedType = TYPES.find((t) => t.value === form.type) || TYPES[2];

  const filtered =
    filter === "all" ? items : items.filter((i) => i.type === filter);

  const typeCounts = {
    all: items.length,
    api: items.filter((i) => i.type === "api").length,
    website: items.filter((i) => i.type === "website").length,
    text: items.filter((i) => i.type === "text").length,
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add API endpoints, website links, or text content for the AI to use
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({
              name: "",
              type: "text",
              description: "",
              content: "",
              is_active: true,
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <PlusIcon className="h-4 w-4" /> Add Entry
        </button>
      </div>

      {/* Type filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { key: "all", label: "All", icon: null },
          ...TYPES.map((t) => ({ key: t.value, label: t.label, icon: t.icon })),
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`p-3 rounded-xl border-2 text-left transition ${
              filter === f.key
                ? "border-blue-500 bg-blue-50"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {f.icon && <f.icon className="h-4 w-4 text-gray-500" />}
              <span className="text-sm font-medium text-gray-900">
                {f.label}
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {typeCounts[f.key]}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Name
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Type
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Description
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Content
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Status
              </th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">
                Actions
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
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  No knowledge base entries
                  {filter !== "all" ? ` of type "${filter}"` : ""} yet
                </td>
              </tr>
            )}
            {filtered.map((item) => {
              const typeInfo = TYPES.find((t) => t.value === item.type);
              const TypeIcon = typeInfo?.icon || DocumentTextIcon;
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                      <TypeIcon className="h-3 w-3" />
                      {typeInfo?.label || item.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600 max-w-xs truncate">
                    {item.description || "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-600 max-w-xs truncate font-mono text-xs">
                    {item.type === "text"
                      ? item.content?.substring(0, 60) +
                        (item.content?.length > 60 ? "..." : "")
                      : item.content || "—"}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        item.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 ml-2"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editing ? "Edit" : "Add"} Knowledge Base Entry
              </h3>
              <button onClick={() => setShowForm(false)}>
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: t.value })}
                      className={`p-3 border-2 rounded-xl text-center text-xs transition ${
                        form.type === t.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <t.icon className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                      <p className="font-medium text-gray-900">{t.label}</p>
                      <p className="text-gray-500 mt-0.5">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. University Admissions API"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              {/* Description for LLM */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description{" "}
                  <span className="text-gray-400 font-normal">
                    (for AI to understand what this does)
                  </span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Describe what this knowledge source provides so the AI knows when and how to use it..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                />
              </div>

              {/* Content (URL or text) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedType.contentLabel}
                </label>
                {form.type === "text" ? (
                  <textarea
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                    rows={5}
                    placeholder={selectedType.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                  />
                ) : (
                  <input
                    type="url"
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                    placeholder={selectedType.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                )}
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                Active
              </label>

              <button
                onClick={save}
                disabled={!form.name || !form.description || !form.content}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
