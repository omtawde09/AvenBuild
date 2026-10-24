import { useId, useRef, useState } from 'react';
import { FileText, ImageOff, Paperclip, Trash2 } from 'lucide-react';
import type { AttachmentMeta } from '@/domain/types';
import { randomIdFactory } from '@/domain/ids';
import { formatBytes, formatShortDate } from '@/lib/format';
import { ACCEPTED_FILE_TYPES, previewUrlFor, registerLocalFile } from '@/lib/storage/sessionPreviews';
import { getClock } from '@/app/store/demoStore';
import { cn } from '@/lib/cn';
import { seedArtLabel } from '@/lib/art';
import { SeedArt } from './SeedArt';

/** Thumbnail for an attachment: bundled illustration, session preview, or a clear "no preview" state. */
export function AttachmentThumb({ file, className }: { file: AttachmentMeta; className?: string }) {
  if (file.previewKind === 'seed') return <SeedArt art={file.seedArt} className={cn('rounded-xs border border-line', className)} />;
  const url = file.previewKind === 'session' ? previewUrlFor(file.id) : null;
  if (url) return <img src={url} alt={`Preview of ${file.name}`} className={cn('rounded-xs border border-line object-cover', className)} />;
  const Icon = file.mimeType.startsWith('image/') ? ImageOff : FileText;
  return (
    <div className={cn('flex items-center justify-center rounded-xs border border-line bg-sunken text-ink-3', className)} aria-hidden>
      <Icon className="size-6" />
    </div>
  );
}

function previewNote(file: AttachmentMeta): string {
  if (file.previewKind === 'seed') return `Sample illustration (${seedArtLabel(file.seedArt).toLowerCase()})`;
  if (file.previewKind === 'session') return previewUrlFor(file.id) ? 'Preview available until you refresh' : 'Preview not available after refresh — files aren’t stored in this demo';
  return file.mimeType === 'application/pdf' ? 'PDF · name and size only (not stored)' : 'No preview';
}

export function AttachmentList({
  files,
  onRemove,
  empty = 'No files attached.',
  className,
  meta,
  canRemove,
}: {
  files: ReadonlyArray<AttachmentMeta>;
  onRemove?: (file: AttachmentMeta) => void;
  canRemove?: (file: AttachmentMeta) => boolean;
  empty?: string;
  className?: string;
  meta?: (file: AttachmentMeta) => React.ReactNode;
}) {
  if (!files.length) return <p className={cn('text-sm text-ink-3', className)}>{empty}</p>;
  return (
    <ul className={cn('divide-y divide-line border-y border-line', className)}>
      {files.map((f) => (
        <li key={f.id} className="flex items-center gap-3 py-2.5">
          <AttachmentThumb file={f} className="size-14 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{f.name}</p>
            <p className="text-xs text-ink-3">
              {formatBytes(f.sizeBytes)} · added {formatShortDate(f.addedAt)}
              {meta ? <> · {meta(f)}</> : null}
            </p>
            <p className="text-xs text-ink-3">{previewNote(f)}</p>
          </div>
          {onRemove && (canRemove?.(f) ?? true) ? (
            <button
              type="button"
              onClick={() => onRemove(f)}
              aria-label={`Remove ${f.name}`}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-2 hover:bg-bad-tint hover:text-bad"
            >
              <Trash2 aria-hidden className="size-4" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** File picker that validates type/size and returns metadata only (binary content is never persisted). */
export function FilePicker({
  label = 'Add files',
  onAdd,
  max,
  current,
  imagesOnly = false,
}: {
  label?: string;
  onAdd: (files: AttachmentMeta[]) => void;
  max: number;
  current: number;
  imagesOnly?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [errors, setErrors] = useState<string[]>([]);
  const remaining = max - current;
  const accept = imagesOnly ? ACCEPTED_FILE_TYPES.filter((t) => t.startsWith('image/')).join(',') : ACCEPTED_FILE_TYPES.join(',');
  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        aria-describedby={`${id}-help`}
        onChange={(e) => {
          const chosen = Array.from(e.target.files ?? []);
          e.target.value = '';
          const now = getClock()().toISOString();
          const ok: AttachmentMeta[] = [];
          const errs: string[] = [];
          for (const file of chosen) {
            if (ok.length >= remaining) {
              errs.push(`Only ${max} files can be attached; ${file.name} was skipped.`);
              continue;
            }
            const r = registerLocalFile(file, randomIdFactory, now);
            if (r.ok) ok.push(r.meta);
            else errs.push(r.error);
          }
          setErrors(errs);
          if (ok.length) onAdd(ok);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={remaining <= 0}
        className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-dashed border-line-strong bg-surface px-4 text-sm font-medium hover:border-ink disabled:cursor-not-allowed disabled:opacity-55"
      >
        <Paperclip aria-hidden className="size-4" />
        {label}
      </button>
      <p id={`${id}-help`} className="mt-1.5 text-xs text-ink-3">
        {imagesOnly ? 'JPG, PNG or WebP' : 'JPG, PNG, WebP or PDF'}, up to 15 MB each · {remaining > 0 ? `${remaining} more allowed` : 'limit reached'}. Files stay on your device: only
        the name and size are saved, and image previews last until you refresh.
      </p>
      {errors.length ? (
        <ul className="mt-2 space-y-1 text-sm text-bad" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
