import { FieldCalibrator } from '@/components/aligner/field-calibrator';

export const metadata = {
  title: 'Field Calibrator — Hat-trick',
};

/** Dev tool: trace the court's playable trapezoid + goals and read back the metrics() ratios. */
export default function FieldCalibratorPage() {
  return (
    <main className="min-h-screen bg-background">
      <FieldCalibrator />
    </main>
  );
}
