import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { Dashboard } from './pages/app/Dashboard';
import { Audience } from './pages/app/Audience';
import { Campaigns } from './pages/app/Campaigns';
import { Automations } from './pages/app/Automations';
import { Templates } from './pages/app/Templates';
import { ContentStudio } from './pages/app/ContentStudio';
import { LandingPages } from './pages/app/LandingPages';
import { Analytics } from './pages/app/Analytics';
import { Settings } from './pages/app/Settings';
import { AdminDashboard } from './pages/admin/AdminDashboard';

function Router() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href && link.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const path = link.href.replace(window.location.origin, '');
        window.history.pushState({}, '', path);
        setCurrentPath(path);
        window.scrollTo(0, 0);
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

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
    if (currentPath === '/signup') return <SignupPage />;
    if (currentPath === '/login') return <LoginPage />;
    return <LandingPage />;
  }

  if (currentPath === '/' || currentPath === '/login' || currentPath === '/signup') {
    window.history.pushState({}, '', '/app');
    return <Dashboard />;
  }

  switch (currentPath) {
    case '/app':
      return <Dashboard />;
    case '/app/audience':
      return <Audience />;
    case '/app/campaigns':
      return <Campaigns />;
    case '/app/automations':
      return <Automations />;
    case '/app/templates':
      return <Templates />;
    case '/app/content':
      return <ContentStudio />;
    case '/app/landing-pages':
      return <LandingPages />;
    case '/app/analytics':
      return <Analytics />;
    case '/app/settings':
      return <Settings />;
    case '/admin':
      return <AdminDashboard />;
    default:
      return <Dashboard />;
  }
}

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
