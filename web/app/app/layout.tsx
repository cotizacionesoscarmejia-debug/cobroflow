import { BottomNav } from '@/components/app/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--bg)] pb-24 [font-family:var(--font-body)]">
      {children}
      <BottomNav />
    </div>
  );
}
