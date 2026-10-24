import type { AttachmentId, IdFactory } from '@/domain/ids';
import type { AttachmentMeta } from '@/domain/types';

/**
 * Session-only previews for files the user picks. Binary content is never written to localStorage:
 * only AttachmentMeta is persisted, and the object URL lives here until the page is refreshed.
 */
const previews = new Map<string, string>();

export function previewUrlFor(id: string): string | null {
  return previews.get(id) ?? null;
}

export function hasSessionPreview(meta: AttachmentMeta): boolean {
  return meta.previewKind === 'session' && previews.has(meta.id);
}

export const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

export type FileCheck = { ok: true; meta: AttachmentMeta } | { ok: false; error: string };

/** Validate a chosen file and register a session preview for images. */
export function registerLocalFile(file: File, newId: IdFactory, now: string): FileCheck {
  if (!(ACCEPTED_FILE_TYPES as ReadonlyArray<string>).includes(file.type)) {
    return { ok: false, error: `${file.name}: only JPG, PNG, WebP images and PDF files are supported.` };
  }
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: `${file.name} is larger than 15 MB.` };
  if (file.size === 0) return { ok: false, error: `${file.name} is empty.` };
  const id = newId('att') as AttachmentId;
  const isImage = file.type.startsWith('image/');
  if (isImage && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') previews.set(id, URL.createObjectURL(file));
  return {
    ok: true,
    meta: { id, name: file.name.slice(0, 120), mimeType: file.type, sizeBytes: file.size, addedAt: now, previewKind: isImage ? 'session' : 'none' },
  };
}

export function revokeAllPreviews(): void {
  for (const url of previews.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
  previews.clear();
}
