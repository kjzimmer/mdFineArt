export function Footer() {
  return (
    <footer className="border-t border-border bg-bg/95 text-sm text-text/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <p>© {new Date().getFullYear()} Melody DeBenedictis. All rights reserved.</p>
        <p>Hand-painted Western oil paintings, commissions, and studio journal.</p>
      </div>
    </footer>
  );
}
