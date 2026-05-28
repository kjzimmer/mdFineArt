import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminLayout, AdminTab } from '../components/layout/AdminLayout';
import AdminLogin from './AdminLogin';
import AdminPaintings from './AdminPaintings';
import AdminContact from './AdminContact';
import AdminCommissions from './AdminCommissions';
import { apiFetch } from '../lib/api';
import type { BulkUploadResult } from '../types';

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
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);
  const [paintingRefreshSignal, setPaintingRefreshSignal] = useState(0);

  const handleBulkUpload = async (files: File[]) => {
    setBulkUploading(true);
    setBulkResult(null);
    setBulkProgress({ current: 0, total: files.length });

    const totals: BulkUploadResult = { created: 0, skipped: [], errors: [] };

    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append('files', files[i]);
      try {
        const data = await apiFetch<BulkUploadResult>('/api/uploads/bulk', { method: 'POST', body: fd });
        totals.created += data.created ?? 0;
        totals.skipped.push(...(data.skipped ?? []));
        totals.errors.push(...(data.errors ?? []));
      } catch (err) {
        totals.errors.push({ filename: files[i].name, error: String(err) });
      }
      setBulkProgress({ current: i + 1, total: files.length });
    }

    setBulkResult({ ...totals });
    setBulkUploading(false);
    setPaintingRefreshSignal((s) => s + 1);
  };

  if (!isAuthenticated) return <AdminLogin />;

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} uploadProgress={bulkUploading ? bulkProgress : null}>
      {activeTab === 'paintings' && (
        <AdminPaintings
          refreshSignal={paintingRefreshSignal}
          bulkUploading={bulkUploading}
          bulkProgress={bulkProgress}
          bulkResult={bulkResult}
          onUpload={handleBulkUpload}
          onResetBulk={() => { setBulkResult(null); setBulkProgress(null); }}
        />
      )}
      {activeTab === 'commissions' && <AdminCommissions />}
      {activeTab === 'contact' && <AdminContact />}
      {activeTab === 'blog' && <StubSection section="blog" />}
      {activeTab === 'events' && <StubSection section="events" />}
      {activeTab === 'orders' && <StubSection section="orders" />}
    </AdminLayout>
  );
}
