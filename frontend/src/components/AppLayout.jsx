import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import {
  ChatBubbleLeftRightIcon,
  TicketIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ServerStackIcon,
  BookOpenIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import gsuLogo from "../assets/gsu-logo.png";

const userNav = [
  { name: "Chat", href: "/chat", icon: ChatBubbleLeftRightIcon },
  { name: "Tickets", href: "/tickets", icon: TicketIcon },
];

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: ChartBarIcon },
  { name: "Knowledge Base", href: "/admin/knowledge-base", icon: BookOpenIcon },
  { name: "Data Sources", href: "/admin/data-sources", icon: ServerStackIcon },
  { name: "Tickets", href: "/admin/tickets", icon: TicketIcon },
  { name: "Users", href: "/admin/users", icon: UserGroupIcon },
  {
    name: "Audit Log",
    href: "/admin/audit-log",
    icon: ClipboardDocumentListIcon,
  },
  { name: "FAQ Analytics", href: "/admin/faq-analytics", icon: ChartBarIcon },
  { name: "Settings", href: "/admin/settings", icon: Cog6ToothIcon },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const nav =
    isAdmin && location.pathname.startsWith("/admin") ? adminNav : userNav;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link
            to={isAdmin ? "/admin" : "/chat"}
            className="flex items-center space-x-2"
          >
            <img src={gsuLogo} alt="GSU" className="h-14 w-14 object-contain" />
            <span className="text-lg font-bold text-gray-900">SmartAssist</span>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active =
              location.pathname === item.href ||
              location.pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 mr-3 ${active ? "text-blue-600" : "text-gray-400"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <div className="px-3 py-2 border-t border-gray-200">
            <Link
              to={location.pathname.startsWith("/admin") ? "/chat" : "/admin"}
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              {location.pathname.startsWith("/admin")
                ? "Switch to User View"
                : "Switch to Admin"}
            </Link>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="h-6 w-6 text-gray-500" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="text-sm text-gray-700">
              <span className="font-medium">{user?.name}</span>
              <span className="text-gray-400 ml-1 capitalize">
                ({user?.role})
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
