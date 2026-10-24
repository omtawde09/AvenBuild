import { Repeat2, RotateCcw } from 'lucide-react';
import { useDemoDialogs } from '@/components/layout/demoDialogs';
import { useData } from '@/app/store/demoStore';
import { Button } from '@/components/ui/Button';
import { formatBytes, formatDate } from '@/lib/format';

/** Demo data controls shared by both personas' settings. */
export function DemoDataPanel() {
  const show = useDemoDialogs((s) => s.show);
  const data = useData();
  const approxBytes = new Blob([JSON.stringify(data)]).size;
  return (
    <section aria-labelledby="demo-data" className="border border-line bg-surface p-4">
      <h2 id="demo-data" className="font-semibold">
        Demo data
      </h2>
      <p className="mt-1 text-sm text-ink-2">
        Everything in this demo is stored in this browser only (about {formatBytes(approxBytes)}). It isn’t sent anywhere and won’t appear on other devices. Sample scenario dated from {formatDate(data.meta.seedAnchor)}.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" icon={<Repeat2 aria-hidden className="size-4" />} onClick={() => show('persona')}>
          Switch demo persona
        </Button>
        <Button variant="danger" icon={<RotateCcw aria-hidden className="size-4" />} onClick={() => show('reset')}>
          Reset demo data
        </Button>
      </div>
    </section>
  );
}
