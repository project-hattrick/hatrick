import { TxlineTester } from '@/components/txline-tester/txline-tester';

export const metadata = {
  title: 'TxLINE Match Tester — Hat-trick',
};

export default function TxlineTesterPage() {
  return (
    <main className="min-h-screen bg-background">
      <TxlineTester />
    </main>
  );
}
