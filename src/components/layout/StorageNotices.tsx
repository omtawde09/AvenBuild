import { useDemoStore } from '@/app/store/demoStore';
import { Notice } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';

/** Non-blocking messages when saved data was recovered or can't be saved. */
export function StorageNotices() {
  const notices = useDemoStore((s) => s.notices);
  const dismiss = useDemoStore((s) => s.dismissNotice);
  if (!notices.length) return null;
  return (
    <div className="container-page flex flex-col gap-2 pt-4">
      {notices.map((n) => (
        <Notice
          key={n.id}
          tone={n.tone === 'error' ? 'error' : 'warn'}
          title={n.title}
          action={
            n.id === 'save_failed' ? null : (
              <Button size="sm" variant="secondary" onClick={() => dismiss(n.id)}>
                Dismiss
              </Button>
            )
          }
        >
          {n.body}
        </Notice>
      ))}
    </div>
  );
}
