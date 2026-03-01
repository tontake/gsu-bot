import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

// Public pages
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import OnboardingPage from "./pages/OnboardingPage";

// User pages
import ChatPage from "./pages/ChatPage";
import TicketsPage from "./pages/TicketsPage";

// Admin pages
import AdminDashboard from "./pages/admin/DashboardPage";
import KnowledgeBasePage from "./pages/admin/KnowledgeBasePage";
import DataSourcesPage from "./pages/admin/DataSourcesPage";
import AdminTicketsPage from "./pages/admin/AdminTicketsPage";
import UsersPage from "./pages/admin/UsersPage";
import AuditLogPage from "./pages/admin/AuditLogPage";
import FaqAnalyticsPage from "./pages/admin/FaqAnalyticsPage";
import SettingsPage from "./pages/admin/SettingsPage";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/chat"} replace />;
}

function OnboardingGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboarding_completed) return <Navigate to="/chat" replace />;
  return <OnboardingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingGuard />} />

          {/* Protected user routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
            </Route>
          </Route>

          {/* Protected admin routes */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route
                path="/admin/knowledge-base"
                element={<KnowledgeBasePage />}
              />
              <Route path="/admin/data-sources" element={<DataSourcesPage />} />
              <Route path="/admin/tickets" element={<AdminTicketsPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/audit-log" element={<AuditLogPage />} />
              <Route
                path="/admin/faq-analytics"
                element={<FaqAnalyticsPage />}
              />
              <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
