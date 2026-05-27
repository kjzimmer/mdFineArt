import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { TopNav } from './TopNav';

export function Layout() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="page-shell mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
