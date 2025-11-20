import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { TemplateEditor } from './components/templates/TemplateEditor';
import { SignupPage } from './pages/SignupPage';
import { Dashboard } from './pages/app/Dashboard';
import { Contacts } from './pages/app/Contacts';
import { Campaigns } from './pages/app/Campaigns';
import { Templates } from './pages/app/Templates';
import { Analytics } from './pages/app/Analytics';
import { Settings } from './pages/app/Settings';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminSystemPage } from './pages/admin/AdminSystemPage';
import { AdminLayout } from './components/admin/AdminLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#000000',
                border: '1px solid #000000',
                borderRadius: '9999px',
                padding: '16px',
                fontFamily: 'DM Sans, sans-serif',
              },
              success: {
                iconTheme: {
                  primary: '#f3ba42',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/app/templates/editor" element={<ProtectedRoute><TemplateEditor /></ProtectedRoute>} />
            <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/app/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
            <Route path="/app/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
            <Route path="/app/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/app/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/app/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* Redirect old routes to new locations */}
            <Route path="/app/audience" element={<Navigate to="/app/contacts" replace />} />

            {/* Old admin route redirects to new dashboard */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* New admin routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} />
            <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsersPage /></AdminProtectedRoute>} />
            <Route path="/admin/system" element={<AdminProtectedRoute><AdminSystemPage /></AdminProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
