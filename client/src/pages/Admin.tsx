import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminLayout, AdminTab } from '../components/layout/AdminLayout';
import AdminLogin from './AdminLogin';
import AdminPaintings from './AdminPaintings';
import AdminContact from './AdminContact';
import AdminCommissions from './AdminCommissions';

function StubSection({ section }: { section: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface/60 py-24 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-accent/80">Coming Soon</p>
      <h2 className="section-heading mt-4 text-2xl font-semibold capitalize text-text">{section}</h2>
      <p className="mt-3 max-w-sm text-text/60">This section will be available in a future update.</p>
    </div>
  );
}

export default function Admin() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('paintings');

  if (!isAuthenticated) return <AdminLogin />;

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'paintings' && <AdminPaintings />}
      {activeTab === 'commissions' && <AdminCommissions />}
      {activeTab === 'contact' && <AdminContact />}
      {activeTab === 'blog' && <StubSection section="blog" />}
      {activeTab === 'events' && <StubSection section="events" />}
      {activeTab === 'orders' && <StubSection section="orders" />}
    </AdminLayout>
  );
}
