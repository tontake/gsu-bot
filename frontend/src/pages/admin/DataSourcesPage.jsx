import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import {
  ServerStackIcon,
  TableCellsIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilSquareIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const CATEGORIES = [
  {
    value: "student_info",
    label: "Student Information",
    description: "Student records, enrollment, grades",
  },
  {
    value: "staff_info",
    label: "Staff Information",
    description: "Staff directory, departments, contacts",
  },
  {
    value: "general_enquiry",
    label: "General Enquiry",
    description: "General university information and FAQs",
  },
];

export default function DataSourcesPage() {
  const [sources, setSources] = useState([]);
  const [showConfigure, setShowConfigure] = useState(false);
  const [showSchema, setShowSchema] = useState(null);
  const [crawlResult, setCrawlResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [crawling, setCrawling] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "student_info",
    host: "127.0.0.1",
    port: "3306",
    database: "",
    username: "root",
    password: "",
    table_descriptions: [],
  });
  const [newTableDesc, setNewTableDesc] = useState({
    table: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await adminApi.knowledgeSources.list();
      setSources(res.data?.data || res.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setConnectionStatus(null);
    setTesting(true);
    try {
      const res = await adminApi.dataSources.testConnection({
        host: form.host,
        port: form.port,
        database: form.database,
        username: form.username,
        password: form.password,
      });
      setConnectionStatus({
        success: true,
        message: `Connected! Found ${res.data.tables_count} tables.`,
      });
    } catch (err) {
      setConnectionStatus({
        success: false,
        message: err.response?.data?.message || "Connection failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const crawlDatabase = async () => {
    setCrawlResult(null);
    setCrawling(true);
    try {
      const res = await adminApi.dataSources.crawl({
        host: form.host,
        port: form.port,
        database: form.database,
        username: form.username,
        password: form.password,
      });
      setCrawlResult(res.data);
    } catch (err) {
      setCrawlResult({
        error: err.response?.data?.message || "Crawl failed",
      });
    } finally {
      setCrawling(false);
    }
  };

  const addTableDescription = () => {
    if (!newTableDesc.table || !newTableDesc.description) return;
    setForm({
      ...form,
      table_descriptions: [...form.table_descriptions, { ...newTableDesc }],
    });
    setNewTableDesc({ table: "", description: "" });
  };

  const removeTableDescription = (index) => {
    setForm({
      ...form,
      table_descriptions: form.table_descriptions.filter((_, i) => i !== index),
    });
  };

  const configure = async () => {
    try {
      await adminApi.dataSources.configure({
        name: form.name,
        description: form.description,
        category: form.category,
        host: form.host,
        port: form.port,
        database: form.database,
        username: form.username,
        password: form.password,
        table_descriptions: form.table_descriptions,
      });
      setShowConfigure(false);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to configure data source.");
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      category: "student_info",
      host: "127.0.0.1",
      port: "3306",
      database: "",
      username: "root",
      password: "",
      table_descriptions: [],
    });
    setConnectionStatus(null);
    setCrawlResult(null);
    setNewTableDesc({ table: "", description: "" });
  };

  const removeSource = async (id) => {
    if (!confirm("Delete this data source?")) return;
    await adminApi.knowledgeSources.delete(id);
    loadData();
  };

  const reCrawl = async (source) => {
    try {
      const res = await adminApi.dataSources.crawl({
        host: source.config?.host || "127.0.0.1",
        port: source.config?.port || "3306",
        database: source.config?.database || "",
        username: source.config?.username || "root",
        password: source.config?.password || "",
        source_id: source.id,
      });
      alert(`Crawl complete! Found ${res.data.tables_count} tables.`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Crawl failed");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Sources</h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect external MySQL databases for LLM to query
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowConfigure(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <PlusIcon className="h-4 w-4" /> Add Database
        </button>
      </div>

      {/* Category overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {CATEGORIES.map((cat) => {
          const catSources = sources.filter((s) => s.category === cat.value);
          return (
            <div
              key={cat.value}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ServerStackIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{cat.label}</h3>
                  <p className="text-xs text-gray-500">{cat.description}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {catSources.length}
              </p>
              <p className="text-xs text-gray-500">
                configured source{catSources.length !== 1 ? "s" : ""}
              </p>
              {catSources.length > 0 && (
                <div className="mt-3 space-y-1">
                  {catSources.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 text-xs text-gray-600"
                    >
                      <TableCellsIcon className="h-3 w-3" />
                      <span>{s.name}</span>
                      <span className="text-gray-400">
                        ({s.config?.database || "—"})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* All configured sources table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            All Configured Databases
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Name
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Database
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Host
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Category
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Tables Described
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Schema Crawled
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
                <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && sources.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                  No data sources configured
                </td>
              </tr>
            )}
            {sources.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">
                  {s.name}
                </td>
                <td className="px-6 py-3 font-mono text-xs text-gray-600">
                  {s.config?.database || "—"}
                </td>
                <td className="px-6 py-3 text-gray-600 text-xs">
                  {s.config?.host || "127.0.0.1"}:{s.config?.port || "3306"}
                </td>
                <td className="px-6 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                    {s.category?.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600 text-xs">
                  {s.table_descriptions?.length || 0} table(s)
                </td>
                <td className="px-6 py-3">
                  {s.crawled_schema ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                      {Object.keys(s.crawled_schema).length} tables
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                      Not crawled
                    </span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      s.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => setShowSchema(s)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="View schema"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => reCrawl(s)}
                    className="p-1 text-gray-400 hover:text-green-600 ml-1"
                    title="Re-crawl schema"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeSource(s.id)}
                    className="p-1 text-gray-400 hover:text-red-600 ml-1"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schema viewer modal */}
      {showSchema && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {showSchema.name} — Schema
                </h3>
                <p className="text-sm text-gray-500">
                  {showSchema.config?.database} @ {showSchema.config?.host}:
                  {showSchema.config?.port}
                </p>
              </div>
              <button onClick={() => setShowSchema(null)}>
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {showSchema.description && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <strong>Description:</strong> {showSchema.description}
              </div>
            )}

            {showSchema.table_descriptions?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  User-Provided Table Descriptions
                </h4>
                <div className="space-y-1">
                  {showSchema.table_descriptions.map((td, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="font-mono text-blue-600 font-medium min-w-30">
                        {td.table}
                      </span>
                      <span className="text-gray-600">{td.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showSchema.crawled_schema && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Crawled Schema
                </h4>
                <div className="space-y-3">
                  {Object.entries(showSchema.crawled_schema).map(
                    ([table, info]) => (
                      <div
                        key={table}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {table}
                          </span>
                          <span className="text-xs text-gray-500">
                            {info.row_count || 0} rows
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(info.columns || []).map((col) => (
                            <span
                              key={col.name}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono"
                              title={`${col.type}${col.key === "PRI" ? " (PK)" : ""}`}
                            >
                              {col.name}
                              {col.key === "PRI" && (
                                <span className="text-yellow-600 ml-0.5">
                                  🔑
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {!showSchema.crawled_schema && (
              <p className="text-sm text-gray-400">
                Schema has not been crawled yet. Use the re-crawl button in the
                table.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Configure modal */}
      {showConfigure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Add MySQL Database Source
              </h3>
              <button
                onClick={() => {
                  setShowConfigure(false);
                  resetForm();
                }}
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Student Records Database"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description{" "}
                  <span className="text-gray-400 font-normal">
                    (for AI context)
                  </span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  placeholder="Describe what this database contains so the AI knows how to use it..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.value })}
                      className={`p-3 border-2 rounded-xl text-left text-xs transition ${
                        form.category === cat.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-medium text-gray-900">{cat.label}</p>
                      <p className="text-gray-500 mt-0.5">{cat.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Database connection */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  MySQL Connection
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Host
                    </label>
                    <input
                      type="text"
                      value={form.host}
                      onChange={(e) =>
                        setForm({ ...form, host: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Port
                    </label>
                    <input
                      type="text"
                      value={form.port}
                      onChange={(e) =>
                        setForm({ ...form, port: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Database Name
                  </label>
                  <input
                    type="text"
                    value={form.database}
                    onChange={(e) =>
                      setForm({ ...form, database: e.target.value })
                    }
                    placeholder="e.g. gsu_student_records"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      placeholder="(empty by default)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={testConnection}
                    disabled={!form.database || testing}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
                  >
                    {testing ? "Testing..." : "Test Connection"}
                  </button>
                  <button
                    onClick={crawlDatabase}
                    disabled={!form.database || crawling}
                    className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 disabled:opacity-40"
                  >
                    <ArrowPathIcon
                      className={`h-4 w-4 ${crawling ? "animate-spin" : ""}`}
                    />
                    {crawling ? "Crawling..." : "Crawl Tables"}
                  </button>
                </div>

                {/* Connection test result */}
                {connectionStatus && (
                  <div
                    className={`rounded-lg p-3 text-sm ${
                      connectionStatus.success
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {connectionStatus.success ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <ExclamationCircleIcon className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={`font-medium ${
                          connectionStatus.success
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {connectionStatus.message}
                      </span>
                    </div>
                  </div>
                )}

                {/* Crawl result */}
                {crawlResult && !crawlResult.error && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-700 mb-2">
                      Crawled {crawlResult.tables_count} tables from "
                      {crawlResult.database}"
                    </p>
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {Object.entries(crawlResult.schema || {}).map(
                        ([table, info]) => (
                          <div key={table} className="text-xs">
                            <span className="font-mono font-semibold text-gray-800">
                              {table}
                            </span>
                            <span className="text-gray-500 ml-2">
                              ({info.row_count} rows) —{" "}
                              {(info.columns || [])
                                .map((c) => c.name)
                                .join(", ")}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
                {crawlResult?.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {crawlResult.error}
                  </div>
                )}
              </div>

              {/* Table descriptions */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  Table Descriptions{" "}
                  <span className="text-gray-400 font-normal">
                    (describe each table so AI understands what data is
                    available)
                  </span>
                </h4>

                {form.table_descriptions.length > 0 && (
                  <div className="space-y-2">
                    {form.table_descriptions.map((td, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 bg-gray-50 rounded-lg p-2"
                      >
                        <div className="flex-1">
                          <span className="font-mono text-xs font-semibold text-blue-600">
                            {td.table}
                          </span>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {td.description}
                          </p>
                        </div>
                        <button
                          onClick={() => removeTableDescription(i)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTableDesc.table}
                    onChange={(e) =>
                      setNewTableDesc({
                        ...newTableDesc,
                        table: e.target.value,
                      })
                    }
                    placeholder="Table name"
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <input
                    type="text"
                    value={newTableDesc.description}
                    onChange={(e) =>
                      setNewTableDesc({
                        ...newTableDesc,
                        description: e.target.value,
                      })
                    }
                    placeholder="What this table contains..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={addTableDescription}
                    disabled={!newTableDesc.table || !newTableDesc.description}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Save */}
              <button
                onClick={configure}
                disabled={!form.name || !form.database}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                Save Data Source
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
