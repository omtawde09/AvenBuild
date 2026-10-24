import { Repeat2, RotateCcw } from 'lucide-react';
import { useDemoDialogs } from '@/components/layout/demoDialogs';
import { Button } from '@/components/ui/Button';

/** Account switching and data reset, shared by both roles' settings. */
export function DemoDataPanel() {
  const show = useDemoDialogs((s) => s.show);
  return (
    <section aria-labelledby="account-data" className="rounded-md border border-line bg-surface p-4">
      <h2 id="account-data" className="font-semibold">
        Account
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" icon={<Repeat2 aria-hidden className="size-4" />} onClick={() => show('persona')}>
          Switch account
        </Button>
        <Button variant="danger" icon={<RotateCcw aria-hidden className="size-4" />} onClick={() => show('reset')}>
          Reset app data
        </Button>
      </div>
    </section>
  );
}
