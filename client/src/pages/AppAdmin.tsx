import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppAdminLayout } from '../components/layout/AppAdminLayout';
import AppAdminLogin from './AppAdminLogin';
import AppAdminGalleries from './AppAdminGalleries';
import AppAdminGalleryDetail from './AppAdminGalleryDetail';

export default function AppAdmin() {
  const { isAuthenticated, isAppAdmin, initializing } = useAuth();

  if (initializing) return null;

  if (!isAuthenticated) return <AppAdminLogin />;

  if (!isAppAdmin) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-accent/80">Access Denied</p>
          <h1 className="mt-3 text-xl font-semibold text-text">Platform admin access required</h1>
          <p className="mt-2 text-sm text-text/60">Your account does not have platform admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <AppAdminLayout>
      <Routes>
        <Route index element={<AppAdminGalleries />} />
        <Route path="galleries/:id" element={<AppAdminGalleryDetail />} />
      </Routes>
    </AppAdminLayout>
  );
}
