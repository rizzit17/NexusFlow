// ============================================================
// DS NexusFlow — Landing page layout
// Renders over the root layout (sidebar + topbar) by using
// position: fixed; inset: 0 so the sidebar/topbar are hidden.
// ============================================================

export default function IntroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflowY: 'auto',
        background: '#FFFFFF',
      }}
    >
      {children}
    </div>
  );
}
