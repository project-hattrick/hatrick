import { DashboardLayoutLab } from '@/components/home/dashboard/layout-lab';

export const metadata = {
  title: 'Dashboard Layouts — Hatrick',
};

/** Dev page: compares the candidate home-dashboard structures (sections only, no live data). */
export default function DashboardLayoutsPage() {
  return (
    <main className="min-h-screen bg-background">
      <DashboardLayoutLab />
    </main>
  );
}
